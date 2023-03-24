import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";

import * as L from "@pagopa/logger";

import { Decoder } from "io-ts";

import { parse } from "./validation";

export type HandlerEnvironment<I> = {
  input: unknown;
  inputDecoder: Decoder<unknown, I>;
  logger: L.Logger;
};

export type Handler<I, A, R = object> = RTE.ReaderTaskEither<
  R & HandlerEnvironment<I>,
  Error,
  A
>;

export const of = <I, A, R = object>(
  endpoint: (input: I) => RTE.ReaderTaskEither<R, Error, A>
): Handler<I, A, R> =>
  pipe(
    RTE.ask<HandlerEnvironment<I>>(),
    RTE.chainEitherKW(({ input, inputDecoder }) =>
      pipe(input, parse(inputDecoder))
    ),
    RTE.chainFirstW((input) => L.debugRTE("input decoded", { input })),
    RTE.chainW(endpoint)
  );
