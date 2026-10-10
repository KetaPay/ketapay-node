import { createHmac, timingSafeEqual } from 'node:crypto'
import { WebhookSignatureError } from './errors.js'
import type { KetaPayEvent } from './types.js'

export interface VerifyOptions {
  /** Oldest signature to accept, in seconds. Defaults to 300 (5 minutes). */
  toleranceSeconds?: number
  /** Override the clock, for tests. Unix seconds. */
  now?: number
}

/**
 * Verifies a webhook delivery and returns the parsed event. Pass the RAW request body (a string or
 * Buffer exactly as received, before any JSON parsing), the `KetaPay-Signature` header, and your
 * endpoint's signing secret. While rotating secrets, pass both secrets as an array.
 *
 * Throws `WebhookSignatureError` when the request must be rejected.
 */
export function verifyWebhook(
  payload: string | Uint8Array,
  signatureHeader: string | null | undefined,
  secret: string | string[],
  options: VerifyOptions = {},
): KetaPayEvent {
  const body = typeof payload === 'string' ? payload : Buffer.from(payload).toString('utf8')
  if (!signatureHeader) fail('missing_signature', 'No KetaPay-Signature header')

  let timestamp: number | undefined
  const signatures: string[] = []
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.trim().split('=', 2)
    if (key === 't' && value) timestamp = Number(value)
    if (key === 'v1' && value) signatures.push(value)
  }
  if (!timestamp || !Number.isFinite(timestamp) || signatures.length === 0) {
    fail('malformed_signature', 'KetaPay-Signature header is malformed')
  }

  const now = options.now ?? Math.floor(Date.now() / 1000)
  const tolerance = options.toleranceSeconds ?? 300
  if (Math.abs(now - timestamp) > tolerance) {
    fail('timestamp_outside_tolerance', 'Webhook timestamp is too old or in the future')
  }

  const secrets = Array.isArray(secret) ? secret : [secret]
  if (secrets.length === 0 || secrets.some((s) => !s)) throw new TypeError('KetaPay: a webhook secret is required')
  const signedPayload = `${timestamp}.${body}`
  const matched = secrets.some((s) => {
    const expected = createHmac('sha256', s).update(signedPayload, 'utf8').digest()
    return signatures.some((candidate) => safeEqualHex(expected, candidate))
  })
  if (!matched) fail('signature_mismatch', 'Webhook signature does not match')

  try {
    return JSON.parse(body) as KetaPayEvent
  } catch {
    fail('invalid_payload', 'Webhook body is not valid JSON')
  }
}

function safeEqualHex(expected: Buffer, candidateHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(candidateHex) || candidateHex.length !== expected.length * 2) return false
  return timingSafeEqual(expected, Buffer.from(candidateHex, 'hex'))
}

function fail(code: string, message: string): never {
  throw new WebhookSignatureError(message, { type: 'webhook_signature_error', code })
}

/** Builds a `KetaPay-Signature` header. For your tests only. */
export function generateTestSignatureHeader(payload: string, secret: string, timestamp?: number): string {
  const t = timestamp ?? Math.floor(Date.now() / 1000)
  const v1 = createHmac('sha256', secret).update(`${t}.${payload}`, 'utf8').digest('hex')
  return `t=${t},v1=${v1}`
}
