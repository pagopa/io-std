import { describe, it, expect, vi } from "vitest";

import * as RTE from "fp-ts/ReaderTaskEither";
import * as t from "io-ts";

import * as H from "../handler";

import * as E from "fp-ts/Either";

import { ValidationError } from "../validation";
import * as L from "@pagopa/logger";

const logger: L.Logger = {
  log: () => () => {},
  format: () => "",
};

describe("handler", () => {
  describe("of", () => {
    it('Should call the decode function of the "itemDecoder" provided', async () => {
      const inputDecoder: t.Decoder<unknown, 1> = {
        name: "inputDecoder",
        decode: vi.fn(() => t.success(1)),
        validate: () => t.success(1),
      };
      const GimmeOne = H.of((item: 1) => RTE.right(item));
      const run = GimmeOne({
        input: 2,
        inputDecoder,
        logger,
      });
      await run();
      expect(inputDecoder.decode).toHaveBeenCalledOnce();
      expect(inputDecoder.decode).toHaveBeenCalledWith(2);
    });
    it("Should return a ValidationError when the provided item didn't validate", async () => {
      const GreetHandler = H.of((name: string) => RTE.right(`Hello, ${name}`));
      const run = GreetHandler({
        input: 10,
        inputDecoder: t.string,
        logger,
      });
      const result = await run();
      expect.assertions(2);
      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });
  });
});
