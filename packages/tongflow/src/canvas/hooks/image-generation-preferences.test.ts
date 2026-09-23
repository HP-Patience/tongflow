import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFlow } from "./use-flow";
import { usePluginsRegistryStore } from "./use-plugins-registry";
import { createTask } from "../lib/api/task";
import { apiPost } from "../lib/api/client";

vi.mock("../lib/api/client", () => ({ apiPost: vi.fn(), apiGet: vi.fn() }));
const storage = new Map<string, string>();
const pluginId = "tongflow-api-openai-compatible";
const config = {
    feature: "image-gen",
    pluginId,
    model: "custom/image",
    prompt: {},
    nodeId: "source",
};
const node = (id: string) => useFlow.getState().nodes.find((n) => n.id === id)!;

beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
    });
    vi.mocked(apiPost).mockReset().mockResolvedValue({ taskId: "test-task" });
    useFlow.setState({
        nodes: [],
        edges: [],
        historyPast: [],
        historyFuture: [],
        comboSelectedIds: new Set(),
    });
    usePluginsRegistryStore.setState({
        registry: {
            version: 1,
            generatedAt: "test",
            plugins: {},
            nodePluginMap: {
                "image-gen": ["default-plugin", pluginId],
                "image-edit": [pluginId],
                "image-fusion": [pluginId],
            },
        },
        isLoaded: true,
    });
});

describe("last used image selection", () => {
    it("restores implementation and custom model when Smart Island expands a text node", async () => {
        await createTask(config);
        const flow = useFlow.getState();
        const parent = flow.addNode({
            type: "textNode",
            data: { texts: ["test"] },
        });
        const [id] = flow.expands(parent, [{ type: "textGenImageNode" }]);
        expect(node(id).data).toMatchObject({
            pluginId,
            pluginModel: "custom/image",
        });
        expect(storage.size).toBeGreaterThan(0);
        flow.undo();
        expect(useFlow.getState().nodes.some((n) => n.id === id)).toBe(false);
        flow.redo();
        expect(node(id).data.pluginModel).toBe("custom/image");
    });

    it("keeps edit and fusion preferences separate and supports compose", async () => {
        await createTask(config);
        await createTask({
            ...config,
            feature: "image-edit",
            model: "edit-model",
        });
        await createTask({
            ...config,
            feature: "image-fusion",
            model: "fusion-model",
        });
        const flow = useFlow.getState();
        expect(
            node(flow.addNode({ type: "textGenImageNode" })).data.pluginModel,
        ).toBe("custom/image");
        expect(
            node(flow.addNode({ type: "imageGenImageNode" })).data.pluginModel,
        ).toBe("edit-model");
        expect(
            node(flow.compose({ type: "imageFusionNode", data: {} })).data
                .pluginModel,
        ).toBe("fusion-model");
        expect(
            node(flow.addNode({ type: "textGenVideoNode" })).data.pluginId,
        ).toBeUndefined();
    });

    it("does not overwrite explicit settings or existing reused cards", async () => {
        await createTask(config);
        const flow = useFlow.getState();
        const parent = flow.addNode({ type: "textNode" });
        const explicit = { pluginId: "default-plugin", pluginModel: "chosen" };
        const [id] = flow.expands(parent, [
            { type: "textGenImageNode", data: explicit },
        ]);
        await createTask({ ...config, model: "new-last-model" });
        flow.expands(parent, [{ type: "textGenImageNode" }]);
        expect(node(id).data).toMatchObject(explicit);
        expect(
            node(flow.addNode({ type: "textGenImageNode" })).data.pluginModel,
        ).toBe("new-last-model");
    });

    it("ignores removed implementations and malformed or blocked storage", async () => {
        await createTask({ ...config, pluginId: "removed" });
        const flow = useFlow.getState();
        expect(
            node(flow.addNode({ type: "textGenImageNode" })).data.pluginId,
        ).toBeUndefined();
        for (const key of storage.keys()) storage.set(key, "{bad json");
        expect(() => flow.addNode({ type: "textGenImageNode" })).not.toThrow();
        vi.stubGlobal("localStorage", {
            getItem() {
                throw Error("blocked");
            },
            setItem() {
                throw Error("blocked");
            },
        });
        expect(() => flow.addNode({ type: "textGenImageNode" })).not.toThrow();
        await expect(createTask(config)).resolves.toEqual({
            taskId: "test-task",
        });
        // Restore the stub before the existing canvas debounce runs.
        vi.stubGlobal("localStorage", {
            getItem: () => null,
            setItem: () => {},
        });
    });

    it("does not remember rejected tasks", async () => {
        await createTask(config);
        vi.mocked(apiPost).mockRejectedValueOnce(Error("rejected"));
        await expect(
            createTask({ ...config, model: "failed-model" }),
        ).rejects.toThrow("rejected");
        expect(
            node(useFlow.getState().addNode({ type: "textGenImageNode" })).data
                .pluginModel,
        ).toBe("custom/image");
    });
});
