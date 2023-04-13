/* eslint-disable no-console */
import * as L from "@pagopa/logger";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as LE from "@pagopa/logger-express";

// Derive a concrete implementation L.Logger using Express.Request.log, if present, otherwise using console
export const getLogger = (req: Express.Request): L.Logger =>
  req.logger ?? {
    log: (s, level) => () => {
      const logFunc: Record<typeof level, (s: string) => void> = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        fatal: console.error,
      };
      logFunc[level](s);
    },
    format:
      process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
    context: {},
  };
