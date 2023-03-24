import * as t from "io-ts";

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
