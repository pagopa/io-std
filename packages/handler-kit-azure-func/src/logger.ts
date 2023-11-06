import { InvocationContext } from "@azure/functions";

import * as L from "@pagopa/logger";

// Derive a concrete implementation L.Logger using azure.Context.log
export const getLogger = (ctx: InvocationContext): L.Logger => ({
  log: (s, _level) => () => {
    const level = _level === "fatal" ? "error" : _level;
    ctx[level](s);
  },
  format:
    process.env.NODE_ENV === "development" ? L.format.simple : L.format.json,
  context: {
    invocationId: ctx.invocationId,
    functionName: ctx.functionName,
  },
});
