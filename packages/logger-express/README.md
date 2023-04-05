# @pagopa/logger-express

`@pagopa/logger` adapter for express, inspired by [morgan](https://github.com/expressjs/morgan)

this package includes two middlewares:

- `logger` to decorate `express.Request` with a `log` function
- `access` to enable HTTP request logs

## How to use it

Declare your concrete implementation of the logger

```typescript
// my-logger.ts

import * as L from "@pagopa/logger";

const ConsoleLogger: L.Logger = {
  log: (r) => () => console.log(r),
  format: L.format.json,
};
```

Use it in your express app

```typescript
import express from "express";

import * as L from "@pagopa/logger";
import { logger, access } from "@pagopa/logger-express";

import { ConsoleLogger } from "./my-logger";

const app = express();

// decorate "req" with "log" function
app.use(logger(ConsoleLogger));

// enable HTTP request logging
app.use(access());

app.get("/", (req, res) => {
  // logs with "info" level and name in context
  req.log?.("info", "Hello!!", {
    name: req.query.name,
  });
  res.json({
    message: "it works!",
  });
});

app.listen(3000);
```

The access middleware supports a `skip` option

```typescript
app.use(
  access({
    // skip successful response
    skip: (req, res) => res.statusCode === 200,
  })
);
```
