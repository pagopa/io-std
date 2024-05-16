import { describe, it, expect, vi } from "vitest";

import * as t from "io-ts";

import { InvocationContext, HttpRequest } from "@azure/functions";

import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";

import { pipe, flow } from "fp-ts/function";
import { lookup } from "fp-ts/Record";

import * as H from "@pagopa/handler-kit";

import { azureFunction, httpAzureFunction } from "../function";

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
    const message = new HttpRequest({
      query: {
        name: "luca",
      },
      url: "https://my-request.pagopa.it",
      method: "GET",
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
    const response = await ErrorFunction(
      new HttpRequest({
        url: "http://my-request.pagopa.it/",
        method: "GET",
      }),
      ctx
    );
    expect(CtxErrorSpy).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: 500,
      })
    );
  });

  it("it should return 200 and a string body when the handler returns a response with Content-Type equal to text/plain and a string body", async () => {
    const handler = H.of(() =>
      pipe(
        RTE.of("Hello world!"),
        RTE.map(flow(H.success, H.withHeader("Content-Type", "text/plain"))),
        RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.right))
      )
    );
    const message = new HttpRequest({
      url: "https://my-request.pagopa.it",
      method: "GET",
    });
    const response = await httpAzureFunction(handler)({})(message, ctx);

    expect(response.status).toEqual(200);
    expect(response.headers.get("content-type")).toEqual("text/plain");
    await expect(response.text()).resolves.toEqual("Hello world!");
  });

  it("it should return 500 when the handler returns a response with Content-Type equal to text/plain but an object body", async () => {
    const handler = H.of(() =>
      pipe(
        RTE.of({ foo: "bar" }),
        RTE.map(flow(H.success, H.withHeader("Content-Type", "text/plain"))),
        RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.right))
      )
    );
    const message = new HttpRequest({
      url: "https://my-request.pagopa.it",
      method: "GET",
    });
    const response = await httpAzureFunction(handler)({})(message, ctx);

    expect(response.status).toEqual(500);
    expect(response.headers.get("content-type")).toEqual(
      "application/problem+json"
    );
    await expect(response.text()).resolves.toEqual("Internal server error");
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
