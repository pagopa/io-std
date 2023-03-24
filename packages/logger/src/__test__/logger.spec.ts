import { beforeEach, describe, it, vi, expect } from "vitest";
import { Logger, log, info } from "../logger";

type LogTestContext = {
  logger: Logger;
};

describe("log", () => {
  beforeEach<LogTestContext>((ctx) => {
    ctx.logger = {
      log: vi.fn(() => () => {}),
      format: vi.fn((r) => `${r.level}: ${r.message}`),
      context: {
        env: "vitest",
      },
    };
  });
  it<LogTestContext>("calls the format function before print", (ctx) => {
    log("info")("just a test")(ctx);
    expect(ctx.logger.format).toHaveBeenCalled();
    expect(ctx.logger.format).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "info",
        message: "just a test",
      })
    );
  });
  it<LogTestContext>("adds the context to the log record", (ctx) => {
    const logContext = { name: "luca" };
    info("hello with context", logContext)(ctx);
    expect(ctx.logger.format).toHaveBeenLastCalledWith(
      expect.objectContaining(logContext)
    );
    const timestamp = new Date("1995-07-14T11:16:13.000Z");
    vi.setSystemTime(timestamp);
    info("hello without context")(ctx);
    expect(ctx.logger.format).toHaveBeenCalledWith({
      level: "info",
      message: "hello without context",
      timestamp,
      env: "vitest",
    });
  });
  it<LogTestContext>("adds the root context to the log record", (ctx) => {
    const timestamp = new Date("1995-07-14T11:16:13.000Z");
    vi.setSystemTime(timestamp);
    log("error")("testing the root context")(ctx);
    expect(ctx.logger.format).toHaveBeenLastCalledWith(
      expect.objectContaining(ctx.logger.context)
    );
    info("testing a logger with an empty root context")({
      logger: {
        ...ctx.logger,
        context: {},
      },
    });
    expect(ctx.logger.format).toHaveBeenLastCalledWith({
      level: "info",
      message: "testing a logger with an empty root context",
      timestamp,
    });
  });
  it<LogTestContext>("calls the log function with the serialized message and level", (ctx) => {
    info("testing the logging.log function")(ctx);
    expect(ctx.logger.log).toHaveBeenCalledWith(
      "info: testing the logging.log function",
      "info"
    );
  });
});
