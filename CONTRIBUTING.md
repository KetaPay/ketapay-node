# Contributing

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
4. **Update the hand-written layer** (`src/resources/`, `src/types.ts`) for any new or changed endpoint, with a test in `test/` and a call in `test/contract/contract.test.ts`.
5. **Run everything:** `npm run lint && npm run typecheck && npm test && npm run test:contract`.

CI enforces this on every PR:

| Check               | Fails when                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `check:spec`        | `spec/v1.yaml` was edited by hand instead of synced                                      |
| `check:drift`       | `src/generated/` doesn't match `spec/v1.yaml` (types edited by hand, or not regenerated) |
| `test:contract`     | The SDK sends a request the spec doesn't allow (runs against a Prism mock of the spec)   |
| `lint`              | `src` uses Node-only APIs, or code problems                                              |
| `typecheck`, `test` | The hand-written layer doesn't fit the generated types, or behaviour regressed           |

## No breaking changes in v1

Adding endpoints, fields, enum values and optional parameters is fine. Removing or renaming anything, or making an optional field required, is not: mark it `deprecated` in the spec, keep it working for at least 6 months, and remove it only in v2.

## Versioning

Semantic versioning, automated by Release Please. Write commit messages as conventional commits: `feat:` (new endpoint or field, minor version), `fix:` (patch), `feat!:` or `BREAKING CHANGE:` (major, v2 only), `refactor:`, `test:`, `docs:`, `chore:`. Release Please opens a release PR with the version bump and changelog; merging it tags the release and publishes to npm. Never edit the version or `CHANGELOG.md` by hand; the version in the code is filled in from `package.json` at build time.

Publishing uses npm Trusted Publishing (no npm token stored anywhere). Provenance (proof a version was built from this repo by `release.yml`) needs a public repo; turn it on with `"provenance": true` in `publishConfig` when this repo goes public. Versions with a pre-release suffix (`0.1.0-beta.1`) publish under the `next` dist-tag; plain versions under `latest`. The first release is pinned to `0.1.0-beta.1` by `release-as` in `release-please-config.json`: remove that line after it ships. When the API is stable, drop `prerelease` and `versioning` from the same file to cut `0.1.0`.

Switches: repo variables `RELEASES_ENABLED` (Release Please opens release PRs) and `NPM_PUBLISH_ENABLED` (merging one publishes). Only owners of the `ketapay` npm org can change who may publish.

## Style

Prettier (`npm run format`): 120 columns, no semicolons, single quotes. No runtime dependencies.
