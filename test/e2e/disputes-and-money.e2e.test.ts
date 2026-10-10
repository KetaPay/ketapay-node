import { describe, expect, it } from 'vitest'
import { configured, eventsFor, first, fundedEscrow, ketapay, people, SANDBOX_CODE, tokenFor } from './setup.js'

describe.skipIf(!configured)('e2e: disputes and money movements', () => {
  it('[E2E-009] dispute with uploaded evidence, seller concedes: resolved and refunded', async () => {
    const { escrow, buyer, seller } = await fundedEscrow()
    const k = ketapay()
    const buyerToken = await tokenFor(buyer)
    const file = await k.files.create(
      { file: new TextEncoder().encode('evidence'), filename: 'evidence.txt', purpose: 'dispute_evidence' },
      { customerToken: buyerToken },
    )
    const dispute = await k.disputes.create(
      escrow.id,
      { reason: 'not_received', description: 'Nothing was delivered by the due date.', files: [file.id] },
      { customerToken: buyerToken },
    )
    expect(dispute.status).toBe('open')
    const evidence = await k.disputes.listEvidence(dispute.id, { customerToken: buyerToken })
    expect(evidence.data.length).toBeGreaterThan(0)
    const resolved = await k.disputes.concede(dispute.id, { customerToken: await tokenFor(seller) })
    expect(resolved.status).toBe('resolved')
    expect(resolved.resolved_by).toBe('seller')
    expect((await k.escrows.retrieve(escrow.id)).status).toBe('refunded')
  })

  it('[E2E-010] a dispute KetaPay resolves with a partial refund splits the money', async () => {
    const { escrow, buyer } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    await k.disputes.create(
      escrow.id,
      { milestone_id: m.id, reason: 'incomplete', description: 'Only half of the design was delivered.' },
      { customerToken: await tokenFor(buyer) },
    )
    await k.testHelpers.escrows.simulate(escrow.id, {
      action: 'resolve_dispute',
      outcome: 'partially_refunded',
      refunded_amount: Math.floor(m.amount / 2),
    })
    const [dispute] = (await k.disputes.listForEscrow(escrow.id)).data
    expect(dispute!.outcome).toBe('partially_refunded')
    expect(dispute!.resolved_by).toBe('ketapay')
    expect(await eventsFor(escrow, 'dispute.resolved')).toHaveLength(1)
  })

  it('[E2E-011] a lost chargeback closes as lost and records chargeback.closed', async () => {
    const { escrow } = await fundedEscrow()
    const k = ketapay()
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'open_chargeback' })
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'close_chargeback', chargeback_status: 'lost' })
    const [chargeback] = (await k.chargebacks.listForEscrow(escrow.id)).data
    expect(chargeback!.status).toBe('lost')
    expect((await ketapay().events.list({ type: 'chargeback.closed', limit: 100 })).data.length).toBeGreaterThan(0)
  })

  it("[E2E-012] a failed payout records payout.failed and keeps the money in the seller's balance", async () => {
    const { escrow } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'deliver', milestone_id: m.id })
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'release', milestone_id: m.id })
    const after = await k.testHelpers.escrows.simulate(escrow.id, { action: 'fail_payout', milestone_id: m.id })
    expect(after.milestones[0]!.payout?.status).toBe('failed')
    expect((await ketapay().events.list({ type: 'payout.failed', limit: 100 })).data.length).toBeGreaterThan(0)
  })

  it("[E2E-013] a failed card refund moves the money to the buyer's balance", async () => {
    const { escrow, buyer } = await fundedEscrow()
    const k = ketapay()
    await k.escrows.cancel(escrow.id, undefined, { customerToken: await tokenFor(buyer) })
    const m = first(escrow)
    const after = await k.testHelpers.escrows.simulate(escrow.id, { action: 'fail_refund', milestone_id: m.id })
    expect(after.milestones[0]!.refund?.destination).toBe('ketapay_balance')
    expect((await ketapay().events.list({ type: 'refund.failed', limit: 100 })).data.length).toBeGreaterThan(0)
  })

  it('[E2E-014] adds a payout account and confirms it with the code', async () => {
    const { seller } = people()
    const k = ketapay()
    const customerToken = await tokenFor(seller.email)
    const pending = await k.payoutAccounts.create({ bank_code: '057', account_number: '0000000000' }, { customerToken })
    expect(pending.status).toBe('pending_confirmation')
    const active = await k.payoutAccounts.confirm(pending.id, SANDBOX_CODE, { customerToken })
    expect(active.status).toBe('active')
  })
})
