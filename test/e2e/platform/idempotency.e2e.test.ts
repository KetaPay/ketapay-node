import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, RUN_ID } from '../support/env.js'
import { sessionParams } from '../support/fixtures.js'

describe.skipIf(!configured)('e2e: idempotency', () => {
  it('[E2E-015] replays the same key and body, and refuses the key with a different body', async () => {
    const k = ketapay()
    const params = sessionParams()
    const key = `${RUN_ID}-idem-${Date.now()}`
    const a = await k.checkoutSessions.create(params, { idempotencyKey: key })
    const b = await k.checkoutSessions.create(params, { idempotencyKey: key })
    expect(b.id).toBe(a.id)
    await expect(
      k.checkoutSessions.create({ ...params, title: 'Different' }, { idempotencyKey: key }),
    ).rejects.toMatchObject({ code: 'idempotency_key_reused' })
  })
})
