# Contributing

This SDK follows the KetaPay SDK standards (`documentation/openapi/public/SDK_STANDARDS.md`), shared by every KetaPay SDK. It is the reference implementation for them.

## Layout

```
src/
├── index.ts              public exports
├── ketapay.ts            the KetaPay client: one property per resource
├── core/                 internals shared by every domain
│   ├── http-client.ts    auth, idempotency, retries, timeouts, abort, logging
│   ├── api-promise.ts    what every method returns (await, or .withResponse())
│   ├── pagination.ts     PagePromise: await one page, for await every item
│   ├── errors.ts         error classes by type and status
│   ├── crypto.ts         Web Crypto helpers (no node:* imports anywhere in src)
│   ├── resource.ts       base class for resources
│   └── options.ts, logger.ts, version.ts, index.ts
├── resources/            one folder per API domain, matching the spec's sections
│   ├── checkout/         checkout-sessions.ts, types.ts, index.ts
│   ├── customers/        customer-sessions.ts
│   ├── escrows/          escrows.ts, milestones.ts
│   ├── disputes/         disputes.ts, chargebacks.ts
│   ├── payouts/          payout-accounts.ts, banks.ts
│   ├── files/            files.ts
│   ├── webhooks/         webhook-endpoints.ts, events.ts, signature.ts
│   ├── test-helpers/     test-helpers.ts
│   └── common/           types shared by several domains
└── generated/openapi.ts  generated from spec/v1.yaml, never edited by hand
test/                     mirrors src: core/, resources/, webhooks/, contract/
```

Each domain folder has its resource classes, a `types.ts` (friendly names over the generated types) and an `index.ts` that exports both. A new endpoint goes in the domain that owns it in the spec.

`src` must run on edge runtimes: ESLint blocks `node:*` imports and `Buffer`.

## The rule: the spec comes first

`spec/v1.yaml` is a generated snapshot of the public API spec. The source of truth is `documentation/openapi/public/` (split by domain); its bundled single file is `dist/v1.yaml`. The API, this SDK and the docs are all built from it, so they never drift apart.

1. **Change the spec first**, in the documentation repo, in the same piece of work as the API change.
2. **Sync it here:** `npm run public:check` in the documentation repo, then `npm run sync-spec` here (reads `../documentation/openapi/public/dist/v1.yaml`, or pass a path). Never edit `spec/v1.yaml` by hand: its header records a hash and CI rejects edits.
3. **Regenerate the types:** `npm run generate`. Never edit `src/generated/` by hand.
4. **Update the hand-written layer** (`src/resources/<domain>/`) for any new or changed endpoint. `test/resources/spec-coverage.test.ts` fails until every operation in the spec has an SDK method sending the spec's method and path: add the new operation to its table, plus a call in `test/contract/contract.test.ts`.
5. **Run everything:** `npm run lint && npm run typecheck && npm test && npm run test:contract`.

CI enforces this on every PR:

| Check               | Fails when                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `check:spec`        | `spec/v1.yaml` was edited by hand instead of synced                                      |
| spec coverage test  | an operation in the spec has no SDK method, or an SDK method has no operation            |
| `check:drift`       | `src/generated/` doesn't match `spec/v1.yaml` (types edited by hand, or not regenerated) |
| `test:contract`     | The SDK sends a request the spec doesn't allow (runs against a Prism mock of the spec)   |
| `lint`              | `src` uses Node-only APIs, or code problems                                              |
| `typecheck`, `test` | The hand-written layer doesn't fit the generated types, or behaviour regressed           |

## Pull requests and tests

Every change goes through a PR from a branch. CI runs on each PR and shows:

- **PR title is a conventional commit**: `feat:`, `fix:`, `chore:` and so on, because release notes are built from it.
- **One check per kind of test**, so a red ❌ tells you what broke: Spec (snapshot and generated types), Format/lint/types/audit, Unit tests (Node 22 and 24, with coverage), Contract tests (SDK against the spec), Build and package smoke test (Node 22 and 24).
- **A test report** on the run's Summary page: totals, coverage, and every test with ✅ or ❌, grouped by file. Failing tests are also marked inline on the PR diff. The HTML coverage report is attached to the run as `coverage-report`.

**Before every push**, a git hook runs formatting, lint, types and unit tests (about 5 seconds) and refuses the push if any fail. `npm install` turns it on. Skip it only in an emergency with `git push --no-verify`; CI still runs everything.

Coverage must stay at or above the thresholds in `vitest.config.ts` (about 90% of lines). Raise them when you add tests; never lower them to get a PR through.

Locally:

```sh
npm test                 # unit tests
npm run test:coverage    # with coverage; open coverage/index.html
npx vitest --ui          # visual test runner in the browser (npm i -D @vitest/ui once)
npm run test:contract    # SDK requests against a mock built from the spec
```

The PR template asks for a summary, the reason and the test plan. Fill it in.

## The test catalogue

