import { applyWSSHandler } from "@trpc/server/adapters/ws";
import fetch from "node-fetch";
import ws from "ws";
import { appRouter } from "./router";
import { createContext } from "./router/context";

if (!global.fetch) {
  (global as any).fetch = fetch;
}

const wss = new ws.Server({
  port: 3001,
});

const handler = applyWSSHandler({ wss, createContext, router: appRouter });

wss.on("connection", (ws) => {
  console.log(`++ ws connection ${wss.clients.size}`);
  ws.once("close", () => {
    console.log(`-- ws connection ${wss.clients.size}`);
  });
});

console.log("✅ WebSocket Server listening on ws://127.0.0.1:3001");

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
