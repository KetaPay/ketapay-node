import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured, SANDBOX_CODE } from '../support/env.js'
import { people } from '../support/fixtures.js'
import { eventsFor, first, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

// One run of the payout worker (every minute on staging), with room to spare
const PAYOUT_WORKER_WAIT = { timeoutMs: 90_000, intervalMs: 2_000 }

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
      // A platform's seller is paid once verified; unverified, the payout would wait
      await k.testHelpers.customers.verify({ customerToken: sellerToken })
      // 0000000001 is the sandbox account whose transfers always fail
      const pending = await k.payoutAccounts.create(
        { bank_code: '057', account_number: '0000000001' },
        { customerToken: sellerToken },
      )
      await k.payoutAccounts.confirm(pending.id, SANDBOX_CODE, { customerToken: sellerToken })
      await k.escrows.milestones.deliver(escrow.id, m.id, { note: 'Done' }, { customerToken: sellerToken })
      await k.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: await tokenFor(buyer) })
      // The release only queues the payout: the API's payout worker sends it once a minute
      await eventually(
        async () => expect((await k.escrows.retrieve(escrow.id)).milestones[0]!.payout?.status).toBe('failed'),
        PAYOUT_WORKER_WAIT,
      )
      await eventually(async () => expect(await eventsFor(escrow, 'payout.failed')).toHaveLength(1))
    },
    PAYOUT_WORKER_WAIT.timeoutMs + 60_000,
  )

  it.skipIf(!served('payout_accounts', 'milestone_payout'))(
    "[E2E-043] an unverified seller's payout waits for verification, then goes out with payout.sent",
    async () => {
      const { escrow, buyer, seller } = await fundedEscrow()
      const k = ketapay()
      const m = first(escrow)
      const sellerToken = await tokenFor(seller)
      const pending = await k.payoutAccounts.create(
        { bank_code: '057', account_number: '0000000000' },
        { customerToken: sellerToken },
      )
      await k.payoutAccounts.confirm(pending.id, SANDBOX_CODE, { customerToken: sellerToken })
      await k.escrows.milestones.deliver(escrow.id, m.id, { note: 'Done' }, { customerToken: sellerToken })
      await k.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: await tokenFor(buyer) })
      const held = (await k.escrows.retrieve(escrow.id)).milestones[0]!.payout
      expect(held?.status).toBe('awaiting_verification')

      await k.testHelpers.customers.verify({ customerToken: sellerToken })
      await eventually(
        async () => expect((await k.escrows.retrieve(escrow.id)).milestones[0]!.payout?.status).toBe('sent'),
        PAYOUT_WORKER_WAIT,
      )
      await eventually(async () => expect(await eventsFor(escrow, 'payout.sent')).toHaveLength(1))
    },
    PAYOUT_WORKER_WAIT.timeoutMs + 60_000,
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
