# Changelog

## [0.1.0-beta.5](https://github.com/KetaPay/ketapay-node/compare/v0.1.0-beta.4...v0.1.0-beta.5) (2026-10-30)


### ⚠ BREAKING CHANGES

* **escrows:** remove escrows.cancel, following the spec ([#37](https://github.com/KetaPay/ketapay-node/issues/37))

### Features

* **disputes:** follow the spec and serve disputes in e2e ([#36](https://github.com/KetaPay/ketapay-node/issues/36)) ([fdc20d2](https://github.com/KetaPay/ketapay-node/commit/fdc20d22aaa1e4799a22027d78f6ba7388807d3c))
* **escrows:** remove escrows.cancel, following the spec ([#37](https://github.com/KetaPay/ketapay-node/issues/37)) ([4c4787c](https://github.com/KetaPay/ketapay-node/commit/4c4787c92f828846cfef88a399ea6a3bcfd3609a))
* **files:** follow the spec's file changes and serve files in e2e ([#35](https://github.com/KetaPay/ketapay-node/issues/35)) ([331f5ee](https://github.com/KetaPay/ketapay-node/commit/331f5eeb554514aad9bca87f6273f64c6d366308))


### Bug Fixes

* **deps:** override lodash to ^4.18.1 for the security advisory ([#32](https://github.com/KetaPay/ketapay-node/issues/32)) ([8e9b718](https://github.com/KetaPay/ketapay-node/commit/8e9b718258ea9a67f30fe35555e31e869e821bb4))

## [0.1.0-beta.4](https://github.com/KetaPay/ketapay-node/compare/v0.1.0-beta.3...v0.1.0-beta.4) (2026-10-23)


### Miscellaneous Chores

* release 0.1.0-beta.4 ([#30](https://github.com/KetaPay/ketapay-node/issues/30)) ([f926562](https://github.com/KetaPay/ketapay-node/commit/f926562430a89044d943a56d7fe30da6b358374a))

## [0.1.0-beta.3](https://github.com/KetaPay/ketapay-node/compare/v0.1.0-beta.2...v0.1.0-beta.3) (2026-10-22)


### Features

* checkout sessions without a seller, for a business selling its own goods ([#26](https://github.com/KetaPay/ketapay-node/issues/26)) ([740280d](https://github.com/KetaPay/ketapay-node/commit/740280d566a34f74cf8273e1b3a24a61a4fba064))

## [0.1.0-beta.2](https://github.com/KetaPay/ketapay-node/compare/v0.1.0-beta.1...v0.1.0-beta.2) (2026-10-21)


### ⚠ BREAKING CHANGES

* Node 22 or later is required.
* webhooks.verify() and generateTestSignatureHeader() return promises; Node 20 or later is required.

### Features

* appInfo option, appended to the User-Agent ([#18](https://github.com/KetaPay/ketapay-node/issues/18)) ([2e9619b](https://github.com/KetaPay/ketapay-node/commit/2e9619b83726e2298363da8cd22ab2bf79ccadb8))
* Node 18 support, shared test catalogue, E2E suite ([8ed0251](https://github.com/KetaPay/ketapay-node/commit/8ed02515cea7a89ab4ec5031d4cff28c301c7d78))
* webhook endpoints default to every event ([#21](https://github.com/KetaPay/ketapay-node/issues/21)) ([1d996b5](https://github.com/KetaPay/ketapay-node/commit/1d996b582920dcab55e30347d55100607c24181e))


### Bug Fixes

* accept options after the key in the KetaPay constructor ([#23](https://github.com/KetaPay/ketapay-node/issues/23)) ([855f36b](https://github.com/KetaPay/ketapay-node/commit/855f36b1e4cac8b17ef47936b4a0fa3ec521be5f))
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
