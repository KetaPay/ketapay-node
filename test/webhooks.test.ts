import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { generateTestSignatureHeader, KetaPay, verifyWebhook, WebhookSignatureError } from '../src/index.js'

const secret = 'whsec_test_secret'
const body = JSON.stringify({ id: 'evt_1', object: 'event', type: 'escrow.funded', data: { object: { id: 'e1' } } })
const now = 1_791_640_000

function sign(payload: string, key: string, t = now) {
  return createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(WebhookSignatureError)
    return (e as WebhookSignatureError).code
  }
  return undefined
}

describe('verifyWebhook', () => {
  it('returns the parsed event for a valid signature', () => {
    const event = verifyWebhook(body, `t=${now},v1=${sign(body, secret)}`, secret, { now })
    expect(event.id).toBe('evt_1')
  })

  it('accepts a Buffer body', () => {
    expect(verifyWebhook(Buffer.from(body), `t=${now},v1=${sign(body, secret)}`, secret, { now }).id).toBe('evt_1')
  })

  it('rejects a tampered body', () => {
    const header = `t=${now},v1=${sign(body, secret)}`
    expect(codeOf(() => verifyWebhook(body.replace('e1', 'e2'), header, secret, { now }))).toBe('signature_mismatch')
  })

  it('rejects the wrong secret', () => {
    expect(codeOf(() => verifyWebhook(body, `t=${now},v1=${sign(body, 'other')}`, secret, { now }))).toBe(
      'signature_mismatch',
    )
  })

  it('rejects a timestamp older than 5 minutes, and accepts a custom tolerance', () => {
    const old = now - 301
    const header = `t=${old},v1=${sign(body, secret, old)}`
    expect(codeOf(() => verifyWebhook(body, header, secret, { now }))).toBe('timestamp_outside_tolerance')
    expect(verifyWebhook(body, header, secret, { now, toleranceSeconds: 600 }).id).toBe('evt_1')
  })

  it('rejects a missing or malformed header', () => {
    expect(codeOf(() => verifyWebhook(body, undefined, secret, { now }))).toBe('missing_signature')
    expect(codeOf(() => verifyWebhook(body, 'v1=abc', secret, { now }))).toBe('malformed_signature')
    expect(codeOf(() => verifyWebhook(body, `t=${now},v1=zz`, secret, { now }))).toBe('signature_mismatch')
  })

  it('accepts either signature while a secret is being rotated', () => {
    const header = `t=${now},v1=${sign(body, 'whsec_new')},v1=${sign(body, 'whsec_old')}`
    expect(verifyWebhook(body, header, 'whsec_old', { now }).id).toBe('evt_1')
    expect(verifyWebhook(body, header, ['whsec_new'], { now }).id).toBe('evt_1')
  })

  it('accepts several secrets on our side', () => {
    const header = `t=${now},v1=${sign(body, 'whsec_old')}`
    expect(verifyWebhook(body, header, ['whsec_new', 'whsec_old'], { now }).id).toBe('evt_1')
  })

  it('round-trips with generateTestSignatureHeader and is reachable from the client', () => {
    const header = generateTestSignatureHeader(body, secret)
    expect(new KetaPay('sk_test_x').webhooks.verify(body, header, secret).id).toBe('evt_1')
  })
})
