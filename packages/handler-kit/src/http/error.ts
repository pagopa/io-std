import { ValidationError } from "../validation";
import { HttpErrorStatusCode, ProblemJson } from "./response";

export class HttpError extends Error {
  name = "HttpError";
  status: HttpErrorStatusCode = 500 as const;
  title = "Internal Server Error";
}

export class HttpBadRequestError extends HttpError {
  status = 400 as const;
  title = "Bad Request";
}

export class HttpUnauthorizedError extends HttpError {
  status = 401 as const;
  title = "Unauthorized";
  message = "You must provide a valid API key to access this resource.";
}

export class HttpForbiddenError extends HttpError {
  status = 403 as const;
  title = "Forbidden";
}

export class HttpNotFoundError extends HttpError {
  status = 404 as const;
  title = "Not Found";
}

export class HttpConflictError extends HttpError {
  status = 409 as const;
  title = "Conflict";
}

export class HttpUnprocessableEntityError extends HttpError {
  status = 422 as const;
  title = "Unprocessable Entity";
}

export class HttpTooManyRequestsError extends HttpError {
  status = 429 as const;
  title = "Too many request";
}

export class HttpServiceUnavailableError extends HttpError {
  status = 503 as const;
  title = "Service Unavailable";
}

export const toProblemJson = (e: Error): ProblemJson => {
  if (e instanceof ValidationError) {
    return {
      type: "/problem/validation-error",
      title: "Validation Error",
      detail: "Your request didn't validate",
      status: 422,
      violations: e.violations,
    };
  }
  if (e instanceof HttpError) {
    return {
      title: e.title,
      status: e.status,
    };
  }
  return {
    title: "Internal Server Error",
    detail: "Something went wrong",
    status: 500,
  };
};
