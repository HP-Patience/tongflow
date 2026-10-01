import { describe, expect, it } from "vitest";
import { providerConnectConfig } from "./connect-configs";

describe("xAI gateway API keys", () => {
    const config = providerConnectConfig("xAI (Grok)", "XAI_API_KEY");
    const pattern = config.specs[0].pattern!;

    it("recognizes both official and gateway keys without changing the value", () => {
        for (const key of [
            "xai-official-example123",
            "sk-gateway-example123",
        ]) {
            expect(`XAI_API_KEY="${key}"`.match(pattern)?.[0]).toBe(key);
        }
    });

    it("does not accept an unfinished prefix", () => {
        expect("xai-".match(pattern)).toBeNull();
        expect("sk-".match(pattern)).toBeNull();
    });
});
