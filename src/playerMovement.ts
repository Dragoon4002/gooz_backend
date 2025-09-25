import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8082 });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Player Movement - Received message => ${message}`);
  });
  ws.send("Hello! Message From Player Movement Server!!");
});

console.log("Player Movement WebSocket server is running on ws://localhost:8082");