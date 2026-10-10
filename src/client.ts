import { randomUUID } from 'node:crypto'
import { ConnectionError, errorFromResponse, KetaPayError } from './errors.js'
import { VERSION } from './version.js'

export interface KetaPayConfig {
  /** Your secret key, `sk_test_...` or `sk_live_...`. */
  apiKey: string
  /** Defaults to `https://api.ketapay.com/v1`. */
  baseUrl?: string
  /** Retries for network errors, 429 and 5xx. Defaults to 2. */
  maxRetries?: number
  /** Per-attempt timeout. Defaults to 30 seconds. */
  timeoutMs?: number
  /** Custom fetch, for tests or proxies. Defaults to the global fetch. */
  fetch?: typeof fetch
}

export interface RequestOptions {
  /** Sent as `Idempotency-Key` on POST. Generated for you when left out, and reused across retries. */
  idempotencyKey?: string
  /** Proof from your customer, from `customerSessions.verify()`. */
  customerToken?: string
  timeoutMs?: number
  maxRetries?: number
}

/** Options for calls the API only accepts with the customer's proof. */
export type CustomerRequestOptions = RequestOptions & { customerToken: string }

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>

interface RequestArgs {
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
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.maxRetries = config.maxRetries ?? 2
    this.timeoutMs = config.timeoutMs ?? 30_000
    this.fetchImpl = config.fetch ?? globalThis.fetch
    if (!this.fetchImpl) throw new TypeError('KetaPay: no global fetch found. Use Node 18 or later, or pass `fetch`.')
  }

  async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, args: RequestArgs = {}): Promise<T> {
    const { query, body, form, options } = args
    const url = this.baseUrl + path + toQueryString(query)
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': `ketapay-node/${VERSION} node/${process.versions.node}`,
    }
    if (method === 'POST') headers['Idempotency-Key'] = options?.idempotencyKey ?? randomUUID()
    if (options?.customerToken) headers['KetaPay-Customer-Token'] = options.customerToken
    let payload: BodyInit | undefined
    if (form) {
      payload = form
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }

    const maxRetries = options?.maxRetries ?? this.maxRetries
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs
    for (let attempt = 0; ; attempt++) {
      let response: Response
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body: payload,
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (cause) {
        if (attempt < maxRetries) {
          await sleep(backoffMs(attempt))
          continue
        }
        const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
        throw new ConnectionError(timedOut ? `Request timed out after ${timeoutMs}ms` : 'Could not reach KetaPay', {
          type: 'connection_error',
          code: timedOut ? 'timeout' : 'network_error',
        })
      }

      const requestId = response.headers.get('KetaPay-Request-Id')
      const data = await readJson(response)
      if (response.ok) return data as T

      const retryable = response.status === 429 || response.status >= 500
      if (retryable && attempt < maxRetries) {
        await sleep(retryDelayMs(response, attempt))
        continue
      }
      throw errorFromResponse(response.status, data, requestId)
    }
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
