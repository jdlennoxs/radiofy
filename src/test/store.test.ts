import { describe, expect, it } from "vitest";
import * as store from "../server/store";

const alice = { id: "guest-alice", name: "Alice" };

describe("station store", () => {
  it("keeps chat messages in order", () => {
    store.addMessage("campfire", { type: "CHAT", sender: alice, body: "first" });
    store.addMessage("campfire", {
      type: "CHAT",
      sender: { id: "guest-bob", name: "Bob" },
      body: "second",
    });

    const chats =
      store.getStation("campfire")?.messages.filter((m) => m.type === "CHAT") ??
      [];
    expect(chats.at(-2)?.chat?.body).toBe("first");
    expect(chats.at(-1)?.chat?.body).toBe("second");
  });

  it("advances to the next track and ignores a stale end report", () => {
    store.play("campfire", "forss-flickermood", alice);
    expect(store.getStation("campfire")?.playback.trackId).toBe(
      "forss-flickermood"
    );

    // A FINISH from a track that is no longer current must not advance.
    store.advance("campfire", "some-other-track");
    expect(store.getStation("campfire")?.playback.trackId).toBe(
      "forss-flickermood"
    );

    store.advance("campfire", "forss-flickermood");
    expect(store.getStation("campfire")?.playback.trackId).toBe("bonobo-cirrus");
  });

  it("tracks presence as listeners join and leave", () => {
    const before = store.getStation("campfire")?.listenerCount ?? 0;
    store.addListener("campfire", alice.id);
    expect(store.getStation("campfire")?.listenerCount).toBe(before + 1);
    store.removeListener("campfire", alice.id);
    expect(store.getStation("campfire")?.listenerCount).toBe(before);
  });
});
