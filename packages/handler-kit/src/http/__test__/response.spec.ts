import { describe, it, expect } from "vitest";

import {
  empty,
  HttpResponse,
  HttpErrorStatusCode,
  success,
  successJson,
  problemJson,
  withHeader,
  withStatusCode,
  withSecurityHeaders,
  ProblemJson,
} from "../response";

import { pipe } from "fp-ts/function";
import { lookup } from "fp-ts/Record";
import * as O from "fp-ts/Option";

describe("response", () => {
  describe("withStatusCode", () => {
    it("should return a new response with the updated status code", () => {
      const updated = pipe(empty, withStatusCode(404));
      expect(empty.statusCode).toBe(204);
      expect(updated.statusCode).toBe(404);
    });
    describe("withHeader", () => {
      it("should return a new response with the updated header", () => {
        const updated = pipe(empty, withHeader("x-io-test-type", "unit"));
        const hasHeaderWithValue =
          (name: string, expectedValue: string) =>
          (res: HttpResponse<null, 204>) =>
            pipe(
              res.headers,
              lookup(name),
              O.filter((value) => value === expectedValue),
              O.isSome
            );
        const hasXIOTestHeader = hasHeaderWithValue("x-io-test-type", "unit");
        expect(hasXIOTestHeader(empty)).toBe(false);
        expect(hasXIOTestHeader(updated)).toBe(true);
      });
    });
  });
  describe("empty", () => {
    it("should have 204 as status code", () => {
      expect(empty.statusCode).toBe(204);
    });
    it("should have a null body", () => {
      expect(empty.body).toBeNull();
    });
    it("should include security headers", () => {
      const responseWithSecHeaders: HttpResponse<null, 204> =
        withSecurityHeaders({ statusCode: 204, body: null, headers: {} });
      expect(empty.headers).toMatchObject(responseWithSecHeaders.headers);
    });
  });
  describe("success", () => {
    it("should create an HttpResponse with status 200", () => {
      const response = success({ message: "it works!" });
      expect(response.statusCode).toBe(200);
    });
    it("should create an HttpResponse with security headers", () => {
      const response = success({ message: "it works!" });
      const responseWithSecHeaders: HttpResponse<null, 204> =
        withSecurityHeaders({ statusCode: 204, body: null, headers: {} });
      expect(response.headers).toMatchObject(responseWithSecHeaders.headers);
    });
  });
  describe("successJson", () => {
    it("should create an HttpResponse with status 200", () => {
      const response = successJson({ message: "it works!" });
      expect(response.statusCode).toBe(200);
    });
    it("should create an HttpResponse with Content-Type header valued as application/json", () => {
      const response = successJson({
        message: "it works!! but check the headers ",
      });
      expect(response.headers).toHaveProperty(
        "Content-Type",
        "application/json"
      );
    });
  });
  describe("problemJson", () => {
    it("should create an HttpResponse with Content-Type header valued as application/problem+json", () => {
      const problem: ProblemJson = { status: 400, title: "Test problem." };
      const response = problemJson(problem);
      expect(response.headers).toHaveProperty(
        "Content-Type",
        "application/problem+json"
      );
    });
    it("should create an HttpResponse with the appropriate status code", () => {
      const statuses: Array<HttpErrorStatusCode> = [404, 401, 500];
      statuses.forEach((status) => {
        expect(problemJson({ title: "Test problem.", status })).toHaveProperty(
          "statusCode",
          status
        );
      });
    });
  });
});
