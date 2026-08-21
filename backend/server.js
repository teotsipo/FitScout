const http = require("http");

const PORT = process.env.PORT || 3000;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    sendJson(res, 200, {
      message: "FitScout backend is running!"
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      // Prevent accidentally accepting an extremely large request.
      if (body.length > 2_000_000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      let payload;

      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        sendJson(res, 400, { error: "Invalid JSON request." });
        return;
      }

      sendJson(res, 200, {
        success: true,
        message: "Image received. AI analysis will be connected next.",
        filename: payload.filename || null,
        tag: payload.tag || null
      });
    });

    return;
  }

  sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`FitScout backend running on port ${PORT}`);
});
