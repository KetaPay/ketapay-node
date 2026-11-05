import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, env } from '../support/env.js'

describe.skipIf(!configured || !env.webhookUrl)('e2e: webhook endpoints', () => {
  it('[E2E-017] creates an endpoint, delivers a test event, and rotates the secret', async () => {
    const k = ketapay()
    const endpoint = await k.webhookEndpoints.create({ url: env.webhookUrl!, enabled_events: ['escrow.funded'] })
    try {
      expect(endpoint.secret).toMatch(/^whsec_/)
      expect((await k.webhookEndpoints.retrieve(endpoint.id)) as object).not.toHaveProperty('secret')
      expect((await k.webhookEndpoints.test(endpoint.id, 'escrow.funded')).delivered).toBe(true)
      const rotated = await k.webhookEndpoints.rotateSecret(endpoint.id)
      expect(rotated.secret).not.toBe(endpoint.secret)
      expect(new Date(rotated.previous_secret_expires_at).getTime()).toBeGreaterThan(Date.now())
    } finally {
      await k.webhookEndpoints.del(endpoint.id)
    }
  })
})

describe.skipIf(!configured)('e2e: webhook endpoint settings', () => {
  it('[E2E-041] an endpoint shows in the list, and an update changes its events', async () => {
    const k = ketapay()
    const endpoint = await k.webhookEndpoints.create({
      url: 'https://example.com/ketapay-e2e-webhook',
      enabled_events: ['escrow.funded'],
    })
    try {
      expect((await k.webhookEndpoints.list({ limit: 100 })).data.map((e) => e.id)).toContain(endpoint.id)
      const updated = await k.webhookEndpoints.update(endpoint.id, { enabled_events: ['escrow.refunded'] })
      expect(updated.enabled_events).toEqual(['escrow.refunded'])
    } finally {
      await k.webhookEndpoints.del(endpoint.id)
    }
  })
})
