// Filled in from package.json at build time (tsup and vitest `define`), so it can never drift.
declare const __SDK_VERSION__: string

export const VERSION: string = typeof __SDK_VERSION__ === 'string' ? __SDK_VERSION__ : '0.0.0-dev'
