import { createDeepSeek } from "@ai-sdk/deepseek";

export function createModel(modelId: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Copy .env.example to .env and fill it in.",
    );
  }
  return createDeepSeek({ apiKey })(modelId);
}

export { PRICES, estimateCost } from "./pricing.js";
export type { ModelPrice, TokenCounts } from "./pricing.js";
