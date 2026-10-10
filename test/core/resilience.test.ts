import { describe, expect, it } from 'vitest'
import { ConnectionError, RequestAbortedError } from '../../src/index.js'
import { apiError, client, hangingFetch, mockFetch } from '../helpers.js'

describe('resilience', () => {
  it('[RES-004] waits for X-RateLimit-Reset on 429 before retrying', async () => {
    const reset = Math.ceil(Date.now() / 1000) + 1
    const { fetch, calls } = mockFetch(
      { ...apiError(429, 'rate_limit_error', 'rate_limited'), headers: { 'X-RateLimit-Reset': String(reset) } },
      { body: { ok: true } },
    )
    const started = Date.now()
    await expect(client(fetch).escrows.retrieve('e1')).resolves.toEqual({ ok: true })
    expect(calls).toHaveLength(2)
    expect(Date.now()).toBeGreaterThanOrEqual(reset * 1000 - 50)
    expect(Date.now() - started).toBeLessThan(10_000)
  })

  it('[RES-005] raises a connection error with code timeout when a request takes too long', async () => {
    const err = await client(hangingFetch(), { maxRetries: 0 })
      .escrows.retrieve('e1', { timeoutMs: 50 })
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ConnectionError)
    expect(err).toMatchObject({ code: 'timeout' })
  })

  it('[RES-006] stops during the backoff wait when aborted, without another attempt', async () => {
    const controller = new AbortController()
    const { fetch, calls } = mockFetch(apiError(503, 'api_error', 'internal_error'), { body: {} })
    const pending = client(fetch, { maxRetries: 2 }).escrows.retrieve('e1', { signal: controller.signal })
    setTimeout(() => controller.abort(), 20)
    await expect(pending).rejects.toBeInstanceOf(RequestAbortedError)
    expect(calls).toHaveLength(1)
  })
})