`spec/test-catalogue.md` is synced from `documentation/openapi/public/SDK_TEST_CATALOGUE.md` and lists every scenario every KetaPay SDK must test (security, webhooks, requests, errors, resilience, lists, spec, package, operations, end to end). Tag each test with its ID in the test name, like `it('[SEC-002] refuses a plain-http base URL', ...)`; package checks are tagged in the script that runs them. `test/catalogue-coverage.test.ts` fails when a catalogue ID has no tagged test or a test carries an unknown ID.

New scenario: add the row to the catalogue in the documentation repo first, `npm run sync-spec` here, then write the tagged test.

## End-to-end tests

The real SDK against the staging API with sandbox keys, laid out like `src/resources/`:

```
test/e2e/
├── support/     env (settings), client, fixtures (fresh people and sessions), flows (funded escrow,
│                customer tokens, events), wait (eventually: polls for effects that land a moment later)
├── checkout/    customers/    escrows/    disputes/    payouts/    webhooks/    platform/
```

- One file per behaviour inside its domain folder, each test tagged with its `E2E-xxx` catalogue ID.
- Every test builds its own data with fresh people from `fixtures`, so tests never depend on each other. Everything created is stamped with the run id (`metadata.e2e_run`) so staging can be cleaned up by run.
- Wait for asynchronous effects (events, payouts, refunds) with `eventually()`, never with a fixed sleep.
- Settings: `KETAPAY_E2E_BASE_URL` and `KETAPAY_E2E_SECRET_KEY`, plus optional ones listed in `support/env.ts`. Run locally with `npm run test:e2e`; it uses `vitest.e2e.config.ts` (60-second timeouts, one retry, files one at a time).
- The **E2E** workflow runs on every merge to `main`, nightly and by hand, reading the settings from Infisical (`ketapay-sdks`, staging: one project shared by every KetaPay SDK); until they exist it reports "not configured" and passes. **Publish to npm** runs it on the release tag and refuses a stable (non-beta) release unless it ran and passed.

## Supported runtimes

Customers: **Node 18 or later** (tested on 18, 20, 22 and 24) and Deno; TypeScript 5.0 or later. Development and unit tests use Node 22. The runtime floor is separate from the toolchain on purpose: never raise `engines` just because a dev tool needs a newer Node.

## No breaking changes in v1

Adding endpoints, fields, enum values and optional parameters is fine. Removing or renaming anything, or making an optional field required, is not: mark it `deprecated` in the spec, keep it working for at least 6 months, and remove it only in v2.

## Versioning and publishing

Semantic versioning, automated by Release Please. Write commit messages and PR titles as conventional commits: `feat:` (new endpoint or field, minor version), `fix:` (patch), `feat!:` or `BREAKING CHANGE:` (major, v2 only), `refactor:`, `test:`, `docs:`, `chore:`. Never edit the version or `CHANGELOG.md` by hand; the version in the code is filled in from `package.json` at build time.

Releasing is three steps, and only the last one ships anything:

1. **Release PR (automatic).** On every push to `main`, Release Please updates a PR titled `chore(main): release ...` with the next version and the changelog.
2. **Tag (when you merge that PR).** Merging it tags the version (`v0.1.0-beta.1`) and creates a GitHub release. Nothing is published yet.
3. **Publish (manual, dudox only).** Actions tab > **Publish to npm** > Run workflow (leave the tag empty for the latest release). It checks the tag is on `main`, matches `package.json` and isn't on npm yet; runs the whole CI suite on that exact tag; builds; runs `npm run smoke:pack` (the exact package file installed in an empty project and used through ESM, CommonJS and TypeScript); then publishes. Any failure means nothing is published.

Versions with a pre-release suffix (`0.1.0-beta.1`) publish under the `next` dist-tag (`npm i @ketapay/node@next`); plain versions under `latest`. The next release is pinned to `0.1.0-beta.2` by `release-as` in `release-please-config.json` (`0.1.0-beta.1` was tagged but never published): remove that line after it ships. When the API is stable, drop `prerelease` and `versioning` from the same file to cut `0.1.0`.

Auth: `NPM_TOKEN` from Infisical (`ketapay-sdks`, prod) when set, otherwise npm Trusted Publishing. Check the token without publishing with the **Check release secrets** workflow. Every version is published with npm provenance (`publishConfig.provenance`), which links it to the workflow run and commit that built it. The publish job runs in the GitHub environment `publish`, so it waits for dudox's approval.

Switches (repo variables): `RELEASES_ENABLED` (Release Please) and `NPM_PUBLISH_ENABLED` (the publish workflow refuses to run without it).

## Style

Prettier (`npm run format`): 120 columns, no semicolons, single quotes. No runtime dependencies.

## Secrets and security

No secret ever goes in this repo: keys and tokens come from Infisical at run time. Two scanners enforce it. GitHub secret scanning with push protection blocks a push containing a known token format. The **Secrets** CI check runs gitleaks over the whole history with KetaPay's own patterns (`.gitleaks.toml`: `sk_live_` and `sk_test_` keys, customer tokens, `whsec_` secrets, Supabase URLs). A documented sample value from the spec goes in that file's allowlist, never a real one. Vulnerabilities are reported privately (see SECURITY.md).
