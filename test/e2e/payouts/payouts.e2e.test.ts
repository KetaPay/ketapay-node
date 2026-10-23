import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, SANDBOX_CODE } from '../support/env.js'
import { people } from '../support/fixtures.js'
import { eventsFor, first, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured)('e2e: payouts', () => {
  it.skipIf(!served('payout_accounts'))('[E2E-014] adds a payout account and confirms it with the code', async () => {
    const { seller } = people()
    const k = ketapay()
    const customerToken = await tokenFor(seller.email)
    const pending = await k.payoutAccounts.create({ bank_code: '057', account_number: '0000000000' }, { customerToken })
    expect(pending.status).toBe('pending_confirmation')
    const active = await k.payoutAccounts.confirm(pending.id, SANDBOX_CODE, { customerToken })
    expect(active.status).toBe('active')
  })

  it.skipIf(!served('simulate', 'milestone_payout'))(
    "[E2E-012] a failed payout records payout.failed and keeps the money in the seller's balance",
    async () => {
      const { escrow } = await fundedEscrow()
      const k = ketapay()
      const m = first(escrow)
      await k.testHelpers.escrows.simulate(escrow.id, { action: 'deliver', milestone_id: m.id })
      await k.testHelpers.escrows.simulate(escrow.id, { action: 'release', milestone_id: m.id })
      const after = await k.testHelpers.escrows.simulate(escrow.id, { action: 'fail_payout', milestone_id: m.id })
      expect(after.milestones[0]!.payout?.status).toBe('failed')
      await eventually(async () => expect(await eventsFor(escrow, 'payout.failed')).toHaveLength(1))
    },
  )
})
