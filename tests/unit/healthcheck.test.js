const http = require("http");
const EventEmitter = require("events");
const { runHealthcheck } = require("../../healthcheck");

describe("healthcheck unit", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("resolves 0 when response statusCode 200", async () => {
    jest.spyOn(http, "request").mockImplementation((options, cb) => {
      const req = new EventEmitter();
      req.end = () => {};
      // simulate response
      const res = { statusCode: 200 };
      process.nextTick(() => cb(res));
      return req;
    });

    const code = await runHealthcheck();
    expect(code).toBe(0);
  });

  test("resolves 1 when response statusCode !== 200", async () => {
    jest.spyOn(http, "request").mockImplementation((options, cb) => {
      const req = new EventEmitter();
      req.end = () => {};
      const res = { statusCode: 500 };
      process.nextTick(() => cb(res));
      return req;
    });

    const code = await runHealthcheck();
    expect(code).toBe(1);
  });

  test("resolves 1 on request error", async () => {
    jest.spyOn(http, "request").mockImplementation((options, cb) => {
      const req = new EventEmitter();
      req.end = () => {};
      process.nextTick(() => req.emit("error", new Error("fail")));
      return req;
    });

    const code = await runHealthcheck();
    expect(code).toBe(1);
  });

  test("resolves 1 on timeout", async () => {
    jest.spyOn(http, "request").mockImplementation((options, cb) => {
      const req = new EventEmitter();
      req.end = () => {};
      // emit timeout after a tick
      process.nextTick(() => req.emit("timeout"));
      return req;
    });

    const code = await runHealthcheck();
    expect(code).toBe(1);
  });
});
