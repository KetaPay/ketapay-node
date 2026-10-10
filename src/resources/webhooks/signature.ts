import { hmacSha256Hex, hmacSha256Verify } from '../../core/crypto.js'
import { WebhookSignatureError } from '../../core/errors.js'
import type { KetaPayEvent, VerifyOptions } from './types.js'

/**
 * Verifies a webhook delivery and returns the parsed event. Pass the RAW request body (a string or
 * bytes exactly as received, before any JSON parsing), the `KetaPay-Signature` header, and your
 * endpoint's signing secret. While rotating secrets, pass both secrets as an array.
 *
 * Rejects with `WebhookSignatureError` when the request must be refused. Works on any runtime
 * with Web Crypto (Node 18+, Deno, Bun, Cloudflare Workers, Vercel Edge).
 */
export async function verifyWebhook(
  payload: string | Uint8Array,
  signatureHeader: string | null | undefined,
  secret: string | string[],
  options: VerifyOptions = {},
): Promise<KetaPayEvent> {
  const body = typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
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
  if (Math.abs(now - timestamp) > (options.toleranceSeconds ?? 300)) {
    fail('timestamp_outside_tolerance', 'Webhook timestamp is too old or in the future')
  }

  const secrets = Array.isArray(secret) ? secret : [secret]
  if (secrets.length === 0 || secrets.some((s) => !s)) throw new TypeError('KetaPay: a webhook secret is required')
  const signedPayload = `${timestamp}.${body}`
  let matched = false
  for (const s of secrets) {
    for (const candidate of signatures) {
      if (await hmacSha256Verify(s, signedPayload, candidate)) matched = true
    }
  }
  if (!matched) fail('signature_mismatch', 'Webhook signature does not match')

  try {
    return JSON.parse(body) as KetaPayEvent
  } catch {
    fail('invalid_payload', 'Webhook body is not valid JSON')
  }
}

/** Builds a `KetaPay-Signature` header. For your tests only. */
export async function generateTestSignatureHeader(
  payload: string,
  secret: string,
  timestamp?: number,
): Promise<string> {
  const t = timestamp ?? Math.floor(Date.now() / 1000)
  return `t=${t},v1=${await hmacSha256Hex(secret, `${t}.${payload}`)}`
}

function fail(code: string, message: string): never {
  throw new WebhookSignatureError(message, { type: 'webhook_signature_error', code })
}
