import { describe, expect, it } from 'vitest'
import { client, mockFetch } from '../helpers.js'

describe('request bodies', () => {
  it('[REQ-007] sends one-time codes in the body', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).customerSessions.verify('cus_1', '123456')
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ code: '123456' })
  })

  it('[REQ-007] sends the release code for an in-person release', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).escrows.milestones.release('e1', 'm1', { release_code: '731045' })
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ release_code: '731045' })
  })
})
