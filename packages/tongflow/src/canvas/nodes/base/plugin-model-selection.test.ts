import { describe, expect, it } from "vitest";
import { resolvePluginModel } from "./plugin-model-selection";

describe("resolvePluginModel", () => {
    const models = ["default-image", "other-image"];
    it("uses the first model only when no selection is saved", () => {
        expect(resolvePluginModel("", models, true)).toBe("default-image");
    });
    it("retains a selection from the dropdown", () => {
        expect(resolvePluginModel("other-image", models, false)).toBe(
            "other-image",
        );
    });
    it("preserves custom IDs outside the catalog", () => {
        expect(resolvePluginModel("provider/custom-image", models, true)).toBe(
            "provider/custom-image",
        );
    });
    it("preserves saved custom IDs while loading or after a catalog refresh", () => {
        expect(resolvePluginModel("custom-image", [], true)).toBe(
            "custom-image",
        );
        expect(resolvePluginModel("custom-image", ["new-default"], true)).toBe(
            "custom-image",
        );
    });
    it("trims custom IDs and uses the default for whitespace", () => {
        expect(resolvePluginModel(" custom-image ", models, true)).toBe(
            "custom-image",
        );
        expect(resolvePluginModel("   ", models, true)).toBe("default-image");
    });
    it("retains the fallback for plugins without custom model support", () => {
        expect(resolvePluginModel("custom-image", models, false)).toBe(
            "default-image",
        );
        expect(resolvePluginModel("custom-image", [], false)).toBe("");
    });
});
