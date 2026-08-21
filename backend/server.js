require("dotenv").config();
const http = require("http");
const OpenAI = require("openai");

const PORT = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method === "GET" && req.url === "/") return sendJson(res, 200, { message: "FitScout backend is running!" });

  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 12_000_000) req.destroy();
    });
    req.on("end", async () => {
      let payload;
      try { payload = body ? JSON.parse(body) : {}; }
      catch { return sendJson(res, 400, { error: "Invalid JSON request." }); }

      if (!payload.image || typeof payload.image !== "string") return sendJson(res, 400, { error: "An image is required." });
      if (!process.env.OPENAI_API_KEY) return sendJson(res, 500, { error: "OPENAI_API_KEY is not configured on the backend." });

      try {
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [{ role: "user", content: [
            { type: "input_text", text: `Analyze this outfit photo for FitScout. Identify visible clothing and footwear items that could realistically be searched for affordable alternatives. Return ONLY valid JSON with this shape: {"items":[{"category":"top|bottom|outerwear|shoes|accessory|other","description":"short visual description","color":"main color","style":"style or fit","brand":"brand if clearly visible, otherwise null"}]}. Do not guess a brand when it is not visible. ${payload.tag ? `The user's optional description is: ${payload.tag}` : "There is no user description."}` },
            { type: "input_image", image_url: payload.image }
          ] }],
          temperature: 0.2
        });

        const raw = response.output_text.trim();
        let analysis;
        try { analysis = JSON.parse(raw); }
        catch { return sendJson(res, 502, { error: "AI returned an unexpected response.", raw }); }
        sendJson(res, 200, { success: true, filename: payload.filename || null, analysis });
      } catch (error) {
        console.error("OpenAI analysis error:", error);
        sendJson(res, 500, { error: "AI outfit analysis failed.", details: error.message });
      }
    });
    return;
  }
  sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, () => console.log(`FitScout backend running on port ${PORT}`));
