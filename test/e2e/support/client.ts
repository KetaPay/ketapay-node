import { KetaPay } from '../../../src/index.js'
import { env } from './env.js'

/** A client for the staging API. Retries once on network errors; the suite itself retries flaky tests once. */
export const ketapay = (apiKey = env.key!) => new KetaPay({ apiKey, baseUrl: env.baseUrl, maxRetries: 1 })
