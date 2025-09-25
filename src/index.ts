import { WebSocketServer } from "ws";


const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Received message => ${message}`);
  });
  ws.send("Hello! Message From Server!!");
});

console.log("WebSocket server is running on ws://localhost:8080");