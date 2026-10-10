import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../../src/index.js'
import { ketapay } from '../support/client.js'
import { configured, env } from '../support/env.js'
import { fundedEscrow } from '../support/flows.js'

describe.skipIf(!configured || !env.otherKey)('e2e: organisation isolation', () => {
  it("[E2E-020] one organisation's key cannot read another organisation's escrow", async () => {
    const { escrow } = await fundedEscrow()
    await expect(ketapay(env.otherKey).escrows.retrieve(escrow.id)).rejects.toBeInstanceOf(NotFoundError)
  })
})
