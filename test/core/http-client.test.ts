import { describe, expect, it, vi } from 'vitest'
import { KetaPay, RequestAbortedError, VERSION } from '../../src/index.js'
import { client, hangingFetch, mockFetch } from '../helpers.js'

describe('keys', () => {
  it('[AUTH-001] accepts test and live secret keys and reports livemode', () => {
    expect(new KetaPay('sk_test_x').livemode).toBe(false)
    expect(new KetaPay('sk_live_x').livemode).toBe(true)
  })

  it('[AUTH-002] [AUTH-003] rejects publishable keys and anything that is not a secret key', () => {
    expect(() => new KetaPay('pk_test_x')).toThrow(/publishable/)
    expect(() => new KetaPay('abc')).toThrow(/sk_test_ or sk_live_/)
    expect(() => new KetaPay('')).toThrow(/apiKey is required/)
  })
})

describe('headers', () => {
  it('[AUTH-004] [REQ-001] [REQ-003] sends the key, an idempotency key on POST and a versioned user agent', async () => {
    const { fetch, calls } = mockFetch({ body: { id: 'cs_1' } })
    await client(fetch).checkoutSessions.cancel('cs_1')
    const call = calls[0]!
    expect(call.url).toBe('https://api.ketapay.com/v1/checkout_sessions/cs_1/cancel')
    expect(call.method).toBe('POST')
    expect(call.headers.Authorization).toBe('Bearer sk_test_123')
    expect(call.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/)
    expect(call.headers['User-Agent']).toBe(`ketapay-node/${VERSION} node/${process.versions.node}`)
    expect(VERSION).not.toBe('0.0.0-dev')
  })

  it('[REQ-001] [REQ-002] uses the idempotency key you pass, and none on GET', async () => {
    const { fetch, calls } = mockFetch({ body: {} }, { body: {} })
    const k = client(fetch)
    await k.checkoutSessions.cancel('cs_1', { idempotencyKey: 'order-42' })
    await k.escrows.retrieve('e1')
    expect(calls[0]!.headers['Idempotency-Key']).toBe('order-42')
    expect(calls[1]!.headers['Idempotency-Key']).toBeUndefined()
  })

  it('[SEC-001] [REQ-006] sends the customer token, default headers and per-call headers, but never lets them replace auth', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch, { defaultHeaders: { 'X-Trace': 'a', Authorization: 'Bearer stolen' } }).disputes.concede(
      'dp_1',
      { customerToken: 'ctk_test_9', headers: { 'X-Call': 'b' } },
    )
    const headers = calls[0]!.headers
    expect(headers['KetaPay-Customer-Token']).toBe('ctk_test_9')
    expect(headers['X-Trace']).toBe('a')
    expect(headers['X-Call']).toBe('b')
    expect(headers.Authorization).toBe('Bearer sk_test_123')
  })
})

describe('urls', () => {
  it('[REQ-004] [SEC-003] encodes query parameters and ids', async () => {
    const { fetch, calls } = mockFetch({ body: { object: 'list', data: [], has_more: false, next_cursor: null } }, {})
    const k = client(fetch)
    await k.escrows.list({ status: 'active', external_reference: 'a b&c', limit: 5 })
    await k.escrows.retrieve('../webhook_endpoints')
    expect(calls[0]!.url).toBe('https://api.ketapay.com/v1/escrows?status=active&external_reference=a+b%26c&limit=5')
    expect(calls[1]!.url).toBe('https://api.ketapay.com/v1/escrows/..%2Fwebhook_endpoints')
  })

  it('[REQ-005] honours a custom base URL', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch, { baseUrl: 'http://localhost:4010/' }).escrows.retrieve('e1')
    expect(calls[0]!.url).toBe('http://localhost:4010/escrows/e1')
  })
})

describe('withResponse', () => {
  it('[ERR-005] returns the data, the raw response and the request id', async () => {
    const { fetch } = mockFetch({
      body: { id: 'e1' },
      headers: { 'KetaPay-Request-Id': 'req_123', 'X-RateLimit-Remaining': '99' },
    })
    const { data, response, requestId } = await client(fetch).escrows.retrieve('e1').withResponse()
    expect(data).toEqual({ id: 'e1' })
    expect(requestId).toBe('req_123')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99')
  })
})

describe('abort', () => {
  it('[RES-006] rejects with RequestAbortedError when the signal aborts, without retrying', async () => {
    const controller = new AbortController()
    const pending = client(hangingFetch()).escrows.retrieve('e1', { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toBeInstanceOf(RequestAbortedError)
  })

  it('[RES-006] does not send at all when the signal is already aborted', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await expect(client(fetch).escrows.retrieve('e1', { signal: AbortSignal.abort() })).rejects.toBeInstanceOf(
      RequestAbortedError,
    )
    expect(calls).toHaveLength(0)
  })
})

describe('logging', () => {
  it('[SEC-004] [OPS-001] logs requests at debug without the key, the customer token or the body', async () => {
    const debug = vi.fn()
    const logger = { debug, info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const { fetch } = mockFetch({ body: {} })
    await client(fetch, { logLevel: 'debug', logger }).escrows.cancel(
      'e1',
      { reason: 'secret reason' },
      { customerToken: 'ctk_test_9' },
    )
    const logged = JSON.stringify(debug.mock.calls)
    expect(debug).toHaveBeenCalled()
    expect(logged).not.toMatch(/sk_test_123|ctk_test_9|secret reason/)
  })

  it('[OPS-002] logs nothing at the default level on success', async () => {
    const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const { fetch } = mockFetch({ body: {} })
    await client(fetch, { logLevel: undefined, logger }).escrows.retrieve('e1')
    expect(logger.debug).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
