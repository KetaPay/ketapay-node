import { describe, expect, it } from 'vitest'
import { configured } from '../support/env.js'
import { eventsFor, fundedEscrow } from '../support/flows.js'
import { eventually } from '../support/wait.js'

describe.skipIf(!configured)('e2e: events', () => {
  it('[E2E-018] the events list contains the events a flow produced', async () => {
    const { escrow } = await fundedEscrow()
    await eventually(async () => expect((await eventsFor(escrow, 'escrow.funded')).length).toBeGreaterThan(0))
  })
})
