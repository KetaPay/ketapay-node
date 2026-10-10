import { KetaPay, type KetaPayConfig } from '../src/index.js'

export interface RecordedCall {
  url: string
  method: string
  headers: Record<string, string>
  body: BodyInit | null | undefined
  signal: AbortSignal | null | undefined
}

type Reply = { status?: number; body?: unknown; headers?: Record<string, string> } | Error

/** A fetch that answers from a queue of replies and records every call. */
export function mockFetch(...replies: Reply[]) {
  const calls: RecordedCall[] = []
  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: { ...((init?.headers ?? {}) as Record<string, string>) },
      body: init?.body,
      signal: init?.signal,
    })
    const reply = replies.shift() ?? { status: 200, body: {} }
    if (reply instanceof Error) throw reply
    return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json', ...reply.headers },
    })
  }
  return { fetch: fetch as typeof globalThis.fetch, calls }
}

/** A fetch that never answers until its signal aborts. */
export function hangingFetch(): typeof globalThis.fetch {
  return ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new Error('aborted')))
    })) as typeof globalThis.fetch
}

export function client(fetch: typeof globalThis.fetch, config: Partial<KetaPayConfig> = {}) {
  return new KetaPay({ apiKey: 'sk_test_123', fetch, maxRetries: 2, logLevel: 'off', ...config })
}

export function apiError(status: number, type: string, code: string, param: string | null = null) {
  return {
    status,
    body: { error: { type, code, message: `${code} happened`, param, request_id: 'req_abc' } },
  }
}

export const page = (data: unknown[], next: string | null) => ({
  body: { object: 'list', data, has_more: next !== null, next_cursor: next },
})
