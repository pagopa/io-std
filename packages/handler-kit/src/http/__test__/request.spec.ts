import { describe, test, expect } from "vitest";

import * as E from "fp-ts/lib/Either";

import { request, parseMultipart, HttpRequest } from "../request";
import { HttpBadRequestError } from "../error";

describe("parseMultipart", () => {
  test("HttpBadRequestError on invalid request", () => {
    const requests = [
      request("http://localhost"),
      {
        ...request("http://localhost"),
        headers: {
          "content-type": "application/json",
        },
      },
      {
        ...request("http://localhost"),
        headers: {
          "content-type": "multipart/form-data; boundary=ciao",
        },
      },
      {
        ...request("http://localhost"),
        headers: {
          "content-type": "multipart/form-data",
        },
      },
      {
        ...request("http://localhost"),
        headers: {
          "content-type": "multipart/form-data; boundary=XXA",
        },
        body: Buffer.from("my request body..."),
      },
    ];
    requests.map(parseMultipart).forEach((result) => {
      if (E.isLeft(result)) {
        expect(result.left).toBeInstanceOf(HttpBadRequestError);
      }
    });
    // one of the given http requests is valid :)
    expect.assertions(requests.length - 1);
  });
  test("should parse a valid multipart/form-data request", () => {
    const req: HttpRequest = {
      ...request("http://localhost"),
      headers: {
        "content-type": "multipart/form-data; boundary=testboundary",
      },
      body: Buffer.from(
        // this string is written in a single line to preserve line break (\r\n) used in HTTP protocol (RFC 2616)
        `--testboundary\r\nContent-Disposition:form-data; name="file1"; filename="file1.txt";\r\nContent-Type: text/plain\r\n\r\nHello from file1.txt\r\n--testboundary\r\nContent-Disposition: form-data; name="file2"; filename="hello.json";\r\nContent-Type: application/json\r\n\r\n{"message":"it works!"}\r\n--testboundary--`,
        "utf-8"
      ),
    };
    const multipart = parseMultipart(req);
    if (E.isRight(multipart)) {
      expect(multipart.right).toEqual([
        {
          filename: "file1.txt",
          type: "text/plain",
          data: Buffer.from("Hello from file1.txt", "utf-8"),
        },
        {
          filename: "hello.json",
          type: "application/json",
          data: Buffer.from(JSON.stringify({ message: "it works!" }), "utf-8"),
        },
      ]);
    }
  });
});
