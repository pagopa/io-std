import * as t from "io-ts";

import { flow, pipe } from "fp-ts/function";

import { lookup } from "fp-ts/Record";

import * as A from "fp-ts/Array";

import * as azure from "@azure/functions";

import * as E from "fp-ts/Either";

import * as RE from "fp-ts/ReaderEither";

const FunctionTrigger = t.type({
  type: t.keyof({
    httpTrigger: null,
    queueTrigger: null,
    blobTrigger: null,
    eventHubTrigger: null,
    cosmosDBTrigger: null,
  }),
  direction: t.literal("in"),
  name: t.string,
});

type FunctionTrigger = t.TypeOf<typeof FunctionTrigger>;

const getFunctionTrigger = () =>
  flow(
    (ctx: azure.Context) => ctx.bindingDefinitions,
    A.findLast(FunctionTrigger.is),
    E.fromOption(() => new Error("Trigger not supported."))
  );

export class BindingNotFoundError extends Error {
  name = "BindingNotFoundError";
  bindingName: string;
  bindings: azure.ContextBindings;
  constructor(bindingName: string, bindings: azure.ContextBindings) {
    super("Unable to find binding data");
    this.bindingName = bindingName;
    this.bindings = bindings;
  }
}

const getBindings = (t: FunctionTrigger) => (ctx: azure.Context) => {
  if (t.type === "blobTrigger") {
    return E.right(ctx.bindingData);
  }
  return pipe(
    ctx.bindings,
    lookup(t.name),
    E.fromOption((): Error => new BindingNotFoundError(t.name, ctx.bindings))
  );
};

export const getTriggerBindingData = flow(
  getFunctionTrigger,
  RE.chain(getBindings)
);
