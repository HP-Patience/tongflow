import { describe, expect, it } from "vitest";
import { clampVideoDuration, VIDEO_DURATION_MAX } from "./media-options";

const grok = "grok-imagine-video-1.5";

describe("model-aware video duration", () => {
    it("caps Grok at 15 seconds and preserves valid durations", () => {
        expect(clampVideoDuration(VIDEO_DURATION_MAX, grok)).toBe(15);
        expect(clampVideoDuration(20, grok)).toBe(15);
        expect(clampVideoDuration(5, grok)).toBe(5);
        expect(clampVideoDuration(0, grok)).toBe(1);
        expect(clampVideoDuration(14.6, grok)).toBe(15);
    });

    it("keeps the existing range for other models", () => {
        for (const model of [undefined, "sora-2-vvip", "veo3.1-fast"]) {
            expect(clampVideoDuration(30, model)).toBe(30);
            expect(clampVideoDuration(60, model)).toBe(30);
            expect(clampVideoDuration(0, model)).toBe(1);
            expect(clampVideoDuration(5.4, model)).toBe(5);
        }
    });

    it("clamps an existing long value when switching to Grok", () => {
        const previous = clampVideoDuration(30, "sora-2-vvip");
        expect(clampVideoDuration(previous, grok)).toBe(15);
        expect(clampVideoDuration(VIDEO_DURATION_MAX, "sora-2-vvip")).toBe(30);
    });
});
