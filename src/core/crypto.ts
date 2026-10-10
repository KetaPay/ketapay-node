// Web Crypto, so the SDK runs on Node 18+, Deno, Bun, Cloudflare Workers and Vercel Edge.
// Node 18 has Web Crypto but doesn't expose it globally; there it is loaded from node:crypto, lazily and
// only when the global is missing, through a variable so edge bundlers never try to resolve it.

const encoder = new TextEncoder()
let cached: Crypto | undefined

async function webCrypto(): Promise<Crypto> {
  if (cached) return cached
  const global = globalThis.crypto
  if (global?.subtle) return (cached = global)
  try {
    const name = 'node:crypto'
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ name)) as { webcrypto?: Crypto }
    if (mod.webcrypto?.subtle) return (cached = mod.webcrypto)
  } catch {
    // fall through to the error below
  }
  throw new Error('KetaPay: Web Crypto is not available in this runtime. Use Node 18 or later.')
}

export async function randomId(): Promise<string> {
  const c = await webCrypto()
  if (typeof c.randomUUID === 'function') return c.randomUUID()
  const b = c.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const { subtle } = await webCrypto()
  return subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const { subtle } = await webCrypto()
  const signature = await subtle.sign('HMAC', await hmacKey(secret), encoder.encode(message))
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time check of a hex HMAC-SHA256 signature. */
export async function hmacSha256Verify(secret: string, message: string, signatureHex: string): Promise<boolean> {
  const signature = hexToBytes(signatureHex)
  if (!signature || signature.length !== 32) return false
  const { subtle } = await webCrypto()
  return subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(message))
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}
