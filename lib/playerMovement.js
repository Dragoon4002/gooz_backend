"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8082 });
wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        console.log(`Player Movement - Received message => ${message}`);
    });
    ws.send("Hello! Message From Player Movement Server!!");
});
console.log("Player Movement WebSocket server is running on ws://localhost:8082");
