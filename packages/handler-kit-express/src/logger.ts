import * as E from "fp-ts/Either";
import * as L from "@pagopa/logger";
import type {} from "@pagopa/logger-express";

// Derive a concrete implementation L.Logger using Express.Request.log, if present, otherwise fails with an error
export const getLogger = (req: Express.Request): E.Either<Error, L.Logger> =>
  req.logger ? E.right(req.logger) : E.left(new Error("There is no logger"));
