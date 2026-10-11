// E2E settings. CI reads them from Infisical (project ketapay-sdks, shared by every KetaPay SDK, environment staging).
//
//   KETAPAY_E2E_BASE_URL          staging API base URL, e.g. https://<staging>/v1   (required)
//   KETAPAY_E2E_SECRET_KEY        sk_test_ key of the e2e organisation                (required)
//   KETAPAY_E2E_OTHER_SECRET_KEY  sk_test_ key of a second organisation, for isolation tests
//   KETAPAY_E2E_LIVE_SECRET_KEY   sk_live_ key on staging, for the live-key refusal test
//   KETAPAY_E2E_WEBHOOK_URL       an HTTPS URL that answers 200, for webhook delivery tests
export const env = {
  baseUrl: process.env.KETAPAY_E2E_BASE_URL,
  key: process.env.KETAPAY_E2E_SECRET_KEY,
  otherKey: process.env.KETAPAY_E2E_OTHER_SECRET_KEY,
  liveKey: process.env.KETAPAY_E2E_LIVE_SECRET_KEY,
  webhookUrl: process.env.KETAPAY_E2E_WEBHOOK_URL,
}

/** The suite runs only when the required settings exist. */
export const configured = Boolean(env.baseUrl && env.key)

/** In the sandbox every one-time code is this, and no message is sent. */
export const SANDBOX_CODE = '123456'

/** Identifies this run: stamped on everything the suite creates, so staging can be cleaned up by run. */
export const RUN_ID = process.env.KETAPAY_E2E_RUN_ID ?? `e2e-${Date.now().toString(36)}`
