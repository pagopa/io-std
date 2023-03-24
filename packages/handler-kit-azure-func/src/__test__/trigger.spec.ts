import { describe, expect, it, vi } from "vitest";

import { Context } from "@azure/functions";

import { getTriggerBindingData } from "../trigger";

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

describe("getTriggerBindingData", () => {
  it("returns the payload of the defined trigger binding", () => {
    const payload = "TEST!";
    const ctx: Context = {
      ...baseCtx,
      bindingDefinitions: [
        {
          type: "queueTrigger",
          direction: "in",
          name: "foo",
        },
      ],
      bindings: {
        foo: payload,
      },
    };
    const data = getTriggerBindingData()(ctx);
    expect(data).toEqual(
      expect.objectContaining({
        right: payload,
      })
    );
  });
});
