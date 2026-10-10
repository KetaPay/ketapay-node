# Changelog

## 0.1.0 (unreleased)

- First version, covering the full v1 spec: checkout sessions, customer sessions, escrows and milestones, disputes and evidence, chargebacks, files, banks, payout accounts, webhook endpoints, events and sandbox test helpers.
- Automatic retries with a reused `Idempotency-Key`, typed errors, `for await` pagination, webhook signature verification with secret rotation.
