import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { executePlugin } from "@/lib/plugin-executor/execute";
import { handleTaskCompletion } from "./completion";
import { notifyTask } from "./emitter";
import { executeTask } from "./runner";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle<typeof schema>>;
vi.mock("@/db", async () => ({
    ...(await import("@/db/schema")),
    getDb: async () => db,
}));
vi.mock("@/lib/plugin-executor/execute", () => ({ executePlugin: vi.fn() }));
vi.mock("@/lib/plugin-executor/prepare-asset-input.server", () => ({
    prepareAssetInput: async (_slot: string, input: unknown) => input,
}));
vi.mock("@/lib/plugins/plugin-env-manifests.server", () => ({
    loadPluginEnvDecls: () => [],
}));
vi.mock("@/lib/plugins/missing-env-key", () => ({
    findMissingRequiredKey: () => null,
}));
vi.mock("@/lib/settings/env-store.server", () => ({
    loadEnvStore: async () => ({}),
}));
vi.mock("./engine-delegate.server", () => ({
    executeWorkflowViaEngine: vi.fn(),
}));
vi.mock("./emitter", () => ({
    notifyTask: vi.fn(),
    registerTask: () => new AbortController(),
    removeTask: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    sqlite = new Database(":memory:");
    db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: "drizzle" });
    db.insert(schema.tasks)
        .values({
            id: "task",
            nodeId: "node",
            feature: "image-edit",
            pluginId: "test",
            prompt: "{}",
        })
        .run();
});
afterEach(() => sqlite.close());

it("saves single-node assets before announcing completion, without a frontend", async () => {
    vi.mocked(executePlugin).mockResolvedValue({
        success: true,
        image: { file_key: "tasks\\task\\image.png", mime: "image/png" },
    } as never);
    vi.mocked(notifyTask).mockImplementation((_id, status) => {
        if (status === "COMPLETED") {
            expect(db.select().from(schema.materials).all()).toHaveLength(1);
        }
    });
    await executeTask("task");
    expect(db.select().from(schema.tasks).get()?.status).toBe("completed");
    const saved = db.select().from(schema.materials).all();
    expect(saved).toHaveLength(1);
    expect(saved[0].type).toBe("image");
    expect(JSON.parse(saved[0].content)).toEqual({
        fileKeys: ["tasks\\task\\image.png"],
    });
});

it("backfills nested and legacy outputs atomically and deduplicates concurrent callbacks", async () => {
    db.update(schema.tasks).set({ status: "completed" }).run();
    const data = {
        feature: "workflow",
        file_key: "tasks/a.png",
        outputs: {
            node: {
                image: { file_key: "tasks/a.png", mime: "image/png" },
                images: [{ file_key: "tasks/b.webp" }],
                text: "hello",
            },
            legacy: ["tasks/c.jpg", "caption"],
            invalid: { file_key: 42, texts: [null, 3], mime: "image/png" },
        },
    };
    const results = await Promise.all(
        Array.from({ length: 3 }, () =>
            handleTaskCompletion("task", "WORKFLOW_COMPLETED", data),
        ),
    );
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.reduce((n, r) => n + r.savedMaterials, 0)).toBe(4);
    const saved = db.select().from(schema.materials).all();
    expect(saved.filter((m) => m.type === "image")).toHaveLength(3);
    expect(JSON.parse(saved.find((m) => m.type === "text")!.content)).toEqual({
        texts: ["hello", "caption"],
    });
});

it("does not publish assets from failed or cancelled tasks", async () => {
    db.update(schema.tasks).set({ status: "cancelled" }).run();
    await handleTaskCompletion("task", "COMPLETED", {
        image: { file_key: "tasks/a.png" },
    });
    expect(db.select().from(schema.materials).all()).toHaveLength(0);
});
