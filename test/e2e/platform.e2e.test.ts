import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../src/index.js'
import { configured, env, fundedEscrow, ketapay, sessionParams } from './setup.js'

describe.skipIf(!configured)('e2e: platform', () => {
  it.skipIf(!env.webhookUrl)(
    '[E2E-017] creates a webhook endpoint, delivers a test event, and rotates the secret',
    async () => {
      const k = ketapay()
      const endpoint = await k.webhookEndpoints.create({ url: env.webhookUrl!, enabled_events: ['escrow.funded'] })
      try {
        expect(endpoint.secret).toMatch(/^whsec_/)
        expect((await k.webhookEndpoints.retrieve(endpoint.id)) as object).not.toHaveProperty('secret')
        const result = await k.webhookEndpoints.test(endpoint.id, 'escrow.funded')
        expect(result.delivered).toBe(true)
        const rotated = await k.webhookEndpoints.rotateSecret(endpoint.id)
        expect(rotated.secret).not.toBe(endpoint.secret)
        expect(new Date(rotated.previous_secret_expires_at).getTime()).toBeGreaterThan(Date.now())
      } finally {
        await k.webhookEndpoints.del(endpoint.id)
      }
    },
  )

  it('[E2E-018] the events list contains the events a flow produced', async () => {
    const { escrow } = await fundedEscrow()
    const page = await ketapay().events.list({ type: 'escrow.funded', limit: 100 })
    expect(page.data.some((e) => (e.data.object as { id?: string }).id === escrow.id)).toBe(true)
  })

  it.skipIf(!env.otherKey)("[E2E-020] one organisation's key cannot read another organisation's escrow", async () => {
    const { escrow } = await fundedEscrow()
    await expect(ketapay(env.otherKey).escrows.retrieve(escrow.id)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('[E2E-023] lists paginate across more than one page', async () => {
    const k = ketapay()
    await k.checkoutSessions.create(sessionParams())
    await k.checkoutSessions.create(sessionParams())
    const firstPage = await k.checkoutSessions.list({ limit: 1 })
    expect(firstPage.has_more).toBe(true)
    const ids: string[] = []
    for await (const s of k.checkoutSessions.list({ limit: 1 })) {
      ids.push(s.id)
      if (ids.length === 2) break
    }
    expect(new Set(ids).size).toBe(2)
  })

  it.skipIf(!env.liveKey)('[E2E-024] the API refuses test helpers for a live key', async () => {
    // The SDK refuses before sending (SEC-005), so call the API directly to prove the server refuses too.
    const res = await fetch(`${env.baseUrl}/test_helpers/escrows/00000000-0000-4000-8000-000000000000/simulate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.liveKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `e2e-${Date.now()}`,
      },
      body: JSON.stringify({ action: 'deliver' }),
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('test_mode_only')
  })
})
