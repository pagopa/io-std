import * as E from "fp-ts/lib/Either";
import { flow } from "fp-ts/function";

import { failure } from "io-ts/PathReporter";
import { Decoder } from "io-ts";

export class ValidationError extends Error {
  static defaultMessage = "Your request parameters didn't validate";
  name = "ValidationError";
  violations: string[];
  constructor(violations: string[], message = ValidationError.defaultMessage) {
    super(message);
    this.violations = violations;
  }
}

const toValidationError = (message: string) =>
  flow(failure, (violations) => new ValidationError(violations, message));

export const parse = <T>(
  schema: Decoder<unknown, T>,
  message = ValidationError.defaultMessage
) => flow(schema.decode, E.mapLeft(toValidationError(message)));
