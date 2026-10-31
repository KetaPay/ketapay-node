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

  it('[REQ-009] creates a checkout session without a seller, sending no seller (the business sells it)', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).checkoutSessions.create({
      amount: 2_500_000,
      title: 'Desk lamp',
      description: 'Brass desk lamp with a warm LED bulb, boxed.',
      buyer: { email: 'ada@example.com' },
    })
    expect(JSON.parse(String(calls[0]!.body))).not.toHaveProperty('seller')
  })

  it('[REQ-010] delivers without a customer token on the business own sale, sending no token header', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).escrows.milestones.deliver('e1', 'm1', { note: 'Shipped with GIG' })
    expect(calls[0]!.headers).not.toHaveProperty('KetaPay-Customer-Token')
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ note: 'Shipped with GIG' })
  })

  it('[REQ-011] refunds with the reason in the body and an idempotency key, and no customer token', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).escrows.refund('e1', { reason: 'Out of stock, agreed by phone' })
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ reason: 'Out of stock, agreed by phone' })
    expect(calls[0]!.headers).toHaveProperty('Idempotency-Key')
    expect(calls[0]!.headers).not.toHaveProperty('KetaPay-Customer-Token')
  })

  it('[REQ-012] escalates a dispute with the customer token and an idempotency key, and no body', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).disputes.escalate('d1', { customerToken: 'tok' })
    expect(calls[0]!.url).toContain('/disputes/d1/escalate')
    expect(calls[0]!.method).toBe('POST')
    expect(calls[0]!.body).toBeFalsy()
    expect(calls[0]!.headers).toMatchObject({ 'KetaPay-Customer-Token': 'tok' })
    expect(calls[0]!.headers).toHaveProperty('Idempotency-Key')
  })

  it('[REQ-008] creates a webhook endpoint from a URL alone, leaving the events to the API default', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).webhookEndpoints.create({ url: 'https://example.com/hooks' })
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ url: 'https://example.com/hooks' })
  })
})
