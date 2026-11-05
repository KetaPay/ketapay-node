import { describe, expect, it } from 'vitest'
import { ketapay } from '../support/client.js'
import { configured } from '../support/env.js'

describe.skipIf(!configured)('e2e: pricing', () => {
  it("[E2E-031] returns the caller's plan: its fee, VAT, who pays and the escrow sizes it covers", async () => {
    const pricing = await ketapay().pricing.retrieve()
    expect(pricing.object).toBe('pricing')
    expect(pricing.plan).toEqual(expect.any(String))
    expect(pricing.fee_bps).toBeGreaterThan(0)
    expect(pricing.vat_bps).toBeGreaterThan(0)
    expect(pricing.fees_paid_by).toEqual(expect.any(String))
    expect(pricing.min_amount).toEqual(expect.any(Number))
  })
})
