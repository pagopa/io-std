import { InvocationContext } from "@azure/functions";

import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using azure.Context.log
export const getLogger = (ctx: InvocationContext): L.Logger => ({
  log: (s, level) => () => {
    const logFunc: Record<typeof level, (s: string) => void> = {
      debug: ctx.debug,
      info: ctx.info,
      warn: ctx.warn,
      error: ctx.error,
      fatal: ctx.error,
    };
    logFunc[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
  context: {
    invocationId: ctx.invocationId,
    functionName: ctx.functionName,
  },
});
