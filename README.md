# KetaPay Node.js library

Server-side library for the [KetaPay API](https://docs.ketapay.com): put escrow inside your product. Typed, no runtime dependencies, Node 18 or later.

> Pre-release. The API is in design and this package is not published yet.

## Install

```sh
npm install @ketapay/node
```

## Quick start

```ts
import KetaPay from '@ketapay/node'

const ketapay = new KetaPay(process.env.KETAPAY_SECRET_KEY!) // sk_test_... or sk_live_...

const session = await ketapay.checkoutSessions.create({
  amount: 45_000_000, // kobo: ₦450,000
  category: 'goods',
  title: 'iPhone 15 Pro Max 256GB',
  description: 'Used, 91% battery, no scratches, Face ID works. Comes with box and cable.',
  images: [{ url: 'https://cdn.example.com/listings/8812/1.jpg' }],
  buyer: { email: 'ada@example.com', phone: '+2348012345678' },
  seller: { email: 'tunde@example.com' },
  release: { method: 'release_code' },
  external_reference: 'order_7781',
})

// Send the buyer to session.url, or open it with @ketapay/checkout.
```

Use your secret key on your server only. Publishable keys (`pk_`) are rejected here.

## Milestones

```ts
await ketapay.checkoutSessions.create({
  amount: 150_000_000,
  category: 'services',
  title: 'Company website',
  description: 'Five-page marketing site with blog. Brief attached.',
  milestones: [
    { title: 'Design', amount: 40_000_000 },
    { title: 'Build', amount: 80_000_000 },
    { title: 'Launch', amount: 30_000_000 },
  ],
  buyer: { email: 'ada@example.com' },
  seller: { email: 'tunde@example.com' },
  release: { method: 'buyer_confirms', auto_release_hours: 168 },
  commission: { rate_bps: 1000 }, // your 10% cut, from the seller's side of each release
})
```

## Acting for your customer

Moving money (delivering, releasing, cancelling, disputes, payout accounts) needs proof from your customer. KetaPay sends them a one-time code; you exchange it for a 15-minute customer token:

```ts
const otp = await ketapay.customerSessions.create({ email: 'ada@example.com' })
const { token } = await ketapay.customerSessions.verify(otp.id, codeTheyTyped)

await ketapay.escrows.milestones.release(escrowId, milestoneId, {}, { customerToken: token })
```

## Lists

Await a list for one page, or `for await` it to walk every page:

```ts
for await (const escrow of ketapay.escrows.list({ status: 'active' })) {
  console.log(escrow.id, escrow.status)
}
```

## Webhooks

Verify against the raw body, before any JSON parsing:

```ts
app.post('/webhooks/ketapay', express.raw({ type: 'application/json' }), (req, res) => {
  let event
  try {
    event = ketapay.webhooks.verify(req.body, req.header('KetaPay-Signature'), process.env.KETAPAY_WEBHOOK_SECRET!)
  } catch {
    return res.sendStatus(400)
  }
  if (event.type === 'escrow.funded') {
    // mark the order paid
  }
  res.sendStatus(200)
})
```

While rotating a secret, pass both: `verify(body, header, [newSecret, oldSecret])`.

## Errors and retries

Every error extends `KetaPayError` with `type`, `code`, `param`, `statusCode` and `requestId`. Branch on `code`:

```ts
import { InvalidRequestError } from '@ketapay/node'

try {
  await ketapay.escrows.milestones.release(escrowId, milestoneId, {}, { customerToken })
} catch (err) {
  if (err instanceof InvalidRequestError && err.code === 'dispute_open') {
    // show "this milestone is in dispute"
  }
}
```

Network errors, `429` and `5xx` are retried twice with backoff, reusing the same `Idempotency-Key`, so a retried request never runs twice. Change with `new KetaPay({ apiKey, maxRetries, timeoutMs })`, or per call: `{ maxRetries: 0 }`.

## Sandbox

With an `sk_test_` key, no messages are sent, every one-time code is `123456`, and you can move escrows through any state:

```ts
await ketapay.testHelpers.checkoutSessions.pay(session.id)
await ketapay.testHelpers.escrows.simulate(escrowId, { action: 'deliver', milestone_id: milestoneId })
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).
