# @pagopa/logger

A tiny and pluggable logger for `fp-ts` based projects.

## How to use it

First of all declare your concrete implementation of the logger

```typescript
// my-logger.ts

import * as L from "@pagopa/logger";

const ConsoleLogger: L.Logger = {
  // log function should return a IO<void>
  log: (r) => () => console.log(r),
  // specify the log formatter function
  // @pagopa/logger includes two formatters
  // - json (for structured logging)
  // - simple (for debug in local machine)
  format: L.format.json,
};
```

Use it in your code

```typescript
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe } from "fp-ts/function"

import * as L from "@pagopa/logger"

import { ConsoleLogger } from "./my-logger";

const greet = (name: string) => pipe(
  RTE.right(name),
  RTE.chainFirstW((name) => L.infoRTE("greet called", { name }))
  RTE.map(name => `Hello ${name}`),
);

greet("robert")({
  logger: ConsoleLogger,
});
```

When executed this code prints

```
{"timestamp":"1995-07-14T11:16:13.000Z", "level": "info", "message": "greet called", "name": "robert"}
```

Or (with `L.format.simple` formatter)

```
[INFO] greet called

{
  "timestamp": "1995-07-14T11:16:13.000Z",
  "name": "robert"
}
```

See the unit tests for other examples
