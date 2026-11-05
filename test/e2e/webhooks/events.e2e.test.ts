import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { eventsFor, fundedEscrow } from '../support/flows.js'
import { eventually } from '../support/wait.js'

describe.skipIf(!configured)('e2e: events', () => {
  it('[E2E-018] the events list contains the events a flow produced', async () => {
    const { escrow } = await fundedEscrow()
    await eventually(async () => expect((await eventsFor(escrow, 'escrow.funded')).length).toBeGreaterThan(0))
  })

  it('[E2E-042] an event from the list reads back by id', async () => {
    const { escrow } = await fundedEscrow()
    const event = await eventually(async () => {
      const [found] = await eventsFor(escrow, 'escrow.funded')
      expect(found).toBeTruthy()
      return found!
    })
    expect((await ketapay().events.retrieve(event.id)).id).toBe(event.id)
  })
})
