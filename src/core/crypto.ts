// Web Crypto only, so the SDK runs on Node 22+, Deno, Bun, Cloudflare Workers and Vercel Edge.

function webCrypto(): Crypto {
  const c = globalThis.crypto
  if (!c?.subtle || !c.randomUUID) {
    throw new Error('KetaPay: Web Crypto is not available in this runtime. Use Node 22 or later.')
  }
  return c
}

const encoder = new TextEncoder()

export function randomId(): string {
  return webCrypto().randomUUID()
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return webCrypto().subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const signature = await webCrypto().subtle.sign('HMAC', await hmacKey(secret), encoder.encode(message))
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time check of a hex HMAC-SHA256 signature. */
export async function hmacSha256Verify(secret: string, message: string, signatureHex: string): Promise<boolean> {
  const signature = hexToBytes(signatureHex)
  if (!signature || signature.length !== 32) return false
  return webCrypto().subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(message))
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}
