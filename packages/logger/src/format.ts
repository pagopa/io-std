import { pipe, identity } from "fp-ts/function";
import * as E from "fp-ts/Either";

import { Formatter } from "./logger";

// Replaces Error instances with simple JS objects
// It's needed because Error has no enumerable properties
const jsonReplacer = (_: string, value: unknown) => {
  if (value instanceof Error) {
    return { ...value, message: value.message, name: value.name };
  }
  return value;
};

export const json: Formatter = ({ timestamp, level, message, ...context }) =>
  pipe(
    E.tryCatch(
      () =>
        JSON.stringify({ timestamp, level, message, ...context }, jsonReplacer),
      identity
    ),
    E.getOrElse(() =>
      // JSON.stringify here doesn't throws because "context" has been removed
      // and the other properties are simple primitives
      JSON.stringify(
        {
          timestamp: new Date(),
          level,
          message: "unable to serialize the log entry",
          originalEntry: { level, message },
        },
        jsonReplacer
      )
    )
  );

export const simple: Formatter = ({ level, message, ...extra }) =>
  pipe(
    E.tryCatch(() => JSON.stringify(extra, jsonReplacer, 2), identity),
    E.getOrElse((e) =>
      e instanceof Error ? e.message : "unable to serialize the log entry"
    ),
    (extra) => `[${level.toUpperCase()}] ${message}\n\n${extra}\n`
  );
