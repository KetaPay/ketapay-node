import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { eventsFor, fundedEscrow, tokenFor } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured || !served('escrow_cancel'))('e2e: cancelling', () => {
  it('[E2E-008] the buyer cancels before delivery: escrow refunded and escrow.refunded recorded', async () => {
    const { escrow, buyer } = await fundedEscrow()
    const cancelled = await ketapay().escrows.cancel(
      escrow.id,
      { reason: 'E2E' },
      { customerToken: await tokenFor(buyer) },
    )
    expect(cancelled.status).toBe('refunded')
    await eventually(async () => expect(await eventsFor(escrow, 'escrow.refunded')).toHaveLength(1))
  })
})
