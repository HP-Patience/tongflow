import { useNodeId, useStore } from "@xyflow/react";
import { Clock } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "use-intl";
import {
    clampVideoDuration,
    VIDEO_DURATION_MAX,
    VIDEO_DURATION_MIN,
} from "../../../core";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";
import { Slider } from "../../ui/slider";

export interface VideoDurationSliderProps {
    value: number;
    onChange: (duration: number) => void;
}

export function VideoDurationSlider({
    value,
    onChange,
}: VideoDurationSliderProps) {
    const t = useTranslations("Workspace.nodes");
    const nodeId = useNodeId();
    const model = useStore((state) => {
        const selected = state.nodeLookup.get(nodeId ?? "")?.data.pluginModel;
        return typeof selected === "string" ? selected : undefined;
    });
    const max = clampVideoDuration(VIDEO_DURATION_MAX, model);
    const clamped = clampVideoDuration(value, model);

    useEffect(() => {
        if (clamped !== value) onChange(clamped);
    }, [clamped, value, onChange]);

    return (
        <Card className="p-3">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {t("common.duration")}
                    </Label>
                    <span className="text-xs font-medium">{clamped}s</span>
                </div>
                <Slider
                    value={[clamped]}
                    onValueChange={([v]) =>
                        onChange(clampVideoDuration(v, model))
                    }
                    min={VIDEO_DURATION_MIN}
                    max={max}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{VIDEO_DURATION_MIN}s</span>
                    <span>{max}s</span>
                </div>
            </div>
        </Card>
    );
}
