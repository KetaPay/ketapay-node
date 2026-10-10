import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { generateTestSignatureHeader, KetaPay, verifyWebhook, WebhookSignatureError } from '../../src/index.js'

const secret = 'whsec_test_secret'
const body = JSON.stringify({ id: 'evt_1', object: 'event', type: 'escrow.funded', data: { object: { id: 'e1' } } })
const now = 1_791_640_000

// Signed with node:crypto on purpose: proves the Web Crypto implementation matches a reference.
function sign(payload: string, key: string, t = now) {
  return createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  const err = await promise.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(err).toBeInstanceOf(WebhookSignatureError)
  return (err as WebhookSignatureError).code
}

describe('verifyWebhook', () => {
  it('returns the parsed event for a valid signature, from a string or bytes', async () => {
    const header = `t=${now},v1=${sign(body, secret)}`
    expect((await verifyWebhook(body, header, secret, { now })).id).toBe('evt_1')
    expect((await verifyWebhook(new TextEncoder().encode(body), header, secret, { now })).id).toBe('evt_1')
  })

  it('rejects a tampered body or the wrong secret', async () => {
    const header = `t=${now},v1=${sign(body, secret)}`
    expect(await codeOf(verifyWebhook(body.replace('e1', 'e2'), header, secret, { now }))).toBe('signature_mismatch')
    expect(await codeOf(verifyWebhook(body, `t=${now},v1=${sign(body, 'other')}`, secret, { now }))).toBe(
      'signature_mismatch',
    )
  })

  it('rejects a timestamp older than 5 minutes, and accepts a custom tolerance', async () => {
    const old = now - 301
    const header = `t=${old},v1=${sign(body, secret, old)}`
    expect(await codeOf(verifyWebhook(body, header, secret, { now }))).toBe('timestamp_outside_tolerance')
    expect((await verifyWebhook(body, header, secret, { now, toleranceSeconds: 600 })).id).toBe('evt_1')
  })

  it('rejects a missing, malformed or non-hex header', async () => {
    expect(await codeOf(verifyWebhook(body, undefined, secret, { now }))).toBe('missing_signature')
    expect(await codeOf(verifyWebhook(body, 'v1=abc', secret, { now }))).toBe('malformed_signature')
    expect(await codeOf(verifyWebhook(body, `t=${now},v1=zz`, secret, { now }))).toBe('signature_mismatch')
  })

  it('accepts either signature while a secret is being rotated, and several secrets on our side', async () => {
    const both = `t=${now},v1=${sign(body, 'whsec_new')},v1=${sign(body, 'whsec_old')}`
    expect((await verifyWebhook(body, both, 'whsec_old', { now })).id).toBe('evt_1')
    const oldOnly = `t=${now},v1=${sign(body, 'whsec_old')}`
    expect((await verifyWebhook(body, oldOnly, ['whsec_new', 'whsec_old'], { now })).id).toBe('evt_1')
  })

  it('round-trips with generateTestSignatureHeader and is reachable from the client', async () => {
    const header = await generateTestSignatureHeader(body, secret)
    expect((await new KetaPay('sk_test_x').webhooks.verify(body, header, secret)).id).toBe('evt_1')
  })
})
