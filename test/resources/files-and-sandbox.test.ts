import { describe, expect, it } from 'vitest'
import { InvalidRequestError } from '../../src/index.js'
import { client, mockFetch } from '../helpers.js'

describe('files', () => {
  it('[SEC-007] uploads as multipart with the purpose, without a JSON content type', async () => {
    const { fetch, calls } = mockFetch({ body: { id: 'f1' } })
    await client(fetch).files.create(
      { file: new TextEncoder().encode('%PDF'), filename: 'brief.pdf', purpose: 'delivery' },
      { customerToken: 't' },
    )
    const body = calls[0]!.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('purpose')).toBe('delivery')
    expect((body.get('file') as File).name).toBe('brief.pdf')
    expect(calls[0]!.headers['Content-Type']).toBeUndefined()
  })

  it('accepts a Blob as is', async () => {
    const { fetch, calls } = mockFetch({ body: { id: 'f1' } })
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    await client(fetch).files.create({ file: blob, filename: 'a.jpg', purpose: 'dispute_evidence' })
    expect(((calls[0]!.body as FormData).get('file') as File).type).toBe('image/jpeg')
  })
})

describe('test helpers', () => {
  it('[SEC-005] fail at once with a live key, without contacting KetaPay', async () => {
    const { fetch, calls } = mockFetch({ body: {} })
    const live = client(fetch, { apiKey: 'sk_live_x' })
    const err = await live.testHelpers.escrows.simulate('e1', { action: 'deliver' }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(InvalidRequestError)
    expect(err).toMatchObject({ code: 'test_mode_only' })
    await expect(live.testHelpers.checkoutSessions.pay('cs1').withResponse()).rejects.toMatchObject({
      code: 'test_mode_only',
    })
    expect(calls).toHaveLength(0)
  })
})
