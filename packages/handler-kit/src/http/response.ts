import { flow } from "fp-ts/function";
import * as t from "io-ts";

const HttpSuccessStatusCode = t.union([
  t.literal(200),
  t.literal(201),
  t.literal(202),
  t.literal(204),
]);

export type HttpSuccessStatusCode = t.TypeOf<typeof HttpSuccessStatusCode>;

const HttpRedirectionStatusCode = t.union([
  t.literal(301),
  t.literal(302),
  t.literal(304),
]);

const HttpErrorStatusCode = t.union([
  t.literal(400),
  t.literal(401),
  t.literal(403),
  t.literal(404),
  t.literal(409),
  t.literal(422),
  t.literal(429),
  t.literal(500),
  t.literal(501),
  t.literal(503),
]);

export type HttpErrorStatusCode = t.TypeOf<typeof HttpErrorStatusCode>;

const HttpStatusCode = t.union([
  HttpSuccessStatusCode,
  HttpRedirectionStatusCode,
  HttpErrorStatusCode,
]);

export type HttpStatusCode = t.TypeOf<typeof HttpStatusCode>;

export type HttpResponse<A, S extends HttpStatusCode = 200> = {
  statusCode: S;
  headers: Record<string, string>;
  body: A;
};

export const withStatusCode =
  <S extends HttpStatusCode>(statusCode: S) =>
  <A>(r: HttpResponse<A, HttpStatusCode>): HttpResponse<A, S> => ({
    ...r,
    statusCode,
  });

export const withHeader =
  (name: string, value: string) =>
  <A, S extends HttpStatusCode>({
    headers,
    ...r
  }: HttpResponse<A, S>): HttpResponse<A, S> => ({
    ...r,
    headers: {
      ...headers,
      [name]: value,
    },
  });

// Adds security headers to http response.
// it's a porting of the security middleware used by other microservices of the IO platform
// reference: https://github.com/pagopa/io-functions-commons/blob/master/src/utils/express.ts
export const withSecurityHeaders = <A, S extends HttpStatusCode>(
  r: HttpResponse<A, S>
): HttpResponse<A, S> => ({
  ...r,
  headers: {
    "Content-Security-Policy": "default-src 'none'; upgrade-insecure-requests",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-XSS-Protection": "0",
    ...r.headers,
  },
});

export const empty: HttpResponse<null, 204> = withSecurityHeaders({
  statusCode: 204,
  body: null,
  headers: {},
});

export const success = <A>(body: A): HttpResponse<A, 200> =>
  withSecurityHeaders({
    statusCode: 200,
    headers: {},
    body,
  });

export const successJson = flow(
  success,
  withHeader("Content-Type", "application/json")
);

export const createdJson = flow(successJson, withStatusCode(201));

export type ProblemJson = {
  type?: string;
  title: string;
  status: HttpErrorStatusCode;
  detail?: string;
  [extra: string]: unknown;
};

export const problemJson = (
  problem: ProblemJson
): HttpResponse<ProblemJson, HttpErrorStatusCode> =>
  withSecurityHeaders({
    statusCode: problem.status,
    body: problem,
    headers: {
      "Content-Type": "application/problem+json",
    },
  });
