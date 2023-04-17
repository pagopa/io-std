import * as azure from "@azure/functions";

import * as t from "io-ts";

import * as T from "fp-ts/Task";
import * as RE from "fp-ts/ReaderEither";
import * as TE from "fp-ts/TaskEither";

import { sequenceS } from "fp-ts/Apply";
import { pipe, flow } from "fp-ts/function";

import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";

import { getLogger } from "./logger";
import { getTriggerBindingData } from "./trigger";

const hasLogger = <R, I>(
  u: unknown
): u is R & { logger: L.Logger } & H.HandlerEnvironment<I> =>
  typeof u === "object" && u !== null && "logger" in u;

// Populates Handler dependencies reading from azure.Context
const azureFunctionTE = <I, A, R>(
  h: H.Handler<I, A, R>,
  deps: Omit<R, "logger"> & { inputDecoder: t.Decoder<unknown, I> }
) =>
  flow(
    sequenceS(RE.Apply)({
      logger: RE.fromReader(getLogger),
      input: getTriggerBindingData(),
    }),
    TE.fromEither,
    TE.map(({ input, logger }) => ({ input, logger, ...deps })),
    TE.filterOrElse(hasLogger<R, I>, () => new Error("Unmeet dependencies")),
    TE.chainW(h)
  );

// Adapts an Handler to an Azure Function that can be triggered by
// queueTrigger, cosmosDBTrigger, eventsHubTrigger and other event-based binding
export const azureFunction =
  <I, A, R>(h: H.Handler<I, A, R>) =>
  (
    deps: Omit<R, "logger"> & { inputDecoder: t.Decoder<unknown, I> }
  ): azure.AzureFunction =>
  (ctx) => {
    const result = pipe(ctx, azureFunctionTE(h, deps), TE.toUnion)();
    // we have to throws here to ensure that "retry" mechanism of Azure
    // can be executed
    if (result instanceof Error) {
      throw result;
    }
  };

const HttpRequestC = new t.Type<
  H.HttpRequest,
  AzureHttpRequest,
  AzureHttpRequest
>(
  "NumberCodec",
  H.HttpRequest.is,
  ({ params: path, ...req }) =>
    t.success({
      ...req,
      path,
    }),
  /* c8 ignore next 4 */
  ({ path: params, ...req }) => ({
    ...req,
    params,
  })
);

const AzureHttpRequestC = t.type({
  method: H.HttpRequest.props.method,
  url: t.string,
  params: t.record(t.string, t.string),
  query: t.record(t.string, t.string),
  headers: t.record(t.string, t.string),
  body: t.unknown,
});

type AzureHttpRequest = t.TypeOf<typeof AzureHttpRequestC>;

const HttpRequestFromAzure = AzureHttpRequestC.pipe(
  HttpRequestC,
  "HttpRequestFromAzure"
);

const toAzureHttpResponse = (
  res: H.HttpResponse<unknown, H.HttpStatusCode>
): azure.HttpResponse => ({
  statusCode: res.statusCode,
  body: res.body,
  headers: res.headers,
});

// Prevent HTTP triggered Azure Functions from crashing
// If an handler returns with an error (RTE.left),
// logs it and show an Internal Server Error.
const logErrorAndReturnHttpResponse = (e: Error) =>
  flow(
    L.error("uncaught error from handler", { error: e }),
    T.fromIO,
    T.map(() =>
      pipe(
        new H.HttpError("Something went wrong."),
        H.toProblemJson,
        H.problemJson
      )
    )
  );

// Adapts an HTTP Handler to an Azure Function that is triggered by HTTP,
// wiring automatically the HttpRequest inputDecoder and  the logger
export const httpAzureFunction =
  <R>(
    h: H.Handler<H.HttpRequest, H.HttpResponse<unknown, H.HttpStatusCode>, R>
  ) =>
  (deps: Omit<R, "logger">): azure.AzureFunction =>
  (ctx) =>
    pipe(
      ctx,
      azureFunctionTE(h, {
        ...deps,
        inputDecoder: HttpRequestFromAzure,
      }),
      TE.getOrElseW((e) =>
        logErrorAndReturnHttpResponse(e)({
          logger: getLogger(ctx),
        })
      ),
      T.map(toAzureHttpResponse)
    )();
