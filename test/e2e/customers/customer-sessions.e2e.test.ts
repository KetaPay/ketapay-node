import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, SANDBOX_CODE } from '../support/env.js'
import { people } from '../support/fixtures.js'

describe.skipIf(!configured)('e2e: customer sessions', () => {
  it('[E2E-002] sends a code and exchanges the sandbox code for a customer token', async () => {
    const { buyer } = people()
    const k = ketapay()
    const session = await k.customerSessions.create({ email: buyer.email })
    expect(session.status).toBe('code_sent')
    expect(session.channel).toBe('email')
    const token = await k.customerSessions.verify(session.id, SANDBOX_CODE)
    expect(token.token).toMatch(/^ctk_test_/)
    expect(new Date(token.expires_at).getTime()).toBeGreaterThan(Date.now())
  })
})
