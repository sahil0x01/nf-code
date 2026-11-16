// USD per 1 million tokens. Source: api-docs.deepseek.com/quick_start/pricing
// These are PEAK prices (the higher ones), so our cost estimate is never too low.
export interface ModelPrice {
  inputCacheHit: number;
  inputCacheMiss: number;
  output: number;
}

export const PRICES: Record<string, ModelPrice> = {
  "deepseek-flash": { inputCacheHit: 0.006, inputCacheMiss: 0.3, output: 1.2 },
  "deepseek-v4-pro": {
    inputCacheHit: 0.044,
    inputCacheMiss: 1.32,
    output: 3.96,
  },
};

export interface TokenCounts {
  cacheHitTokens: number;
  cacheMissTokens: number;
  outputTokens: number;
}

export function estimateCost(
  modelId: string,
  tokens: TokenCounts,
): number | undefined {
  const price = PRICES[modelId];
  if (!price) return undefined;
  return (
    (tokens.cacheHitTokens * price.inputCacheHit +
      tokens.cacheMissTokens * price.inputCacheMiss +
      tokens.outputTokens * price.output) /
    1_000_000
  );
}
