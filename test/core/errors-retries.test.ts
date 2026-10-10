import { describe, expect, it, vi } from 'vitest'
import {
  APIError,
  AuthenticationError,
  ConflictError,
  ConnectionError,
  IdempotencyError,
  InvalidRequestError,
  NotFoundError,
  PermissionError,
  RateLimitError,
} from '../../src/index.js'
import { apiError, client, mockFetch } from '../helpers.js'

describe('errors', () => {
  it.each([
    [
      '400 → InvalidRequestError',
      apiError(400, 'invalid_request_error', 'parameter_invalid', 'buyer.phone'),
      InvalidRequestError,
    ],
    ['401 → AuthenticationError', apiError(401, 'authentication_error', 'api_key_invalid'), AuthenticationError],
    ['403 → PermissionError', apiError(403, 'permission_error', 'customer_not_allowed'), PermissionError],
    ['404 → NotFoundError', apiError(404, 'invalid_request_error', 'resource_not_found', 'id'), NotFoundError],
    ['409 dispute_open → ConflictError', apiError(409, 'invalid_request_error', 'dispute_open'), ConflictError],
    [
      '409 idempotency_key_reused → IdempotencyError',
      apiError(409, 'idempotency_error', 'idempotency_key_reused'),
      IdempotencyError,
    ],
  ] as const)('maps %s', async (_name, reply, ErrorClass) => {
    const { fetch } = mockFetch(reply)
    const err = await client(fetch)
      .escrows.retrieve('e1')
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ErrorClass)
    expect(err).toMatchObject({ code: reply.body.error.code, requestId: 'req_abc', statusCode: reply.status })
  })

  it('keeps NotFoundError and ConflictError catchable as InvalidRequestError', async () => {
    const { fetch } = mockFetch(apiError(404, 'invalid_request_error', 'resource_not_found'))
    await expect(client(fetch).escrows.retrieve('e1')).rejects.toBeInstanceOf(InvalidRequestError)
  })

  it('keeps the param that was wrong', async () => {
    const { fetch } = mockFetch(apiError(400, 'invalid_request_error', 'parameter_invalid', 'buyer.phone'))
    await expect(client(fetch).escrows.retrieve('e1')).rejects.toMatchObject({ param: 'buyer.phone' })
  })
})

describe('retries', () => {
  it('retries 5xx with the same idempotency key, then succeeds', async () => {
    const { fetch, calls } = mockFetch(apiError(500, 'api_error', 'internal_error'), { body: { id: 'e1' } })
    await expect(client(fetch).checkoutSessions.cancel('cs_1')).resolves.toEqual({ id: 'e1' })
    expect(calls).toHaveLength(2)
    expect(calls[0]!.headers['Idempotency-Key']).toBe(calls[1]!.headers['Idempotency-Key'])
  })

  it('retries 429 and network errors, and warns about each retry', async () => {
    const warn = vi.fn()
    const logger = { warn, debug: vi.fn(), info: vi.fn(), error: vi.fn() }
    const { fetch, calls } = mockFetch(
      apiError(429, 'rate_limit_error', 'rate_limited'),
      new TypeError('fetch failed'),
      { body: { ok: true } },
    )
    await expect(client(fetch, { logLevel: 'warn', logger }).escrows.retrieve('e1')).resolves.toEqual({ ok: true })
    expect(calls).toHaveLength(3)
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('does not retry 4xx', async () => {
    const { fetch, calls } = mockFetch(apiError(409, 'invalid_request_error', 'dispute_open'), { body: {} })
    await expect(client(fetch).escrows.retrieve('e1')).rejects.toBeInstanceOf(ConflictError)
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

  it('throws RateLimitError and ConnectionError when retries run out', async () => {
    const limited = mockFetch(apiError(429, 'rate_limit_error', 'rate_limited'))
    await expect(client(limited.fetch, { maxRetries: 0 }).escrows.retrieve('e1')).rejects.toBeInstanceOf(RateLimitError)
    const offline = mockFetch(new TypeError('fetch failed'))
    await expect(client(offline.fetch, { maxRetries: 0 }).escrows.retrieve('e1')).rejects.toMatchObject({
      constructor: ConnectionError,
      code: 'network_error',
    })
  })
})
