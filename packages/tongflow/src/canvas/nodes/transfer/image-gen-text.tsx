import type { Edge } from "@xyflow/react";
import { useNodeId, useStore } from "@xyflow/react";
import { Image as ImageIcon, MessageSquare } from "lucide-react";
import { memo, useMemo } from "react";
import { useTranslations } from "use-intl";
import {
    collectHandleValues,
    type TongflowPluginNodeProps,
} from "../../../core";
import { useAbiForm } from "../../hooks/use-abi-form";
import { useNodeAbiSpec } from "../../hooks/use-node-abi-spec";

import { AbiNodeShell } from "../base/abi-node-shell";
import { NodeTextarea } from "../base/node-textarea";

export const DEFAULT_IMAGE_REVERSE_PROMPT =
    "用中文反推描述";

export function applyDefaultImageReversePrompt(
    prompts: Record<string, unknown>[],
): Record<string, unknown>[] {
    return prompts.map((prompt) => ({
        ...prompt,
        text:
            typeof prompt.text === "string" && prompt.text.trim()
                ? prompt.text
                : DEFAULT_IMAGE_REVERSE_PROMPT,
    }));
}

const ImageGenTextNode = ({
    selected,
    data,
}: TongflowPluginNodeProps<"image-gen-text", "imageGenTextNode">) => {
    const t = useTranslations("Workspace.nodes");
    const form = useAbiForm("image-gen-text");
    const nodeId = useNodeId();
    const nodeLookup = useStore((state) => state.nodeLookup);
    const edges = useStore((state) => state.edges as Edge[]);
    const resolvedSpec = useNodeAbiSpec("image-gen-text");
    const hasImage = useMemo(() => {
        if (!nodeId) return false;
        const values = collectHandleValues(
            nodeId,
            resolvedSpec,
            Array.from(nodeLookup.values()),
            edges,
        );
        return Boolean(values.image);
    }, [nodeId, resolvedSpec, nodeLookup, edges]);

    return (
        <AbiNodeShell
            feature="image-gen-text"
            form={form}
            selected={selected}
            className="min-w-[480px]"
            data={data}
            title={t("titles.imageGenText")}
            icon={<ImageIcon className="h-5 w-5" />}
            executeLabel={t("actions.describeImage")}
            executeDisabled={!hasImage}
            transformPrompts={applyDefaultImageReversePrompt}
        >
            <div className="p-4 space-y-4">
                <NodeTextarea
                    label={t("imageGenText.promptLabel")}
                    icon={MessageSquare}
                    placeholder={t("imageGenText.promptPlaceholder")}
                    {...form.bind("text")}
                    rows={3}
                />
            </div>
        </AbiNodeShell>
    );
};

ImageGenTextNode.displayName = "ImageGenTextNode";

export default memo(ImageGenTextNode);
