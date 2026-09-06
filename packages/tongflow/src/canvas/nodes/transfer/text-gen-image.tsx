import { useNodeId } from "@xyflow/react";
import { Atom } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useTranslations } from "use-intl";
import type { TongflowPluginNodeProps } from "../../../core";
import {
    type AspectRatio,
    IMAGE_ASPECT_RATIOS,
    IMAGE_RESOLUTION_TIERS,
    type ResolutionTier,
} from "../../../core";
import { useAbiForm } from "../../hooks/use-abi-form";
import useFlow from "../../hooks/use-flow";
import { AbiNodeShell } from "../base/abi-node-shell";
import { AspectRatioPicker } from "../base/aspect-ratio-picker";
import { ResolutionPicker } from "../base/resolution-picker";

type TextGenImageNodeProps = TongflowPluginNodeProps<
    "image-gen",
    "textGenImageNode"
>;

const AUTO_RATIO: AspectRatio = {
    value: "auto",
    label: "auto",
    width: 0,
    height: 0,
};
const IMAGE_RATIO_OPTIONS = [AUTO_RATIO, ...IMAGE_ASPECT_RATIOS];
const AUTO_TIER: ResolutionTier = {
    value: "auto",
    label: "Auto",
    scale: 0,
};
const IMAGE_RESOLUTION_OPTIONS = [AUTO_TIER, ...IMAGE_RESOLUTION_TIERS];

// Explicit sizes start from 1:1 at the 1K tier. New nodes default to Auto.
const DEFAULT_RATIO =
    IMAGE_ASPECT_RATIOS.find((r) => r.value === "1:1") ??
    IMAGE_ASPECT_RATIOS[0];
const DEFAULT_TIER = IMAGE_RESOLUTION_TIERS[0];

export function imageSizeForSelection(
    ratio: AspectRatio,
    tier: ResolutionTier,
): { width: number | undefined; height: number | undefined } {
    if (ratio.value === "auto" || tier.value === "auto") {
        return { width: undefined, height: undefined };
    }
    return {
        width: ratio.width * tier.scale,
        height: ratio.height * tier.scale,
    };
}

const TextGenImageNode = ({ selected, data }: TextGenImageNodeProps) => {
    const t = useTranslations("Workspace.nodes");
    const { texts = [] } = data;
    const form = useAbiForm("image-gen");
    const nodeId = useNodeId();
    const updateNode = useFlow((state) => state.updates);

    const storedWidth = form.state.width as number | undefined;
    const storedHeight = form.state.height as number | undefined;
    const hasStoredSize =
        storedWidth !== undefined && storedHeight !== undefined;
    const width = storedWidth ?? DEFAULT_RATIO.width;
    const height = storedHeight ?? DEFAULT_RATIO.height;

    // ABI stores only width/height. Recover the (aspect ratio, tier) pair from
    // the persisted size: width/height = ratio base dims × tier scale.
    const { ratio: currentRatio, tier: currentTier } = useMemo(() => {
        for (const tier of IMAGE_RESOLUTION_TIERS) {
            const ratio = IMAGE_ASPECT_RATIOS.find(
                (r) =>
                    r.width * tier.scale === width &&
                    r.height * tier.scale === height,
            );
            if (ratio) return { ratio, tier };
        }
        return { ratio: DEFAULT_RATIO, tier: DEFAULT_TIER };
    }, [width, height]);

    const savedRatioValue = (
        data.selectedAspectRatio as AspectRatio | undefined
    )?.value;
    const savedTierValue = (
        data.selectedResolution as ResolutionTier | undefined
    )?.value;
    const selectedRatio =
        IMAGE_RATIO_OPTIONS.find((ratio) => ratio.value === savedRatioValue) ??
        (hasStoredSize ? currentRatio : AUTO_RATIO);
    const selectedTier =
        IMAGE_RESOLUTION_OPTIONS.find(
            (tier) => tier.value === savedTierValue,
        ) ?? (hasStoredSize ? currentTier : AUTO_TIER);
    const selectedSize = imageSizeForSelection(selectedRatio, selectedTier);

    const applySize = useCallback(
        (ratio: AspectRatio, tier: ResolutionTier) => {
            if (!nodeId) return;
            const size = imageSizeForSelection(ratio, tier);
            updateNode(nodeId, {
                ...data,
                selectedAspectRatio: ratio,
                selectedResolution: tier,
                ...size,
            });
        },
        [data, nodeId, updateNode],
    );

    const handleSelectRatio = useCallback(
        (ratio: AspectRatio) => applySize(ratio, selectedTier),
        [applySize, selectedTier],
    );
    const handleSelectTier = useCallback(
        (tier: ResolutionTier) => applySize(selectedRatio, tier),
        [applySize, selectedRatio],
    );

    return (
        <AbiNodeShell
            feature="image-gen"
            form={form}
            selected={selected}
            className="min-w-[480px]"
            data={data}
            title={t("titles.textGenImage")}
            icon={<Atom className="h-5 w-5" />}
            executeLabel={t("actions.generateImage")}
            executeDisabled={!texts?.length}
        >
            <div className="p-4 space-y-4">
                <AspectRatioPicker
                    ratios={IMAGE_RATIO_OPTIONS}
                    value={{
                        ...selectedRatio,
                        width: selectedSize.width ?? 0,
                        height: selectedSize.height ?? 0,
                    }}
                    onChange={handleSelectRatio}
                    showSize
                    sizeLabel={
                        selectedRatio.value === "auto" ||
                        selectedTier.value === "auto"
                            ? t("options.auto")
                            : undefined
                    }
                />
                <ResolutionPicker
                    tiers={IMAGE_RESOLUTION_OPTIONS}
                    value={selectedTier.value}
                    onChange={handleSelectTier}
                />
            </div>
        </AbiNodeShell>
    );
};

TextGenImageNode.displayName = "TextGenImageNode";

export default memo(TextGenImageNode);
