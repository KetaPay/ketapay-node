import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'

describe.skipIf(!configured)('e2e: response headers', () => {
  it('[E2E-016] responses carry a request id and rate-limit headers', async () => {
    const { response, requestId } = await ketapay().escrows.list({ limit: 1 }).withResponse()
    expect(requestId).toBeTruthy()
    for (const header of ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']) {
      expect(response.headers.get(header), header).toBeTruthy()
    }
  })
})
