import { describe, it, expect, vi } from "vitest";

import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";

import { pipe, flow } from "fp-ts/function";
import { lookup } from "fp-ts/Record";

import * as H from "@pagopa/handler-kit";
import { expressHandler } from "../express";
import express from "express";
import request from "supertest";
import { logger } from "@pagopa/logger-express";
import * as L from "@pagopa/logger";

describe("expressHandler", () => {
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
  it("wires the http request correctly and returns the correct response", async () => {
    const GreetFunction = expressHandler(GreetHandler)({
      lang: "it",
    });
    const app = express();
    app.use(express.json());
    app.use(
      logger({
        log: (r) => () => console.log(r),
      })
    );
    app.get("/greet", GreetFunction);
    await request(app).get("/greet?name=Silvia").expect(200, {
      message: "Ciao Silvia",
    });
  });
  it("recovers from uncaught errors", async () => {
    const ConsoleLogger: L.Logger = {
      log: vi.fn((r) => () => {}),
    };
    const ErrorFunction = expressHandler(
      H.of((_) => RTE.left(new Error("unhandled error")))
    )({});
    const app = express();
    app.use(express.json());
    app.use(logger(ConsoleLogger));
    app.get("/error", ErrorFunction);
    const response = await request(app).get("/error");
    expect(response.statusCode).toBe(500);
    expect(ConsoleLogger.log).toHaveBeenCalled();
  });
});
