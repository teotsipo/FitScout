const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify({
    message: "FitScout backend is running!"
  }));
});

server.listen(PORT, () => {
  console.log(`FitScout backend running on port ${PORT}`);
});
