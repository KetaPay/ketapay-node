import { describe, expect, it } from 'vitest'
import { client, mockFetch } from './helpers.js'

const page = (data: unknown[], next: string | null) => ({
  body: { object: 'list', data, has_more: next !== null, next_cursor: next },
})

describe('pagination', () => {
  it('awaits one page', async () => {
    const { fetch } = mockFetch(page([{ id: 'e1' }], 'cur_2'))
    const first = await client(fetch).escrows.list()
    expect(first.data).toEqual([{ id: 'e1' }])
    expect(first.next_cursor).toBe('cur_2')
  })

  it('walks every page with for await, passing the cursor and keeping filters', async () => {
    const { fetch, calls } = mockFetch(page([{ id: 'e1' }, { id: 'e2' }], 'cur_2'), page([{ id: 'e3' }], null))
    const ids: string[] = []
    for await (const escrow of client(fetch).escrows.list({ status: 'active' })) ids.push(escrow.id)
    expect(ids).toEqual(['e1', 'e2', 'e3'])
    expect(calls[1]!.url).toBe('https://api.ketapay.com/v1/escrows?status=active&cursor=cur_2')
  })
})

describe('routes', () => {
  it.each([
    [
      'milestone deliver',
      (k: ReturnType<typeof client>) =>
        k.escrows.milestones.deliver('e1', 'm1', { note: 'Done' }, { customerToken: 't' }),
      'POST',
      '/escrows/e1/milestones/m1/deliver',
    ],
    [
      'milestone release',
      (k: ReturnType<typeof client>) => k.escrows.milestones.release('e1', 'm1', { release_code: '123456' }),
      'POST',
      '/escrows/e1/milestones/m1/release',
    ],
    [
      'release code',
      (k: ReturnType<typeof client>) => k.escrows.milestones.releaseCode('e1', 'm1', { customerToken: 't' }),
      'GET',
      '/escrows/e1/milestones/m1/release_code',
    ],
    [
      'open dispute',
      (k: ReturnType<typeof client>) =>
        k.disputes.create('e1', { reason: 'damaged', description: 'Screen arrived cracked' }, { customerToken: 't' }),
      'POST',
      '/escrows/e1/disputes',
    ],
    [
      'submit evidence',
      (k: ReturnType<typeof client>) =>
        k.disputes.submitEvidence('d1', { statement: 'Photos attached here' }, { customerToken: 't' }),
      'POST',
      '/disputes/d1/evidence',
    ],
    [
      'chargebacks',
      (k: ReturnType<typeof client>) => k.chargebacks.listForEscrow('e1'),
      'GET',
      '/escrows/e1/chargebacks',
    ],
    [
      'confirm payout account',
      (k: ReturnType<typeof client>) => k.payoutAccounts.confirm('pa1', '123456', { customerToken: 't' }),
      'POST',
      '/payout_accounts/pa1/confirm',
    ],
    [
      'delete payout account',
      (k: ReturnType<typeof client>) => k.payoutAccounts.del('pa1', { customerToken: 't' }),
      'DELETE',
      '/payout_accounts/pa1',
    ],
    [
      'rotate secret',
      (k: ReturnType<typeof client>) => k.webhookEndpoints.rotateSecret('we1'),
      'POST',
      '/webhook_endpoints/we1/rotate_secret',
    ],
    [
      'update endpoint',
      (k: ReturnType<typeof client>) => k.webhookEndpoints.update('we1', { status: 'enabled' }),
      'POST',
      '/webhook_endpoints/we1',
    ],
    [
      'sandbox pay',
      (k: ReturnType<typeof client>) => k.testHelpers.checkoutSessions.pay('cs1'),
      'POST',
      '/test_helpers/checkout_sessions/cs1/pay',
    ],
    [
      'sandbox simulate',
      (k: ReturnType<typeof client>) => k.testHelpers.escrows.simulate('e1', { action: 'deliver', milestone_id: 'm1' }),
      'POST',
      '/test_helpers/escrows/e1/simulate',
    ],
  ] as const)('%s', async (_name, call, method, path) => {
    const { fetch, calls } = mockFetch({ body: {} })
    await call(client(fetch))
    expect(calls[0]!.method).toBe(method)
    expect(calls[0]!.url).toBe(`https://api.ketapay.com/v1${path}`)
  })

  it('sends verify codes in the body', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    await client(fetch).customerSessions.verify('cus_1', '123456')
    expect(JSON.parse(String(calls[0]!.body))).toEqual({ code: '123456' })
  })
})

describe('files', () => {
  it('uploads as multipart with the purpose, without a JSON content type', async () => {
    const { fetch, calls } = mockFetch({ body: { id: 'f1' } })
    await client(fetch).files.create(
      { file: new TextEncoder().encode('%PDF'), filename: 'brief.pdf', purpose: 'agreement' },
      { customerToken: 't' },
    )
    const body = calls[0]!.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('purpose')).toBe('agreement')
    expect((body.get('file') as File).name).toBe('brief.pdf')
    expect(calls[0]!.headers['Content-Type']).toBeUndefined()
  })
})
