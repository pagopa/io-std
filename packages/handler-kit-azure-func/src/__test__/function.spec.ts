import { describe, it, expect, vi } from "vitest";

import * as t from "io-ts";

import { Context, Form, AzureFunction } from "@azure/functions";

import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";

import { pipe, flow } from "fp-ts/function";
import { lookup } from "fp-ts/Record";

import * as H from "@pagopa/handler-kit";

import { azureFunction, httpAzureFunction } from "../function";

function logger() {}
logger.error = vi.fn(() => {});
logger.warn = () => {};
logger.info = () => {};
logger.verbose = () => {};

const baseCtx: Context = {
  invocationId: "my-id",
  executionContext: {
    invocationId: "my-id",
    functionName: "Greet",
    functionDirectory: "./my-dir",
    retryContext: null,
  },
  bindings: {},
  bindingData: {
    invocationId: "my-id",
  },
  traceContext: {
    traceparent: null,
    tracestate: null,
    attributes: null,
  },
  bindingDefinitions: [],
  log: logger,
  done() {},
};

const invoke =
  <P>(trigger: "httpTrigger" | "queueTrigger", name: string, payload: P) =>
  (func: AzureFunction) =>
    func({
      ...baseCtx,
      bindingDefinitions: [
        ...baseCtx.bindingDefinitions,
        {
          type: trigger,
          direction: "in",
          name,
        },
      ],
      bindings: {
        ...baseCtx.bindings,
        [name]: payload,
      },
    });

const invokeFromHttpRequest = (req: {
  method?: "GET" | "POST";
  url?: string;
  query?: Record<string, string>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}) =>
  invoke("httpTrigger", "req", {
    user: null,
    get: () => undefined,
    parseFormBody: () => ({} as Form),
    body: undefined,
    headers: {},
    params: {},
    query: {},
    url: "https://my-test.url.com/api",
    method: "GET",
    ...req,
  });

const HttpResponseC = t.partial({
  statusCode: t.union([t.number, t.string]),
  body: t.any,
  headers: t.record(t.string, t.string),
});

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
    await expect(
      pipe(
        GreetFunction,
        invokeFromHttpRequest({
          query: {
            name: "luca",
          },
        })
      )
    ).resolves.toEqual(
      expect.objectContaining({
        body: {
          message: "Ciao luca",
        },
      })
    );
  });
  it("returns an Azure Http Response", async () => {
    const GreetFunction = httpAzureFunction(GreetHandler)({
      lang: "en",
    });
    const response = await pipe(GreetFunction, invokeFromHttpRequest({}));
    expect(pipe(response, H.parse(HttpResponseC), E.isRight)).toBe(true);
  });
  it("recovers from uncaught errors", async () => {
    const ErrorFunction = httpAzureFunction(
      H.of((_) => RTE.left(new Error("unhandled error")))
    )({});
    const response = await pipe(ErrorFunction, invokeFromHttpRequest({}));
    expect(logger.error).toHaveBeenCalled();
    expect(pipe(response, H.parse(HttpResponseC))).toEqual(
      expect.objectContaining({
        right: expect.objectContaining({
          statusCode: 500,
        }),
      })
    );
  });
});

describe("azureFunction", () => {
  it("returns the same value of the handler", async () => {
    const EchoFunc = azureFunction(H.of((str: string) => RTE.right(str)))({
      inputDecoder: t.string,
    });
    const response = pipe(EchoFunc, invoke("queueTrigger", "str", "ping"));
    await expect(response).resolves.toBe("ping");
  });
});
