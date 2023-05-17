import * as t from "io-ts";

import * as multipart from "parse-multipart";

import { pipe, flow } from "fp-ts/lib/function";
import { lookup } from "fp-ts/lib/Record";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";

import { HttpBadRequestError } from "./error";

export const HttpRequest = t.type({
  method: t.keyof({
    GET: null,
    POST: null,
    PUT: null,
    PATCH: null,
    DELETE: null,
    HEAD: null,
    OPTIONS: null,
    TRACE: null,
    CONNECT: null,
  }),
  path: t.record(t.string, t.string),
  query: t.record(t.string, t.string),
  headers: t.record(t.string, t.string),
  body: t.unknown,
  url: t.string,
});

export type HttpRequest = t.TypeOf<typeof HttpRequest>;

export const request = (url: string): HttpRequest => ({
  url,
  method: "GET",
  path: {},
  query: {},
  headers: {},
  body: undefined,
});

// TODO: write a better multipart/form-data parser
// that parse also the meta informartion (name and other key value fields)
export const parseMultipart = (req: HttpRequest) =>
  pipe(
    sequenceS(E.Apply)({
      boundary: pipe(
        req.headers,
        lookup("content-type"),
        E.fromOption(
          () => new HttpBadRequestError("missing content-type header")
        ),
        E.filterOrElse(
          (contentType) => contentType.includes("multipart/form-data"),
          () =>
            new HttpBadRequestError(
              "the content-type is not multipart/form-data"
            )
        ),
        E.chain(
          flow(
            multipart.getBoundary,
            E.fromPredicate(
              (parsedBoundary) => parsedBoundary !== "",
              () =>
                new HttpBadRequestError(
                  "unable to get boundary from request header"
                )
            )
          )
        )
      ),
      requestBody: pipe(
        req.body,
        E.fromPredicate(
          Buffer.isBuffer,
          () =>
            new HttpBadRequestError("invalid request body, should be a buffer")
        )
      ),
    }),
    E.map(({ requestBody, boundary }) => multipart.Parse(requestBody, boundary))
  );
