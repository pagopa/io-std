import { describe, it, test, expect } from "vitest";
import { ValidationError } from "../../validation";

import {
  HttpError,
  HttpBadRequestError,
  HttpUnauthorizedError,
  HttpForbiddenError,
  HttpNotFoundError,
  HttpConflictError,
  HttpUnprocessableEntityError,
  HttpTooManyRequestsError,
  HttpServiceUnavailableError,
  toProblemJson,
} from "../error";

import { HttpErrorStatusCode } from "../response";

describe("error", () => {
  describe("toProblemJson", () => {
    it("maps to a ProblemJson with an undefined type on HttpError", () => {
      const e = new HttpError("There was an error!");
      const problem = toProblemJson(e);
      expect(problem).not.toHaveProperty("type");
    });
    it('maps to a ProblemJson with a "/problem/validation-error" type on ValidationError', () => {
      const e = new ValidationError(["this is just an example of a violation"]);
      const problem = toProblemJson(e);
      expect(problem).toHaveProperty("type", "/problem/validation-error");
      expect(problem).toHaveProperty("status", 422);
    });
    it("maps to a ProblemJson with status 500 on not handled errors", () => {
      const e = new Error("something went wrong!");
      const problem = toProblemJson(e);
      expect(problem).toHaveProperty("status", 500);
    });
  });
  describe("HttpError", () => {
    test("each HttpError variant should have its own right HTTP status code", () => {
      const testTable: Array<[HttpError, HttpErrorStatusCode]> = [
        [new HttpError(), 500],
        [new HttpBadRequestError(), 400],
        [new HttpUnauthorizedError(), 401],
        [new HttpForbiddenError(), 403],
        [new HttpNotFoundError(), 404],
        [new HttpConflictError(), 409],
        [new HttpUnprocessableEntityError(), 422],
        [new HttpTooManyRequestsError(), 429],
        [new HttpServiceUnavailableError(), 503],
      ];
      testTable.forEach(([e, statusCode]) => {
        expect(e.status).toBe(statusCode);
      });
    });
  });
});
