import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { eventsFor, first, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured)('e2e: releasing milestones', () => {
  it('[E2E-005] seller delivers, buyer releases: released with a payout and both events', async () => {
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
    if (served('milestone_payout')) expect(released.milestones[0]!.payout).toBeTruthy()
    await eventually(async () => {
      expect(await eventsFor(escrow, 'milestone.delivered')).toHaveLength(1)
      expect(await eventsFor(escrow, 'milestone.released')).toHaveLength(1)
    })
  })

  it.skipIf(!served('release_code'))(
    '[E2E-006] releases in person with the buyer code, and refuses a wrong code',
    async () => {
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
    },
  )

  it.skipIf(!served('simulate'))('[E2E-007] auto-releases a delivered milestone when the window runs out', async () => {
    const { escrow } = await fundedEscrow({ release: { method: 'buyer_confirms', auto_release_hours: 48 } })
    const k = ketapay()
    const m = first(escrow)
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'deliver', milestone_id: m.id })
    const after = await k.testHelpers.escrows.simulate(escrow.id, { action: 'auto_release', milestone_id: m.id })
    expect(after.milestones[0]!.status).toBe('released')
  })
})
