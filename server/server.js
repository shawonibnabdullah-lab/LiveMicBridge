
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("LiveMicBridge server is running!");
});

const wss = new WebSocket.Server({ server });

let sender = null;
const listeners = new Set();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const role = url.searchParams.get("role");

  if (role === "sender") {
    if (sender && sender.readyState === WebSocket.OPEN) {
      sender.close();
    }
    sender = ws;
  } else if (role === "listener") {
    listeners.add(ws);
  } else {
    ws.close(1008, "Invalid role");
    return;
  }

  ws.on("message", (data, isBinary) => {
    if (ws !== sender) return;

    for (const listener of listeners) {
      if (listener.readyState === WebSocket.OPEN) {
        listener.send(data, { binary: isBinary });
      }
    }
  });

  ws.on("close", () => {
    if (sender === ws) sender = null;
    listeners.delete(ws);
  });

  ws.on("error", () => {
    if (sender === ws) sender = null;
    listeners.delete(ws);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`LiveMicBridge running on port ${PORT}`);
});
