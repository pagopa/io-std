import e from "express";
import * as L from "@pagopa/logger";

import onFinished from "on-finished";

type LogFunction = (
  level: L.LogRecord["level"],
  message: string,
  context?: Record<string, unknown>
) => void;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      log?: LogFunction;
    }
  }
}

// Decorates express's Request object with a "log" function
// that uses the given L.Logger
export const logger =
  (l: L.Logger) => (req: e.Request, res: e.Response, next: e.NextFunction) => {
    // eslint-disable-next-line functional/immutable-data
    req.log = (level, message, context) =>
      L.log(level)(message, context)({ logger: l })();
    next();
  };

type AccessMiddlewareOptions = {
  skip: (req: e.Request, res: e.Response) => boolean;
};

const defaultAccessMiddlewareOptions: AccessMiddlewareOptions = {
  skip: () => false,
};

// Adds "access log" for each request
export const access =
  (opts = defaultAccessMiddlewareOptions) =>
  (req: e.Request, res: e.Response, next: e.NextFunction) => {
    function logRequest() {
      if (!opts.skip(req, res)) {
        req.log?.("info", "http request", {
          method: req.method,
          url: req.url,
          status: res.statusCode,
        });
      }
    }
    onFinished(res, logRequest);
    next();
  };
