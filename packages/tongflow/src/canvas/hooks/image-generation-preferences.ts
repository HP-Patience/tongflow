const IMAGE_FEATURES = new Set(["image-gen", "image-edit", "image-fusion"]);
const keyFor = (feature: string) => `tongflow:last-image-selection:${feature}`;

type ImageSelection = { pluginId: string; pluginModel?: string };

/** Remember accepted image tasks, not incidental dropdown/default changes. */
export function rememberImageSelection(config: {
    feature: string;
    pluginId: string;
    model?: string;
}): void {
    if (!IMAGE_FEATURES.has(config.feature) || !config.pluginId.trim()) return;
    try {
        localStorage.setItem(
            keyFor(config.feature),
            JSON.stringify({
                pluginId: config.pluginId.trim(),
                pluginModel: config.model?.trim() || undefined,
            }),
        );
    } catch {
        // Storage can be disabled or full; this must never fail a generation.
    }
}

export function readImageSelection(
    feature: string | undefined,
    availablePlugins?: string[],
): ImageSelection | undefined {
    if (!feature || !IMAGE_FEATURES.has(feature)) return;
    try {
        const saved: unknown = JSON.parse(
            localStorage.getItem(keyFor(feature)) ?? "null",
        );
        if (
            !saved ||
            typeof saved !== "object" ||
            !("pluginId" in saved) ||
            typeof saved.pluginId !== "string" ||
            !saved.pluginId.trim()
        )
            return;
        const pluginId = saved.pluginId.trim();
        if (availablePlugins && !availablePlugins.includes(pluginId)) return;
        if ("pluginModel" in saved && typeof saved.pluginModel !== "string")
            return;
        return {
            pluginId,
            ...("pluginModel" in saved &&
            typeof saved.pluginModel === "string" &&
            saved.pluginModel.trim()
                ? { pluginModel: saved.pluginModel.trim() }
                : {}),
        };
    } catch {
        return undefined;
    }
}
