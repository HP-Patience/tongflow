/** Preserve explicit custom IDs; catalog refreshes must not reset them. */
export function resolvePluginModel(
    current: string,
    models: string[],
    allowCustom: boolean,
    modelsLoaded = true,
): string {
    const value = current.trim();
    return value && (!modelsLoaded || allowCustom || models.includes(value))
        ? value
        : (models[0] ?? "");
}
