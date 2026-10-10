import { describe, expect, it } from 'vitest'
import { PermissionError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { first, fundedEscrow, tokenFor } from '../support/flows.js'

describe.skipIf(!configured)('e2e: who may act', () => {
  it('[E2E-019] refuses the wrong party: the buyer cannot deliver, the seller cannot release', async () => {
    const { escrow, buyer, seller } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    await expect(
      k.escrows.milestones.deliver(escrow.id, m.id, {}, { customerToken: await tokenFor(buyer) }),
    ).rejects.toBeInstanceOf(PermissionError)
    await k.escrows.milestones.deliver(escrow.id, m.id, {}, { customerToken: await tokenFor(seller) })
    await expect(
      k.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: await tokenFor(seller) }),
    ).rejects.toMatchObject({ code: 'customer_not_allowed' })
  })
})
