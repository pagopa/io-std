import { describe, it, expect, vi } from "vitest";

import * as t from "io-ts";

import { InvocationContext } from "@azure/functions";

import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";

import { pipe, flow } from "fp-ts/function";
import { lookup } from "fp-ts/Record";

import * as H from "@pagopa/handler-kit";

import { azureFunction, httpAzureFunction } from "../function";

const HttpRequest = (req: {
  method?: "GET" | "POST";
  url?: string;
  query?: Record<string, string>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}) => ({
  user: null,
  get: () => undefined,
  parseFormBody: () => ({} as unknown),
  body: undefined,
  headers: {},
  params: {},
  query: {},
  url: "https://my-test.url.com/api",
  method: "GET",
  ...req,
});

const ctx = {
  error: console.error,
  debug: console.debug,
} as InvocationContext;

describe("httpAzureFunction", () => {
  const GreetHandler = H.of((req: H.HttpRequest) =>
    pipe(
      req.query,
      lookup("name"),
      O.getOrElse(() => "Test"),
      RTE.right,
      RTE.chainW((name) =>
        RTE.asks<{ lang: "it" | "en" }, string>((r) =>
          r.lang === "it" ? `Ciao ${name}` : `Hello ${name}`
        )
      ),
      RTE.map((message) => ({ message })),
      RTE.map(H.successJson),
      RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.right))
    )
  );

  it("wires the http request correctly", async () => {
    const GreetFunction = httpAzureFunction(GreetHandler)({
      lang: "it",
    });
    const message = HttpRequest({
      query: {
        name: "luca",
      },
    });
    const response = await GreetFunction(message, ctx);
    expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        message: "Ciao luca",
      })
    );
  });

  it("recovers from uncaught errors", async () => {
    const CtxErrorSpy = vi.spyOn(ctx, "error");
    const ErrorFunction = httpAzureFunction(
      H.of((_) => RTE.left(new Error("unhandled error")))
    )({});
    const response = await ErrorFunction({}, ctx);
    expect(CtxErrorSpy).toHaveBeenCalled();
    expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: 500,
      })
    );
  });
});

describe("azureFunction", () => {
  it("returns the same value of the handler", () => {
    const ctx = {
      debug: console.debug,
    } as InvocationContext;
    const EchoFunc = azureFunction(H.of((str: string) => RTE.right(str)))({
      inputDecoder: t.string,
    });
    const response = EchoFunc("ping", ctx);

    expect(response).resolves.toBe("ping");
  });
});
