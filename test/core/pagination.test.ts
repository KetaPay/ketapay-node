import { describe, expect, it } from 'vitest'
import { client, mockFetch, page } from '../helpers.js'

describe('pagination', () => {
  it('[PAG-001] awaits the first page', async () => {
    const { fetch } = mockFetch(page([{ id: 'e1' }], 'cur_2'))
    const first = await client(fetch).escrows.list()
    expect(first.data).toEqual([{ id: 'e1' }])
    expect(first.next_cursor).toBe('cur_2')
  })

  it('[PAG-002] walks every page with for await, passing the cursor and keeping filters', async () => {
    const { fetch, calls } = mockFetch(page([{ id: 'e1' }, { id: 'e2' }], 'cur_2'), page([{ id: 'e3' }], null))
    const ids: string[] = []
    for await (const escrow of client(fetch).escrows.list({ status: 'active' })) ids.push(escrow.id)
    expect(ids).toEqual(['e1', 'e2', 'e3'])
    expect(calls[1]!.url).toBe('https://api.ketapay.com/v1/escrows?status=active&cursor=cur_2')
  })

  it('[PAG-003] gives the first page with its response', async () => {
    const { fetch } = mockFetch({ ...page([], null), headers: { 'KetaPay-Request-Id': 'req_9' } })
    const { data, requestId } = await client(fetch).events.list().withResponse()
    expect(data.object).toBe('list')
    expect(requestId).toBe('req_9')
  })
})
