import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { appRouter } from "./api/routers/_app";
import { createTRPCContext as createContext } from "./api/trpc";

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

console.log("✅ WebSocket Server listening on ws://localhost:3001");

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
