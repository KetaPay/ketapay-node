import { describe, expect, it } from 'vitest'
import { configured } from '../support/env.js'
import { eventsFor, fundedEscrow } from '../support/flows.js'
import { eventually } from '../support/wait.js'

describe.skipIf(!configured)('e2e: payment', () => {
  it('[E2E-004] paying funds the escrow, completes the session and records escrow.funded', async () => {
    const { escrow, session } = await fundedEscrow()
    expect(session.status).toBe('complete')
    expect(escrow.status).toBe('active')
    expect(escrow.milestones.every((m) => m.status === 'funded')).toBe(true)
    await eventually(async () => expect(await eventsFor(escrow, 'escrow.funded')).toHaveLength(1))
  })
})
