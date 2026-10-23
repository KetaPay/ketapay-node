import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { eventsFor, first, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured || !served('escrow_cancel', 'simulate', 'milestone_payout'))('e2e: refunds', () => {
  it("[E2E-013] a failed card refund moves the money to the buyer's balance", async () => {
    const { escrow, buyer } = await fundedEscrow()
    const k = ketapay()
    await k.escrows.cancel(escrow.id, undefined, { customerToken: await tokenFor(buyer) })
    const after = await k.testHelpers.escrows.simulate(escrow.id, {
      action: 'fail_refund',
      milestone_id: first(escrow).id,
    })
    expect(after.milestones[0]!.refund?.destination).toBe('ketapay_balance')
    await eventually(async () => expect(await eventsFor(escrow, 'refund.failed')).toHaveLength(1))
  })
})
