# Contributing

## The rule: the spec comes first

`spec/v1.yaml` is a copy of the public API spec. Its source of truth is `documentation/openapi/public/v1.yaml`. The API, this SDK and the docs are all built from it, so they never drift apart.

1. **Change the spec first**, in the documentation repo, in the same piece of work as the API change.
2. **Sync it here:** `npm run sync-spec` (reads `../documentation/openapi/public/v1.yaml`, or pass a path).
3. **Regenerate the types:** `npm run generate`. Never edit `src/generated/` by hand.
4. **Update the hand-written layer** (`src/resources/`, `src/types.ts`) for any new or changed endpoint, with a test in `test/` and a call in `test/contract/contract.test.ts`.
5. **Run everything:** `npm run typecheck && npm test && npm run test:contract`.

CI enforces this on every PR:

| Check               | Fails when                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `check:drift`       | `src/generated/` doesn't match `spec/v1.yaml` (types edited by hand, or not regenerated) |
| `test:contract`     | The SDK sends a request the spec doesn't allow (runs against a Prism mock of the spec)   |
| `typecheck`, `test` | The hand-written layer doesn't fit the generated types, or behaviour regressed           |

## No breaking changes in v1

Adding endpoints, fields, enum values and optional parameters is fine. Removing or renaming anything, or making an optional field required, is not: mark it `deprecated` in the spec, keep it working for at least 6 months, and remove it only in v2.

## Versioning

Semantic versioning. A new endpoint or field is a minor version; a fix is a patch. Bump `version` in `package.json` and `src/version.ts` together, and add a line to `CHANGELOG.md`.

## Style

Prettier (`npm run format`): 120 columns, no semicolons, single quotes. No runtime dependencies.
