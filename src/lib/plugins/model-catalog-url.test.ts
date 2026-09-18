import { PluginModelCatalogSchema } from "tongflow";
import { describe, expect, it } from "vitest";
import { resolveModelCatalogUrl } from "./model-catalog-url";

describe("resolveModelCatalogUrl", () => {
    it("keeps a fixed catalog URL", () => {
        const catalog = PluginModelCatalogSchema.parse({
            url: "https://example.test/models",
            slots: { "gen-text": {} },
        });
        expect(resolveModelCatalogUrl(catalog, {})).toBe(
            "https://example.test/models",
        );
    });

    it("builds a catalog URL from a stored endpoint", () => {
        const catalog = PluginModelCatalogSchema.parse({
            urlEnv: "COMPATIBLE_BASE_URL",
            path: "/models",
            slots: { "gen-text": {} },
        });
        expect(
            resolveModelCatalogUrl(catalog, {
                COMPATIBLE_BASE_URL: "https://example.test/v1/",
            }),
        ).toBe("https://example.test/v1/models");
    });
});
