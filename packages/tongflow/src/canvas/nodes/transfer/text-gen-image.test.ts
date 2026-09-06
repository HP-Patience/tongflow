import { describe, expect, it } from "vitest";
import type { AspectRatio, ResolutionTier } from "../../../core";
import { imageSizeForSelection } from "./text-gen-image";

const tier: ResolutionTier = { value: "1k", label: "1K", scale: 1 };

describe("imageSizeForSelection", () => {
    it("clears width and height for Auto", () => {
        const auto: AspectRatio = {
            value: "auto",
            label: "auto",
            width: 0,
            height: 0,
        };

        expect(imageSizeForSelection(auto, tier)).toEqual({
            width: undefined,
            height: undefined,
        });
    });

    it("clears width and height when resolution is Auto", () => {
        const square: AspectRatio = {
            value: "1:1",
            label: "square",
            width: 1024,
            height: 1024,
        };

        expect(
            imageSizeForSelection(square, {
                value: "auto",
                label: "Auto",
                scale: 0,
            }),
        ).toEqual({ width: undefined, height: undefined });
    });

    it("calculates explicit dimensions for a ratio and tier", () => {
        const landscape: AspectRatio = {
            value: "16:9",
            label: "landscape",
            width: 1280,
            height: 720,
        };

        expect(imageSizeForSelection(landscape, { ...tier, scale: 2 })).toEqual(
            {
                width: 2560,
                height: 1440,
            },
        );
    });
});
