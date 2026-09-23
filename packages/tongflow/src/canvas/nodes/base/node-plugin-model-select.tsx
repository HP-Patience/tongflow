"use client";

import { useNodeId } from "@xyflow/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";
import type { BaseNodeData } from "../../../core";
import useFlow from "../../hooks/use-flow";
import {
    loadPluginModelCatalog,
    useLiveModelsStore,
    useNodePluginModels,
    usePluginsRegistryStore,
} from "../../hooks/use-plugins-registry";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { useResolvedPluginId } from "./node-plugin-id-select";
import { NodePluginSelect } from "./node-plugin-select";
import { resolvePluginModel } from "./plugin-model-selection";

type NodePluginModelSelectProps = {
    nodeSlot: string;
    data: BaseNodeData;
};

/**
 * Model selector for router-style plugins that declare per-slot model lists
 * (`TONGFLOW_SLOT_MODELS`, optionally extended live via
 * `TONGFLOW_MODEL_CATALOG` — re-checked each time the dropdown opens). Renders
 * nothing when the active plugin declares no models, so single-model plugins
 * are visually unchanged. The selection is stored as `data.pluginModel` and
 * travels top-level (like `pluginId`) through the create-task API and workflow
 * export.
 */
export function NodePluginModelSelect({
    nodeSlot,
    data,
}: NodePluginModelSelectProps) {
    const id = useNodeId()!;
    const updates = useFlow((s) => s.updates);
    const t = useTranslations("Workspace.nodes.base");

    const { resolved: pluginId } = useResolvedPluginId(nodeSlot, data);
    const models = useNodePluginModels(nodeSlot, pluginId);
    const hasCatalog = usePluginsRegistryStore((state) =>
        Boolean(state.registry?.plugins?.[pluginId]?.modelCatalog),
    );
    const registryLoaded = usePluginsRegistryStore((state) => state.isLoaded);
    const catalogLoaded = useLiveModelsStore((state) =>
        Boolean(state.byPlugin[pluginId]),
    );
    const modelsLoaded = registryLoaded && (!hasCatalog || catalogLoaded);
    const [refreshing, setRefreshing] = useState(false);
    const [editingCustom, setEditingCustom] = useState(false);
    const [customModel, setCustomModel] = useState("");
    const allowCustom = pluginId === "tongflow-api-openai-compatible";

    useEffect(() => {
        setEditingCustom(false);
        setCustomModel("");
    }, [pluginId]);

    const current = String(data.pluginModel ?? "").trim();
    const resolved = resolvePluginModel(
        current,
        models,
        allowCustom,
        modelsLoaded,
    );

    // Persist the default (or replace a stale model after a plugin switch)
    // after paint, mirroring the pluginId default write in
    // useNodePluginResolver.
    useEffect(() => {
        if (!modelsLoaded || resolved === current) return;
        // Programmatic normalization — must not create (or invalidate) undo
        // history, or it re-fires after every undo and breaks the chain.
        updates(id, { ...data, pluginModel: resolved }, { history: false });
    }, [id, data, current, resolved, updates, modelsLoaded]);

    const options = useMemo(() => {
        const choices =
            resolved && !models.includes(resolved)
                ? [resolved, ...models]
                : models;
        return choices.map((m) => ({ value: m, label: m }));
    }, [models, resolved]);

    if (options.length === 0 && !allowCustom) return null;

    const saveCustomModel = () => {
        const value = customModel.trim();
        if (!value) return;
        updates(id, { ...data, pluginModel: value });
        setEditingCustom(false);
    };

    const refreshModels = async () => {
        setRefreshing(true);
        try {
            const count = await loadPluginModelCatalog(pluginId, {
                force: true,
                throwOnError: true,
            });
            toast.success(t("pluginModelsLoaded", { count }));
        } catch (error) {
            toast.error(
                t("pluginModelsLoadError", {
                    message:
                        error instanceof Error ? error.message : String(error),
                }),
            );
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <NodePluginSelect
            value={resolved}
            onValueChange={(value) =>
                updates(id, { ...data, pluginModel: value })
            }
            options={options}
            title={t("pluginModelTitle")}
            titleAction={
                hasCatalog ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={refreshing}
                                aria-label={t("refreshPluginModels")}
                                onClick={() => void refreshModels()}
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {t("refreshPluginModels")}
                        </TooltipContent>
                    </Tooltip>
                ) : undefined
            }
            onOpenChange={(open) => {
                if (open) void loadPluginModelCatalog(pluginId);
            }}
        >
            {allowCustom && (
                <div className="nodrag nopan space-y-2">
                    {editingCustom ? (
                        <>
                            <Input
                                autoFocus
                                value={customModel}
                                aria-label={t("customPluginModel")}
                                placeholder={t("customPluginModelPlaceholder")}
                                onChange={(event) =>
                                    setCustomModel(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    event.stopPropagation();
                                    if (
                                        event.key === "Enter" &&
                                        !event.nativeEvent.isComposing
                                    ) {
                                        event.preventDefault();
                                        saveCustomModel();
                                    } else if (event.key === "Escape") {
                                        setEditingCustom(false);
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!customModel.trim()}
                                    onClick={saveCustomModel}
                                >
                                    {t("applyCustomPluginModel")}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingCustom(false)}
                                >
                                    {t("cancelCustomPluginModel")}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-0 text-xs"
                            onClick={() => {
                                setCustomModel(resolved);
                                setEditingCustom(true);
                            }}
                        >
                            {t("customPluginModel")}
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground leading-snug">
                        {t("customPluginModelHint")}
                    </p>
                </div>
            )}
        </NodePluginSelect>
    );
}
