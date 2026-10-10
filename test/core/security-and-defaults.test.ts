import { afterEach, describe, expect, it, vi } from 'vitest'
import { KetaPay } from '../../src/index.js'
import { apiError, client, mockFetch } from '../helpers.js'

afterEach(() => vi.restoreAllMocks())

describe('security', () => {
  it('[SEC-002] refuses a plain-http base URL except localhost', () => {
    expect(() => new KetaPay({ apiKey: 'sk_test_x', baseUrl: 'http://api.ketapay.com/v1' })).toThrow(/https/)
    expect(() => new KetaPay({ apiKey: 'sk_test_x', baseUrl: 'not a url' })).toThrow(/https/)
    expect(() => new KetaPay({ apiKey: 'sk_test_x', baseUrl: 'http://localhost:4010' })).not.toThrow()
    expect(() => new KetaPay({ apiKey: 'sk_test_x', baseUrl: 'http://127.0.0.1:4010' })).not.toThrow()
    expect(() => new KetaPay({ apiKey: 'sk_test_x', baseUrl: 'https://staging.example.com/v1' })).not.toThrow()
  })

  it('[SEC-006] money-moving calls require a customer token at compile time', () => {
    const k = new KetaPay('sk_test_x')
    // Never called: these lines only have to fail type-checking (npm run typecheck covers test files).
    const unused = () => {
      // @ts-expect-error a customer token is required to cancel an escrow
      void k.escrows.cancel('e1', undefined, {})
      // @ts-expect-error a customer token is required to deliver a milestone
      void k.escrows.milestones.deliver('e1', 'm1', {}, {})
      // @ts-expect-error a customer token is required to open a dispute
      void k.disputes.create('e1', { reason: 'damaged', description: 'Arrived cracked' })
      // @ts-expect-error a customer token is required to add a payout account
      void k.payoutAccounts.create({ bank_code: '057', account_number: '0123456789' })
    }
    expect(typeof unused).toBe('function')
  })
})

describe('requests and responses', () => {
  it('[REQ-004] leaves empty query values out', async () => {
    const { fetch, calls } = mockFetch({ body: { object: 'list', data: [], has_more: false, next_cursor: null } })
    await client(fetch).escrows.list({ status: undefined, limit: 5 })
    expect(calls[0]!.url).toBe('https://api.ketapay.com/v1/escrows?limit=5')
  })

  it('[REQ-001] sends no idempotency key on DELETE', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).webhookEndpoints.del('we1')
    expect(calls[0]!.headers['Idempotency-Key']).toBeUndefined()
  })

  it('[ERR-004] raises an API error when a successful response is not JSON', async () => {
    const fetch = (async () => new Response('<html>oops</html>', { status: 200 })) as typeof globalThis.fetch
    await expect(client(fetch).escrows.retrieve('e1')).rejects.toMatchObject({ code: 'invalid_response' })
  })
})

describe('defaults and logging', () => {
  it('[OPS-003] defaults to 2 retries, a 30-second timeout and the production base URL', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const { fetch, calls } = mockFetch(
      apiError(500, 'api_error', 'internal_error'),
      apiError(500, 'api_error', 'internal_error'),
      apiError(500, 'api_error', 'internal_error'),
    )
    const k = new KetaPay({ apiKey: 'sk_test_x', fetch, logLevel: 'off' })
    await expect(k.escrows.retrieve('e1')).rejects.toMatchObject({ statusCode: 500 })
    expect(calls).toHaveLength(3)
    expect(calls[0]!.url.startsWith('https://api.ketapay.com/v1/')).toBe(true)
    expect(timeout).toHaveBeenCalledWith(30_000)
  })

  it('[OPS-001] debug logs carry method, path, status, request id and timing', async () => {
    const debug = vi.fn()
    const logger = { debug, info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const { fetch } = mockFetch({ body: {}, headers: { 'KetaPay-Request-Id': 'req_7' } })
    await client(fetch, { logLevel: 'debug', logger }).escrows.retrieve('e1')
    const response = debug.mock.calls.find(([msg]) => String(msg).includes('response'))?.[1]
    expect(response).toMatchObject({ method: 'GET', path: '/escrows/e1', status: 200, requestId: 'req_7' })
    expect(typeof response.ms).toBe('number')
  })
})
