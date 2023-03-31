# @pagopa/handler-kit-azure-func

`@pagopa/handler-kit` adapter for `Azure Functions`

### How to use it

```typescript
import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

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
    RTE.chainW(getMoviesByGenre),
    RTE.map((movies) => ({ items: movies })),
    // wrap in a 200 HTTP response, with content-type JSON
    RTE.map(H.successJson),
    // converts Error instances to problem json (RFC 7807) objects
    RTE.orElseW(flow(H.toProblemJson, H.problemJson, RTE.of))
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

// just use "httpAzureFunction"

const GetMoviesFunction = httpAzureFunction(GetMovies)({
  movies,
});

// now GetMoviesFunction can be called by the Azure runtime
```

See the unit tests for other examples
