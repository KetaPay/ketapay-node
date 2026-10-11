import { APIPromise, type WithResponse } from './api-promise.js'
import { randomId } from './crypto.js'
import { ConnectionError, errorFromResponse, KetaPayError, RequestAbortedError } from './errors.js'
import { createLogger, type Logger } from './logger.js'
import type { KetaPayConfig, RequestOptions } from './options.js'
import { VERSION } from './version.js'

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>
export type Method = 'GET' | 'POST' | 'DELETE'

export interface RequestArgs {
  query?: Query | undefined
  body?: unknown
  form?: FormData
  options?: RequestOptions | undefined
}

const DEFAULT_BASE_URL = 'https://api.ketapay.com/v1'

export class HttpClient {
  readonly livemode: boolean
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly maxRetries: number
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch
  private readonly defaultHeaders: Record<string, string>
  private readonly log: Logger

  constructor(config: KetaPayConfig) {
    if (!config?.apiKey) throw new TypeError('KetaPay: apiKey is required')
    if (config.apiKey.startsWith('pk_')) {
      throw new TypeError('KetaPay: publishable keys (pk_) only work with @ketapay/checkout. Use your secret key.')
    }
    if (!/^sk_(test|live)_/.test(config.apiKey)) {
      throw new TypeError('KetaPay: apiKey must start with sk_test_ or sk_live_')
    }
    this.apiKey = config.apiKey
    this.livemode = config.apiKey.startsWith('sk_live_')
    this.baseUrl = trimTrailingSlashes(config.baseUrl ?? DEFAULT_BASE_URL)
    if (!isSafeBaseUrl(this.baseUrl)) {
      throw new TypeError('KetaPay: baseUrl must use https (plain http is only allowed for localhost)')
    }
    this.maxRetries = config.maxRetries ?? 2
    this.timeoutMs = config.timeoutMs ?? 30_000
    this.fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis)
    this.defaultHeaders = config.defaultHeaders ?? {}
    this.log = createLogger(config.logLevel, config.logger)
    if (!this.fetchImpl) throw new TypeError('KetaPay: no global fetch found. Use Node 18 or later, or pass `fetch`.')
  }

  request<T>(method: Method, path: string, args: RequestArgs = {}): APIPromise<T> {
    return new APIPromise(this.send<T>(method, path, args))
  }

  async send<T>(method: Method, path: string, args: RequestArgs = {}): Promise<WithResponse<T>> {
    const { query, body, form, options } = args
    const url = this.baseUrl + path + toQueryString(query)
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': userAgent(),
    }
    if (method === 'POST') headers['Idempotency-Key'] = options?.idempotencyKey ?? (await randomId())
    if (options?.customerToken) headers['KetaPay-Customer-Token'] = options.customerToken
    let payload: BodyInit | undefined
    if (form) {
      payload = form
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }

    const userSignal = options?.signal
    const maxRetries = options?.maxRetries ?? this.maxRetries
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs
    for (let attempt = 0; ; attempt++) {
      if (userSignal?.aborted) throw aborted()
      const started = Date.now()
      this.log.debug('request', { method, path, attempt })
      let response: Response
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body: payload,
          signal: combineSignals(userSignal, AbortSignal.timeout(timeoutMs)),
        })
      } catch (cause) {
        if (userSignal?.aborted) throw aborted()
        const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
        if (attempt < maxRetries) {
          const wait = backoffMs(attempt)
          this.log.warn('retrying after a network error', { method, path, attempt, waitMs: wait, timedOut })
          await sleep(wait, userSignal)
          continue
        }
        throw new ConnectionError(timedOut ? `Request timed out after ${timeoutMs}ms` : 'Could not reach KetaPay', {
          type: 'connection_error',
          code: timedOut ? 'timeout' : 'network_error',
        })
      }

      const requestId = response.headers.get('KetaPay-Request-Id')
      const data = await readJson(response)
      this.log.debug('response', { method, path, status: response.status, requestId, ms: Date.now() - started })
      if (response.ok) return { data: data as T, response, requestId }

      const retryable = response.status === 429 || response.status >= 500
      if (retryable && attempt < maxRetries) {
        const wait = retryDelayMs(response, attempt)
        this.log.warn('retrying', { method, path, status: response.status, requestId, attempt, waitMs: wait })
        await sleep(wait, userSignal)
        continue
      }
      throw errorFromResponse(response.status, data, requestId)
    }
  }
}

/** Without a regex: `/\/+$/` is quadratic on a string of many slashes (CodeQL js/polynomial-redos). */
function trimTrailingSlashes(url: string): string {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') end--
  return url.slice(0, end)
}

function isSafeBaseUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' || (protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname))
  } catch {
    return false
  }
}

function userAgent(): string {
  const runtime =
    typeof process !== 'undefined' && process.versions?.node ? `node/${process.versions.node}` : 'runtime/unknown'
  return `ketapay-node/${VERSION} ${runtime}`
}

function aborted(): RequestAbortedError {
  return new RequestAbortedError('Request was aborted', { type: 'aborted', code: 'aborted' })
}

function combineSignals(user: AbortSignal | undefined, timeout: AbortSignal): AbortSignal {
  if (!user) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([user, timeout])
  const controller = new AbortController()
  const abort = () => controller.abort()
  user.addEventListener('abort', abort, { once: true })
  timeout.addEventListener('abort', abort, { once: true })
  return controller.signal
}

function toQueryString(query: Query | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    if (response.ok) {
      throw new KetaPayError('KetaPay returned a response that is not JSON', {
        type: 'api_error',
        code: 'invalid_response',
        statusCode: response.status,
      })
    }
    return null
  }
}

function backoffMs(attempt: number): number {
  const base = Math.min(500 * 2 ** attempt, 8_000)
  return base / 2 + Math.random() * (base / 2)
}

function retryDelayMs(response: Response, attempt: number): number {
  const reset = Number(response.headers.get('X-RateLimit-Reset'))
  if (response.status === 429 && Number.isFinite(reset) && reset > 0) {
    const wait = reset * 1000 - Date.now()
    if (wait > 0) return Math.min(wait, 10_000)
  }
  return backoffMs(attempt)
}

function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted())
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(aborted())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
