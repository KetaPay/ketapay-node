import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { sessionParams } from '../support/fixtures.js'

describe.skipIf(!configured)('e2e: pagination', () => {
  it('[E2E-023] lists paginate across more than one page', async () => {
    const k = ketapay()
    await k.checkoutSessions.create(sessionParams())
    await k.checkoutSessions.create(sessionParams())
    expect((await k.checkoutSessions.list({ limit: 1 })).has_more).toBe(true)
    const ids: string[] = []
    for await (const session of k.checkoutSessions.list({ limit: 1 })) {
      ids.push(session.id)
      if (ids.length === 2) break
    }
    expect(new Set(ids).size).toBe(2)
  })
})
