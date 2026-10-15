# Changelog

## [0.1.0-beta.2](https://github.com/KetaPay/ketapay-node/compare/v0.1.0-beta.1...v0.1.0-beta.2) (2026-10-15)


### ⚠ BREAKING CHANGES

* Node 22 or later is required.
* webhooks.verify() and generateTestSignatureHeader() return promises; Node 20 or later is required.

### Features

* appInfo option, appended to the User-Agent ([#18](https://github.com/KetaPay/ketapay-node/issues/18)) ([2e9619b](https://github.com/KetaPay/ketapay-node/commit/2e9619b83726e2298363da8cd22ab2bf79ccadb8))
* Node 18 support, shared test catalogue, E2E suite ([8ed0251](https://github.com/KetaPay/ketapay-node/commit/8ed02515cea7a89ab4ec5031d4cff28c301c7d78))
* webhook endpoints default to every event ([#21](https://github.com/KetaPay/ketapay-node/issues/21)) ([1d996b5](https://github.com/KetaPay/ketapay-node/commit/1d996b582920dcab55e30347d55100607c24181e))


### Bug Fixes

* trim base URL slashes in linear time ([#19](https://github.com/KetaPay/ketapay-node/issues/19)) ([470214d](https://github.com/KetaPay/ketapay-node/commit/470214d0e1be09a35e05babfe069cb461028e0a1))


### Code Refactoring

* domain folders, edge runtime support and request controls ([bb1b503](https://github.com/KetaPay/ketapay-node/commit/bb1b503c95081797ffb58f2fba97b0370336c9b3))


### Build System

* update dev tooling, require Node 22, tame Dependabot ([64be442](https://github.com/KetaPay/ketapay-node/commit/64be442ec46780a885e4f640e239b59ee5a94f43))

## 0.1.0-beta.1 (2026-10-10)


### ⚠ BREAKING CHANGES

* Node 22 or later is required.
* webhooks.verify() and generateTestSignatureHeader() return promises; Node 20 or later is required.

### Code Refactoring

* domain folders, edge runtime support and request controls ([bb1b503](https://github.com/KetaPay/ketapay-node/commit/bb1b503c95081797ffb58f2fba97b0370336c9b3))


### Build System

* update dev tooling, require Node 22, tame Dependabot ([64be442](https://github.com/KetaPay/ketapay-node/commit/64be442ec46780a885e4f640e239b59ee5a94f43))

## Changelog

Written by Release Please from conventional commit messages (`feat:`, `fix:`, `refactor:` ...). Don't edit by hand.
