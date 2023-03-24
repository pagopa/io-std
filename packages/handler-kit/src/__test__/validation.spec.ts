import { describe, expect, it, vi } from "vitest";

import * as t from "io-ts";

import { ValidationError, parse } from "../validation";

describe("validation", () => {
  describe("ValidationError", () => {
    it('should have "ValidationError" as name', () => {
      const e = new ValidationError([]);
      expect(e.name).toBe("ValidationError");
    });
  });
  describe("parse", () => {
    it("calls the decode method of the provided schema", () => {
      const payload = { message: "this is a test " };
      const payloadC = t.type({ message: t.string });
      payloadC.decode = vi.fn(() => t.success(payload));
      parse(payloadC)(payload);
      expect(payloadC.decode).toHaveBeenCalled();
      expect(payloadC.decode).toHaveBeenCalledWith(payload);
    });
    it.todo("returns a ValidationError on error", () => {});
    it.todo("correctly refines a type", () => {});
  });
});
