
import { appRouter } from "../src/server/router";
import { createContext } from "../src/server/router/context";
import { prisma } from "../src/server/db/client";
import { performance } from "perf_hooks";

async function main() {
    console.log("Starting chat benchmark...");

    // 1. Create Mock Sessions for 2 users
    const user1 = {
        user: { id: "mock-user-alice", name: "Alice", email: "alice@example.com", image: "https://i.pravatar.cc/150?u=alice" },
        expires: "2099-01-01T00:00:00.000Z",
    };
    const user2 = {
        user: { id: "mock-user-bob", name: "Bob", email: "bob@example.com", image: "https://i.pravatar.cc/150?u=bob" },
        expires: "2099-01-01T00:00:00.000Z",
    };

    // Upsert users
    await prisma.user.upsert({
        where: { id: user1.user.id },
        create: user1.user,
        update: user1.user,
    });
    await prisma.user.upsert({
        where: { id: user2.user.id },
        create: user2.user,
        update: user2.user,
    });

    // 2. Find or Create a Station
    // We need a station to send messages to
    let station = await prisma.station.findFirst({ include: { playbackContext: true } } as any);
    if (!station) {
        console.log("No station found, creating one...");
        station = await prisma.station.create({
            data: {
                name: "Benchmark Station",
                userId: user1.user.id,
            },
        });
    }

    console.log(`Using station: ${station.id} ("${station.name}")`);

    // 3. Create caller for User 1
    // We mock the context which includes session and eventEmitter
    const ctx1 = await createContext({} as any);
    ctx1.session = user1 as any;
    const caller1 = appRouter.createCaller(ctx1);

    // 4. Benchmark sendLoop
    const iterations = 10;
    console.log(`Sending ${iterations} messages from Alice...`);

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const msgStart = performance.now();
        await caller1.station.sendMessage({ stationId: station.id, message: `Benchmark msg ${i} from Alice` });
        const msgEnd = performance.now();
        console.log(`Message ${i} took ${(msgEnd - msgStart).toFixed(2)}ms`);
    }
    const end = performance.now();

    console.log(`\nTotal time: ${(end - start).toFixed(2)}ms`);
    console.log(`Average time per message: ${((end - start) / iterations).toFixed(2)}ms`);

    console.log("Benchmark complete.");
    process.exit(0);
}

main().catch(console.error);
