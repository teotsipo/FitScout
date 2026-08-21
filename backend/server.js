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

const demoProducts = {
  top: [
    { name: "Basic Cotton T-Shirt", store: "Demo Store", price: 14.99, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 94 },
    { name: "Classic Regular T-Shirt", store: "Demo Store", price: 19.99, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 88 }
  ],
  bottom: [
    { name: "Straight Fit Denim Jeans", store: "Demo Store", price: 29.99, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 93 },
    { name: "Classic Straight Trousers", store: "Demo Store", price: 34.99, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 86 }
  ],
  shoes: [
    { name: "Minimal White Sneakers", store: "Demo Store", price: 39.99, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 95 },
    { name: "Everyday Low-Top Sneakers", store: "Demo Store", price: 44.99, image: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 87 }
  ],
  outerwear: [
    { name: "Relaxed Casual Jacket", store: "Demo Store", price: 39.99, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 91 },
    { name: "Classic Lightweight Jacket", store: "Demo Store", price: 49.99, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=500&auto=format&fit=crop", url: null, matchScore: 84 }
  ],
  accessory: [],
  other: []
};

function getDemoProducts(query) {
  const category = String(query.category || "other").toLowerCase();
  let products = demoProducts[category] || demoProducts.other;
  if (query.maxPrice !== undefined && query.maxPrice !== null && query.maxPrice !== "") {
    const maxPrice = Number(query.maxPrice);
    if (Number.isFinite(maxPrice)) products = products.filter(product => product.price <= maxPrice);
  }
  return products;
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  if (req.method === "GET" && req.url === "/") {
    return sendJson(res, 200, { message: "FitScout backend is running!" });
  }

  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 12_000_000) req.destroy();
    });
    req.on("end", () => {
      let payload;
      try { payload = body ? JSON.parse(body) : {}; }
      catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }
      if (!payload.image || typeof payload.image !== "string") return sendJson(res, 400, { error: "An image is required." });
      const items = mockAnalyzeOutfit(payload.tag);
      return sendJson(res, 200, { success: true, mode: "mock", filename: payload.filename || null, analysis: { items } });
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/products") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 100_000) req.destroy();
    });
    req.on("end", () => {
      let query;
      try { query = body ? JSON.parse(body) : {}; }
      catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }
      if (!query.category) return sendJson(res, 400, { error: "Product category is required." });
      return sendJson(res, 200, {
        success: true,
        mode: "demo",
        query: {
          category: query.category,
          description: query.description || null,
          color: query.color || null,
          style: query.style || null,
          maxPrice: query.maxPrice ?? null
        },
        products: getDemoProducts(query)
      });
    });
    return;
  }

  return sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => console.log(`FitScout backend running on port ${PORT}`));
