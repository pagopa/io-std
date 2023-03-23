import { beforeEach, describe, it, vi, expect, beforeAll } from "vitest";

import { debug, Logger } from "../logger";
import { json, simple } from "../format";

type FormatTestContext = {
  logger: Logger;
};

const timestamp = new Date("1995-07-14T11:16:13.000Z");

beforeAll(() => {
  vi.setSystemTime(timestamp);
});

describe("json", () => {
  beforeEach<FormatTestContext>((ctx) => {
    ctx.logger = {
      log: vi.fn(() => () => {}),
      format: json,
    };
  });
  it<FormatTestContext>("serializes Error instances correctly", (ctx) => {
    const message = "testing error instances";
    debug(message, {
      error: new Error("unexpected error!"),
    })(ctx);
    expect(ctx.logger.log).toBeCalledWith(
      `{"timestamp":"1995-07-14T11:16:13.000Z","level":"debug","message":"testing error instances","error":{"message":"unexpected error!","name":"Error"}}`,
      "debug"
    );
  });
  it<FormatTestContext>("recovers for serialization error with a fallback entry", (ctx) => {
    const circular: any = {
      foo: "bar",
    };
    circular.circular = circular;
    debug("testing fallback", {
      circular,
    })(ctx);
    expect(ctx.logger.log).toBeCalledWith(
      `{"timestamp":"1995-07-14T11:16:13.000Z","level":"debug","message":"unable to serialize the log entry","originalEntry":{"level":"debug","message":"testing fallback"}}`,
      "debug"
    );
  });
});

describe("simple", () => {
  beforeEach<FormatTestContext>((ctx) => {
    ctx.logger = {
      log: vi.fn(() => () => {}),
      format: simple,
    };
  });
  it<FormatTestContext>("serializes Error instances correctly", (ctx) => {
    const message = "testing error instances";
    debug(message, {
      error: new Error("unexpected error!"),
    })(ctx);
    expect(ctx.logger.log).toBeCalledWith(
      `[DEBUG] testing error instances

{
  "timestamp": "1995-07-14T11:16:13.000Z",
  "error": {
    "message": "unexpected error!",
    "name": "Error"
  }
}
`,
      "debug"
    );
  });
  it<FormatTestContext>("recovers for serialization error with a fallback entry", (ctx) => {
    const circular: any = {
      foo: "bar",
    };
    circular.circular = circular;
    debug("testing fallback", {
      circular,
    })(ctx);
    expect(ctx.logger.log).toBeCalledWith(
      `[DEBUG] testing fallback

Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    --- property 'circular' closes the circle
`,
      "debug"
    );
  });
});
