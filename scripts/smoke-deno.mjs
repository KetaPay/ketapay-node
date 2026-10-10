// [PKG-005] The built package runs on Deno (an edge-style runtime with Web APIs only).
// Usage: deno run --allow-read scripts/smoke-deno.mjs   (after npm run build)
import KetaPay, { generateTestSignatureHeader, verifyWebhook } from '../dist/index.js'

const body = '{"id":"evt_1","object":"event"}'
const event = await verifyWebhook(body, await generateTestSignatureHeader(body, 'whsec_x'), 'whsec_x')
const k = new KetaPay({
  apiKey: 'sk_test_x',
  fetch: async (_url, init) => {
    if (!init.headers['Idempotency-Key']) throw new Error('missing idempotency key')
    return new Response('{"id":"cs_1"}', { headers: { 'KetaPay-Request-Id': 'req_1' } })
  },
})
const { data, requestId } = await k.checkoutSessions.cancel('cs_1').withResponse()
if (event.id !== 'evt_1' || data.id !== 'cs_1' || requestId !== 'req_1') throw new Error('Deno smoke test failed')
console.log(`deno smoke test passed (Deno ${Deno.version.deno})`)
