import path from "node:path";
import { parseArgs } from "node:util";
import { runAgent } from "@nullfuse/agent";
import { createModel, estimateCost } from "@nullfuse/models";
import { LocalSandbox } from "@nullfuse/sandbox";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: "string" },
    "max-steps": { type: "string" },
  },
});

const [folder, task] = positionals;
if (!folder || !task) {
  console.error(
    'Usage: pnpm agent <folder> "<task>" [--model id] [--max-steps n]',
  );
  process.exit(1);
}

const modelId = values.model ?? "deepseek-flash";
const maxSteps = Number(values["max-steps"] ?? 40);
// pnpm runs scripts inside apps/cli, so resolve the folder from where you typed the command.
const root = path.resolve(process.env.INIT_CWD ?? process.cwd(), folder);

console.log(`Folder: ${root}`);
console.log(`Model:  ${modelId}\n`);

function preview(value: unknown, max = 300): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

const result = await runAgent({
  model: createModel(modelId),
  sandbox: new LocalSandbox(root),
  task,
  maxSteps,
  onEvent: (event) => {
    if (event.type === "text") {
      console.log(`\n${event.text}`);
    } else {
      console.log(`\n▸ ${event.name} ${preview(event.input, 200)}`);
      console.log(`  ${preview(event.output).replaceAll("\n", "\n  ")}`);
    }
  },
});

const cost = estimateCost(modelId, result.tokens);
console.log("\n─────────────");
console.log(
  result.summary
    ? `Done: ${result.summary}`
    : "Stopped without calling finish (hit the step limit?)",
);
console.log(`Steps: ${result.steps}`);
console.log(
  `Tokens: ${result.tokens.cacheHitTokens} cached in, ${result.tokens.cacheMissTokens} new in, ${result.tokens.outputTokens} out`,
);
console.log(
  `Cost: ${cost === undefined ? "unknown model" : `$${cost.toFixed(5)}`}`,
);
