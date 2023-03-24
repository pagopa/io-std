import { fromReaderIOK as toReaderTaskEitherK } from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

export type LogRecord = {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  [context: string]: unknown;
};

export type Logger = {
  log: (s: string, l: LogRecord["level"]) => () => void;
  format: (r: LogRecord) => string;
  context?: Record<string, unknown>;
};

export const log =
  (level: LogRecord["level"]) =>
  (message: LogRecord["message"], context: Record<string, unknown> = {}) =>
  (r: { logger: Logger }) =>
    pipe(
      r.logger.context ?? {},
      (rootContext) =>
        r.logger.format({
          timestamp: new Date(),
          level,
          message,
          ...rootContext,
          ...context,
        }),
      (s) => r.logger.log(s, level)
    );

/* c8 ignore start */
export const debug = log("debug");
export const debugRTE = toReaderTaskEitherK(debug);

export const info = log("info");
export const infoRTE = toReaderTaskEitherK(info);

export const warn = log("warn");
export const warnRTE = toReaderTaskEitherK(warn);

export const error = log("error");
export const errorRTE = toReaderTaskEitherK(error);

export const fatal = log("fatal");
export const fatalRTE = toReaderTaskEitherK(fatal);
/* c8 ignore end */
