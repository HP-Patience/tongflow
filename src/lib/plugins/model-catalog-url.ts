import type { PluginModelCatalog } from "tongflow";

export function resolveModelCatalogUrl(
    catalog: PluginModelCatalog,
    env: Record<string, string | undefined>,
): string {
    if (catalog.url) return catalog.url;

    const key = catalog.urlEnv;
    const base = key ? (env[key] ?? "").trim() : "";
    if (!key || !base) {
        throw new Error(`${key || "Model catalog URL"} is not set`);
    }
    const url = new URL(base);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error(`${key} must be an http(s) URL`);
    }
    return `${url.toString().replace(/\/$/, "")}${catalog.path ?? ""}`;
}
