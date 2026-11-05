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

  it.skipIf(!served('payout_accounts', 'milestone_payout'))(
    "[E2E-012] a payout to the failing test account records payout.failed and keeps the money in the seller's balance",
    async () => {
      const { escrow, buyer, seller } = await fundedEscrow()
      const k = ketapay()
      const m = first(escrow)
      const sellerToken = await tokenFor(seller)
      // 0000000001 is the sandbox account whose transfers always fail
      const pending = await k.payoutAccounts.create(
        { bank_code: '057', account_number: '0000000001' },
        { customerToken: sellerToken },
      )
      await k.payoutAccounts.confirm(pending.id, SANDBOX_CODE, { customerToken: sellerToken })
      await k.escrows.milestones.deliver(escrow.id, m.id, { note: 'Done' }, { customerToken: sellerToken })
      await k.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: await tokenFor(buyer) })
      await eventually(async () =>
        expect((await k.escrows.retrieve(escrow.id)).milestones[0]!.payout?.status).toBe('failed'),
      )
      await eventually(async () => expect(await eventsFor(escrow, 'payout.failed')).toHaveLength(1))
    },
  )

  it.skipIf(!served('payout_accounts'))(
    "[E2E-040] banks are listed, and a payout account shows in the customer's list until deleted",
    async () => {
      const k = ketapay()
      const { seller } = people()
      expect((await k.banks.list()).data.length).toBeGreaterThan(0)
      const customerToken = await tokenFor(seller.email)
      const account = await k.payoutAccounts.create(
        { bank_code: '057', account_number: '0000000000' },
        { customerToken },
      )
      const ids = async () => (await k.payoutAccounts.list({ customerToken })).data.map((a) => a.id)
      expect(await ids()).toContain(account.id)
      await k.payoutAccounts.del(account.id, { customerToken })
      expect(await ids()).not.toContain(account.id)
    },
  )
})
