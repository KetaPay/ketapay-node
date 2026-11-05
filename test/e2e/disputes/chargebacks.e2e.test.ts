import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'
import { fundedEscrow, tokenFor } from '../support/flows.js'
import { served } from '../support/served.js'

// A sandbox has no way to raise a chargeback (a bank starts one), so only the empty and unknown cases run
// here. The chargeback.* webhooks are covered with test events.
describe.skipIf(!configured)('e2e: chargebacks', () => {
  it.skipIf(!served('chargebacks'))(
    '[E2E-037] an escrow with no chargeback lists none, and an unknown one is a 404',
    async () => {
      const { escrow, seller } = await fundedEscrow()
      const k = ketapay()
      expect((await k.chargebacks.listForEscrow(escrow.id)).data).toEqual([])
      const unknown = randomUUID()
      await expect(k.chargebacks.retrieve(unknown)).rejects.toBeInstanceOf(NotFoundError)
      await expect(
        k.chargebacks.submitEvidence(unknown, { statement: 'Delivered.' }, { customerToken: await tokenFor(seller) }),
      ).rejects.toBeInstanceOf(NotFoundError)
    },
  )
})
