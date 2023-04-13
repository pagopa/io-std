import { describe, it, expect, beforeAll, vi, beforeEach } from "vitest";

import express from "express";
import request from "supertest";

import * as L from "@pagopa/logger";

import { logger, access } from "../middleware";

type TestContext = {
  app: express.Application;
  logger: L.Logger;
};

const timestamp = new Date("1995-07-14T11:16:13.000Z");

beforeAll(() => {
  vi.setSystemTime(timestamp);
});

beforeEach<TestContext>((ctx) => {
  ctx.logger = {
    log: vi.fn((x) => () => {}),
  };
});

describe("logger", () => {
  it<TestContext>("decorates Request with log function", async (ctx) => {
    const app = express();
    app.use(logger(ctx.logger));
    app.get("/is-log-func-defined", (req, res) => {
      res.json({
        logFuncDefined: typeof req.log !== "undefined",
      });
    });
    await request(app).get("/is-log-func-defined").expect(200, {
      logFuncDefined: true,
    });
  });
  it<TestContext>("wires correctly the log function", async (ctx) => {
    const app = express();
    app.use(logger(ctx.logger));
    app.get("/", (req, res) => {
      req.log?.("info", "testing the log fn");
      res.json({});
    });
    await request(app).get("/");
    expect(ctx.logger.log).toHaveBeenCalledWith(
      `{"timestamp":"1995-07-14T11:16:13.000Z","level":"info","message":"testing the log fn"}`,
      "info"
    );
  });
  it<TestContext>("wires correctly the logger", async (ctx) => {
    const app = express();
    app.use(logger(ctx.logger));
    app.get("/", (req, res) => {
      res.json({
        hasLogger: typeof req.logger !== "undefined",
      });
    });
    const res = await request(app).get("/");
    expect(res.body).toEqual({
      hasLogger: true,
    });
  });
});

describe("access", () => {
  it<TestContext>("logs every HTTP request", async (ctx) => {
    const app = express();
    app.use(logger(ctx.logger));
    app.use(access());
    app.get("/", (req, res) => {
      res.json({
        message: "it works!!",
      });
    });
    await request(app).get("/");
    await request(app).get("/");
    expect(ctx.logger.log).toHaveBeenCalledTimes(2);
  });

  it<TestContext>("skips successful responses", async (ctx) => {
    const app = express();
    app.use(logger(ctx.logger));
    app.use(
      access({
        skip: (_, res) => res.statusCode == 200,
      })
    );
    app.get("/", (req, res) => {
      res.status(req.query.error ? 500 : 200).end("Hello!");
    });
    await request(app).get("/");
    await request(app).get("/?error=true");
    expect(ctx.logger.log).toHaveBeenCalledTimes(1);
  });
});
