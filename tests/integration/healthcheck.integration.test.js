const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const HEALTHCHECK_SCRIPT = path.join(__dirname, "..", "..", "healthcheck.js");

function runHealthcheckProcess() {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [HEALTHCHECK_SCRIPT], { stdio: "ignore" });
    proc.on("error", reject);
    proc.on("exit", (code) => resolve(code));
  });
}

describe("healthcheck integration", () => {
  let server;
  beforeAll(() => {
    jest.setTimeout(15000);
  });

  afterEach((done) => {
    if (!server) return done();
    server.close(() => {
      server = null;
      done();
    });
  });

  test("exits 0 when /health returns 200", async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200);
        res.end("ok");
      } else {
        res.writeHead(404);
        res.end();
      }
    }).listen(3000);

    const code = await runHealthcheckProcess();
    expect(code).toBe(0);
  });

  test("exits non-zero when /health returns 500", async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(500);
        res.end("error");
      } else {
        res.writeHead(404);
        res.end();
      }
    }).listen(3000);

    const code = await runHealthcheckProcess();
    expect(code).not.toBe(0);
  });
});
