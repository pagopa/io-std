# @pagopa/handler-kit-express

`@pagopa/handler-kit-express` adapter for `Express`

### How to use it

```typescript
import { httpExpress } from "@pagopa/handler-kit-express";

// Given an Handler
// (from the @pagopa/handler README example)

const GetMovies = H.of((req: H.HttpRequest) =>
  pipe(
    req.body,
    // perform a refinement with io-ts, and returns a ValidationError
    // that represents a 422 HTTP response
    H.parse(GetMoviesBody),
    E.map(({ genre }) => genre),
    RTE.fromEither,
    RTE.chainTaskEither(getMoviesByGenre),
    RTE.map((movies) => ({ items: movies })),
    // wrap in a 200 HTTP response, with content-type JSON
    RTE.map(H.successJson),
    // convert Error instances to problem json (RFC 7808) objects
    RTE.orElseW(flow(H.toProblemJson, H.problemJson))
  )
);

// instead of wiring manually the dependencies

/*
GetMovies({
  input: ...,
  inputDecoder: ...,
  logger: ...,
  movies: ...
})*/

// just use "httpExpress"
const GetMoviesExpress = httpExpress(GetMovies)({
  movies,
});

const ConsoleLogger: L.Logger = {
  log: (r) => () => console.log(r),
  format: L.format.json,
};

// now GetMoviesRoute can be called by the Express runtime
const app = express.default();
app.use(express.json());

// decorate "req" with "log" function
app.use(logger(ConsoleLogger));

// enable HTTP request logging
app.use(access());

app.post("/", GetMoviesExpress);

app.listen(3001, () => {
  // eslint-disable-next-line no-console
  console.log("Server ready on port 3001");
});
```

See the unit tests for other examples
