import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { eventsFor, fundedEscrow } from '../support/flows.js'
import { eventually } from '../support/wait.js'
import { served } from '../support/served.js'

describe.skipIf(!configured || !served('chargebacks', 'simulate'))('e2e: chargebacks', () => {
  it('[E2E-011] a lost chargeback closes as lost and records chargeback.closed', async () => {
    const { escrow } = await fundedEscrow()
    const k = ketapay()
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'open_chargeback' })
    await k.testHelpers.escrows.simulate(escrow.id, { action: 'close_chargeback', chargeback_status: 'lost' })
    const [chargeback] = (await k.chargebacks.listForEscrow(escrow.id)).data
    expect(chargeback!.status).toBe('lost')
    await eventually(async () => expect(await eventsFor(escrow, 'chargeback.closed')).toHaveLength(1))
  })
})
