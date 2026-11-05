import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { fundedEscrow } from '../support/flows.js'

describe.skipIf(!configured)('e2e: flags', () => {
  it('[E2E-036] flagging an escrow records a flag on it with the reason given', async () => {
    const { escrow } = await fundedEscrow()
    const flag = await ketapay().escrows.flag(escrow.id, {
      reason: 'suspicious_activity',
      note: 'Raised by the e2e suite.',
    })
    expect(flag.object).toBe('flag')
    expect([flag.escrow_id, flag.reason]).toEqual([escrow.id, 'suspicious_activity'])
  })
})
