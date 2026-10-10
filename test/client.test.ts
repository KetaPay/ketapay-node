import { describe, expect, it } from 'vitest'
import {
  APIError,
  AuthenticationError,
  ConnectionError,
  InvalidRequestError,
  KetaPay,
  PermissionError,
  RateLimitError,
} from '../src/index.js'
import { apiError, client, mockFetch } from './helpers.js'

describe('keys', () => {
  it('accepts test and live secret keys and reports livemode', () => {
    expect(new KetaPay('sk_test_x').livemode).toBe(false)
    expect(new KetaPay('sk_live_x').livemode).toBe(true)
  })

  it('rejects publishable keys and anything that is not a secret key', () => {
    expect(() => new KetaPay('pk_test_x')).toThrow(/publishable/)
    expect(() => new KetaPay('abc')).toThrow(/sk_test_ or sk_live_/)
    expect(() => new KetaPay('')).toThrow(/apiKey is required/)
  })
})

describe('requests', () => {
  it('sends the key, JSON body and an idempotency key on POST', async () => {
    const { fetch, calls } = mockFetch({ body: { id: 'cs_1' } })
    await client(fetch).checkoutSessions.cancel('cs_1')
    const call = calls[0]!
    expect(call.url).toBe('https://api.ketapay.com/v1/checkout_sessions/cs_1/cancel')
    expect(call.method).toBe('POST')
    expect(call.headers.Authorization).toBe('Bearer sk_test_123')
    expect(call.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/)
    expect(call.headers['User-Agent']).toMatch(/^ketapay-node\//)
  })

  it('uses the idempotency key you pass', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).checkoutSessions.cancel('cs_1', { idempotencyKey: 'order-42' })
    expect(calls[0]!.headers['Idempotency-Key']).toBe('order-42')
  })

  it('sends no idempotency key on GET and encodes query parameters', async () => {
    const { fetch, calls } = mockFetch({ body: { object: 'list', data: [], has_more: false, next_cursor: null } })
    await client(fetch).escrows.list({ status: 'active', external_reference: 'a b&c', limit: 5 })
    expect(calls[0]!.headers['Idempotency-Key']).toBeUndefined()
    expect(calls[0]!.url).toBe('https://api.ketapay.com/v1/escrows?status=active&external_reference=a+b%26c&limit=5')
  })

  it('sends the customer token header', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).disputes.concede('dp_1', { customerToken: 'ctk_test_9' })
    expect(calls[0]!.headers['KetaPay-Customer-Token']).toBe('ctk_test_9')
  })

  it('encodes ids so they cannot change the route', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).escrows.retrieve('../webhook_endpoints')
    expect(calls[0]!.url).toBe('https://api.ketapay.com/v1/escrows/..%2Fwebhook_endpoints')
  })

  it('honours a custom base URL', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch, { baseUrl: 'http://localhost:4010/' }).escrows.retrieve('e1')
    expect(calls[0]!.url).toBe('http://localhost:4010/escrows/e1')
  })
})

describe('errors', () => {
  it.each([
    [apiError(400, 'invalid_request_error', 'parameter_invalid', 'buyer.phone'), InvalidRequestError],
    [apiError(401, 'authentication_error', 'api_key_invalid'), AuthenticationError],
    [apiError(403, 'permission_error', 'customer_not_allowed'), PermissionError],
  ])('maps %#', async (reply, ErrorClass) => {
    const { fetch } = mockFetch(reply)
    const err = await client(fetch)
      .escrows.retrieve('e1')
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ErrorClass)
    expect(err).toMatchObject({ code: reply.body.error.code, requestId: 'req_abc', statusCode: reply.status })
  })

  it('keeps the param that was wrong', async () => {
    const { fetch } = mockFetch(apiError(400, 'invalid_request_error', 'parameter_invalid', 'buyer.phone'))
    const err = await client(fetch)
      .escrows.retrieve('e1')
      .catch((e: unknown) => e)
    expect(err).toMatchObject({ param: 'buyer.phone' })
  })
})

describe('retries', () => {
  it('retries 5xx with the same idempotency key, then succeeds', async () => {
    const { fetch, calls } = mockFetch(apiError(500, 'api_error', 'internal_error'), { body: { id: 'e1' } })
    const result = await client(fetch).checkoutSessions.cancel('cs_1')
    expect(result).toEqual({ id: 'e1' })
    expect(calls).toHaveLength(2)
    expect(calls[0]!.headers['Idempotency-Key']).toBe(calls[1]!.headers['Idempotency-Key'])
  })

  it('retries 429 and network errors', async () => {
    const { fetch, calls } = mockFetch(
      apiError(429, 'rate_limit_error', 'rate_limited'),
      new TypeError('fetch failed'),
      { body: { ok: true } },
    )
    await expect(client(fetch).escrows.retrieve('e1')).resolves.toEqual({ ok: true })
    expect(calls).toHaveLength(3)
  })

  it('does not retry 4xx', async () => {
    const { fetch, calls } = mockFetch(apiError(409, 'invalid_request_error', 'dispute_open'), { body: {} })
    await expect(client(fetch).escrows.retrieve('e1')).rejects.toBeInstanceOf(InvalidRequestError)
    expect(calls).toHaveLength(1)
  })

  it('gives up after maxRetries', async () => {
    const { fetch, calls } = mockFetch(
      apiError(503, 'api_error', 'internal_error'),
      apiError(503, 'api_error', 'internal_error'),
    )
    await expect(client(fetch, { maxRetries: 1 }).escrows.retrieve('e1')).rejects.toBeInstanceOf(APIError)
    expect(calls).toHaveLength(2)
  })

  it('throws RateLimitError when retries run out on 429', async () => {
    const { fetch } = mockFetch(apiError(429, 'rate_limit_error', 'rate_limited'))
    await expect(client(fetch, { maxRetries: 0 }).escrows.retrieve('e1')).rejects.toBeInstanceOf(RateLimitError)
  })

  it('throws ConnectionError when the network keeps failing', async () => {
    const { fetch } = mockFetch(new TypeError('fetch failed'))
    const err = await client(fetch, { maxRetries: 0 })
      .escrows.retrieve('e1')
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ConnectionError)
    expect(err).toMatchObject({ code: 'network_error' })
  })
})
