export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug'

export interface Logger {
  error(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
}

const rank: Record<LogLevel, number> = { off: 0, error: 1, warn: 2, info: 3, debug: 4 }
const noop = () => {}

/** Returns a logger that drops messages below `level` and prefixes the rest. */
export function createLogger(level: LogLevel = 'warn', target: Logger = console): Logger {
  const at = (min: LogLevel, fn: Logger[keyof Logger]) =>
    rank[level] >= rank[min]
      ? (message: string, meta?: Record<string, unknown>) => fn.call(target, `[ketapay] ${message}`, meta ?? {})
      : noop
  return {
    error: at('error', target.error),
    warn: at('warn', target.warn),
    info: at('info', target.info),
    debug: at('debug', target.debug),
  }
}
