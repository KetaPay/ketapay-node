import { describe, expect, it } from 'vitest'
import { ConflictError, PermissionError } from '../../src/index.js'
import { configured, eventsFor, first, fundedEscrow, ketapay, tokenFor } from './setup.js'

describe.skipIf(!configured)('e2e: milestones', () => {
  it('[E2E-005] seller delivers, buyer releases: milestone released with a payout and both events', async () => {
    const { escrow, buyer, seller } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    const delivered = await k.escrows.milestones.deliver(
      escrow.id,
      m.id,
      { note: 'Designs ready' },
      { customerToken: await tokenFor(seller) },
    )
    expect(delivered.milestones[0]!.status).toBe('delivered')
    const released = await k.escrows.milestones.release(escrow.id, m.id, {}, { customerToken: await tokenFor(buyer) })
    expect(released.milestones[0]!.status).toBe('released')
    expect(released.milestones[0]!.payout).toBeTruthy()
    expect(await eventsFor(escrow, 'milestone.delivered')).toHaveLength(1)
    expect(await eventsFor(escrow, 'milestone.released')).toHaveLength(1)
  })

  it('[E2E-006] releases in person with the buyer code, and refuses a wrong code', async () => {
    const { escrow, buyer } = await fundedEscrow({ release: { method: 'release_code' } })
    const k = ketapay()
    const m = first(escrow)
    const { code } = await k.escrows.milestones.releaseCode(escrow.id, m.id, { customerToken: await tokenFor(buyer) })
    const wrong = code === '000000' ? '111111' : '000000'
    await expect(k.escrows.milestones.release(escrow.id, m.id, { release_code: wrong })).rejects.toMatchObject({
      code: 'release_code_invalid',
    })
    const released = await k.escrows.milestones.release(escrow.id, m.id, { release_code: code })
    expect(released.milestones[0]!.status).toBe('released')
  })

  it('[E2E-007] auto-releases a delivered milestone when the window runs out', async () => {
    const { escrow } = await fundedEscrow({ release: { method: 'buyer_confirms', auto_release_hours: 48 } })
    const k = ketapay()
    const m = first(escrow)
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'deliver', milestone_id: m.id })
    const after = await k.testHelpers.escrows.simulate(escrow.id, { action: 'auto_release', milestone_id: m.id })
    expect(after.milestones[0]!.status).toBe('released')
  })

  it('[E2E-008] the buyer cancels before delivery: escrow refunded and escrow.refunded recorded', async () => {
    const { escrow, buyer } = await fundedEscrow()
    const cancelled = await ketapay().escrows.cancel(
      escrow.id,
      { reason: 'E2E' },
      { customerToken: await tokenFor(buyer) },
    )
    expect(cancelled.status).toBe('refunded')
    expect(await eventsFor(escrow, 'escrow.refunded')).toHaveLength(1)
  })

  it('[E2E-019] refuses the wrong party: seller cannot release, buyer cannot deliver', async () => {
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

  it('[E2E-021] an open dispute blocks the normal release', async () => {
    const { escrow, buyer, seller } = await fundedEscrow()
    const k = ketapay()
    const m = first(escrow)
    await k.escrows.milestones.deliver(escrow.id, m.id, {}, { customerToken: await tokenFor(seller) })
    const buyerToken = await tokenFor(buyer)
    await k.disputes.create(
      escrow.id,
      { milestone_id: m.id, reason: 'not_as_agreed', description: 'Not what the brief asked for.' },
      { customerToken: buyerToken },
    )
    const err = await k.escrows.milestones
      .release(escrow.id, m.id, {}, { customerToken: buyerToken })
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ConflictError)
    expect(err).toMatchObject({ code: 'dispute_open' })
  })
})
