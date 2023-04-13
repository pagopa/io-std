import * as t from "io-ts";

import * as T from "fp-ts/Task";
import * as RE from "fp-ts/ReaderEither";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { sequenceS } from "fp-ts/Apply";
import { pipe, flow } from "fp-ts/function";

import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";

import * as express from "express";

import { getLogger } from "./logger";

const hasLogger = <R, I>(u: unknown): u is R & H.HandlerEnvironment<I> =>
  typeof u === "object" && u !== null && "logger" in u;

// Populates Handler dependencies reading from express.Request
const expressHandlerTE = <I, A, R>(
  h: H.Handler<I, A, R>,
  deps: Omit<R, "logger"> & { inputDecoder: t.Decoder<unknown, I> }
) =>
  flow(
    sequenceS(RE.Apply)({
      logger: RE.fromReader(getLogger),
      input: (req: express.Request) => E.right(req),
    }),
    TE.fromEither,
    TE.map(({ input, logger }) => ({ input, logger, ...deps })),
    TE.filterOrElse(hasLogger<R, I>, () => new Error("Unmeet dependencies")),
    TE.chainW(h)
  );

const HttpRequestC = new t.Type<
  H.HttpRequest,
  ExpressHttpRequest,
  ExpressHttpRequest
>(
  "HttpRequestC",
  H.HttpRequest.is,
  (req) =>
    t.success({
      ...req,
      query: toHttp(req.query),
      headers: toHttp(req.headers),
      url: req.originalUrl,
      path: req.params,
    }),
  (req) => ({
    originalUrl: req.url,
    method: req.method,
    params: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body,
  })
);

const toHttp = (obj: Record<string, string | string[]>) =>
  Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: Array.isArray(value) ? value.join(",") : value,
    }),
    {}
  );

const ExpressHttpRequestC = t.type({
  method: H.HttpRequest.props.method,
  originalUrl: t.string,
  params: t.record(t.string, t.string),
  query: t.record(t.string, t.union([t.string, t.array(t.string)])),
  headers: t.record(t.string, t.union([t.string, t.array(t.string)])),
  body: t.unknown,
});

type ExpressHttpRequest = t.TypeOf<typeof ExpressHttpRequestC>;

const HttpRequestFromExpress = ExpressHttpRequestC.pipe(
  HttpRequestC,
  "HttpRequestFromExpress"
);

const toExpressResponse =
  (res: express.Response) =>
  (httpRes: H.HttpResponse<unknown, H.HttpStatusCode>): void => {
    res.set(httpRes.headers).status(httpRes.statusCode).send(httpRes.body);
  };

// Prevent and express handler from crashing
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
export const httpExpress =
  <R>(
    h: H.Handler<H.HttpRequest, H.HttpResponse<unknown, H.HttpStatusCode>, R>
  ) =>
  (deps: Omit<R, "logger">): express.Handler =>
  (req, res) =>
    pipe(
      req,
      expressHandlerTE(h, {
        ...deps,
        inputDecoder: HttpRequestFromExpress,
      }),
      TE.getOrElseW((e) =>
        logErrorAndReturnHttpResponse(e)({
          logger: getLogger(req),
        })
      ),
      T.map(toExpressResponse(res))
    )();
