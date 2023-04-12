/* eslint-disable no-console */
import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using console
export const getLogger = (): L.Logger => ({
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
});