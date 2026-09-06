import { describe, expect, it } from "vitest";
import {
    applyDefaultImageReversePrompt,
    DEFAULT_IMAGE_REVERSE_PROMPT,
} from "./image-gen-text";

describe("applyDefaultImageReversePrompt", () => {
    it("uses the default prompt when the custom prompt is blank", () => {
        expect(
            applyDefaultImageReversePrompt([{ text: "", image: "a.png" }]),
        ).toEqual([{ text: DEFAULT_IMAGE_REVERSE_PROMPT, image: "a.png" }]);
        expect(DEFAULT_IMAGE_REVERSE_PROMPT).toBe("用中文反推描述");
    });

    it("preserves a custom prompt", () => {
        expect(
            applyDefaultImageReversePrompt([
                { text: "Only describe the subject", image: "a.png" },
            ]),
        ).toEqual([{ text: "Only describe the subject", image: "a.png" }]);
    });
});
