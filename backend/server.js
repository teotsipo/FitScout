require("dotenv").config();
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

function mockAnalyzeOutfit(tag) {
  const normalizedTag = String(tag || "").toLowerCase();

  if (normalizedTag.includes("jacket") || normalizedTag.includes("blazer")) {
    return [
      { category: "outerwear", description: "structured casual jacket", color: "neutral", style: "modern relaxed fit", brand: null },
      { category: "top", description: "basic crew-neck T-shirt", color: "white", style: "regular fit", brand: null },
      { category: "bottom", description: "straight-leg trousers or jeans", color: "blue", style: "straight fit", brand: null },
      { category: "shoes", description: "low-top casual sneakers", color: "white", style: "minimal", brand: null }
    ];
  }

  return [
    { category: "top", description: "basic casual T-shirt", color: "white", style: "regular fit", brand: null },
    { category: "bottom", description: "casual straight-leg trousers", color: "blue", style: "straight fit", brand: null },
    { category: "shoes", description: "low-top casual sneakers", color: "white", style: "minimal", brand: null }
  ];
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    sendJson(res, 200, { message: "FitScout backend is running!" });
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 12_000_000) req.destroy();
    });

    req.on("end", () => {
      let payload;

      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        sendJson(res, 400, { error: "Invalid JSON request." });
        return;
      }

      if (!payload.image || typeof payload.image !== "string") {
        sendJson(res, 400, { error: "An image is required." });
        return;
      }

      const items = mockAnalyzeOutfit(payload.tag);

      sendJson(res, 200, {
        success: true,
        mode: "mock",
        filename: payload.filename || null,
        analysis: { items }
      });
    });

    return;
  }

  sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`FitScout backend running on port ${PORT}`);
});
