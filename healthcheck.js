const http = require("http");

function runHealthcheck(options = {
  hostname: "localhost",
  port: 3000,
  path: "/health",
  timeout: 2000
}) {
  return new Promise((resolve) => {
    const request = http.request(options, (response) => {
      if (response.statusCode === 200) {
        resolve(0);
      } else {
        resolve(1);
      }
    });

    request.on("error", () => {
      resolve(1);
    });

    request.on("timeout", () => {
      try {
        if (typeof request.destroy === "function") {
          request.destroy();
        } else if (typeof request.abort === "function") {
          request.abort();
        }
      } catch (e) {
        // ignore errors from mocked requests
      }
      resolve(1);
    });

    request.end();
  });
}

module.exports = { runHealthcheck };

if (require.main === module) {
  runHealthcheck().then(code => process.exit(code));
}
