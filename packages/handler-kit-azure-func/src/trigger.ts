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

const getFunctionTrigger = () =>
  flow(
    (ctx: azure.Context) => ctx.bindingDefinitions,
    A.findLast(FunctionTrigger.is),
    E.fromOption(() => new Error("Trigger not supported."))
  );

export class BindingNotFoundError extends Error {
  name = "BindingNotFoundError";
  bindingName: string;
  bindings: azure.ContextBindingData;
  constructor(bindingName: string, bindings: azure.ContextBindingData) {
    super("Unable to find binding data");
    this.bindingName = bindingName;
    this.bindings = bindings;
  }
}

const getBindingData = (name: string) => (ctx: azure.Context) =>
  pipe(
    ctx.bindings,
    lookup(name),
    E.fromOption((): Error => new BindingNotFoundError(name, ctx.bindingData))
  );

export const getTriggerBindingData = flow(
  getFunctionTrigger,
  RE.map((trigger) => trigger.name),
  RE.chain(getBindingData)
);
