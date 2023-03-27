import { fromReaderIOK as toReaderTaskEitherK } from "fp-ts/ReaderTaskEither";
import { pipe } from "fp-ts/function";

import { json } from "./format";

export type LogRecord = {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  [context: string]: unknown;
};

export type Formatter = (r: LogRecord) => string;

export type Logger = {
  log: (s: string, l: LogRecord["level"]) => () => void;
  format?: Formatter;
  context?: Record<string, unknown>;
};

/*
Logs a message at the specified level.

A Logger instance has:
- "log" function, that actually perform the logging (wrapped in IO<void>)
- an optional "Formatter" ("format" property) that serialzes the log record to string
- an optional "context" that will be copied in each log record

the default formatter is "json"
the default context is {}
*/
export const log =
  (level: LogRecord["level"]) =>
  (message: LogRecord["message"], context: Record<string, unknown> = {}) =>
  (r: { logger: Logger }) =>
    pipe(r.logger.context ?? {}, (rootContext) =>
      pipe(
        r.logger.format ?? json,
        (format) =>
          format({
            timestamp: new Date(),
            level,
            message,
            ...rootContext,
            ...context,
          }),
        (s) => r.logger.log(s, level)
      )
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
