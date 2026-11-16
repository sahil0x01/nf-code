import {
  ToolLoopAgent,
  hasToolCall,
  isStepCount,
  type LanguageModel,
} from "ai";
import type { Sandbox } from "@nullfuse/sandbox";
import { SYSTEM_PROMPT } from "./prompt.js";
import { createBashTool } from "./tools/bash.js";
import { createEditFileTool } from "./tools/edit-file.js";
import { createFinishTool } from "./tools/finish.js";
import { createGrepTool } from "./tools/grep.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createReadFileTool } from "./tools/read-file.js";
import { createWriteFileTool } from "./tools/write-file.js";

export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown; output: unknown };

export interface TokenTotals {
  cacheHitTokens: number;
  cacheMissTokens: number;
  outputTokens: number;
}

export interface RunOptions {
  model: LanguageModel;
  sandbox: Sandbox;
  task: string;
  maxSteps?: number;
  onEvent?: (event: AgentEvent) => void;
}

export interface RunResult {
  summary: string | undefined; // undefined means the agent never called finish
  steps: number;
  tokens: TokenTotals;
}

export async function runAgent(options: RunOptions): Promise<RunResult> {
  const { model, sandbox, task, maxSteps = 40, onEvent = () => {} } = options;

  const tokens: TokenTotals = {
    cacheHitTokens: 0,
    cacheMissTokens: 0,
    outputTokens: 0,
  };
  let summary: string | undefined;
  let steps = 0;

  const agent = new ToolLoopAgent({
    model,
    instructions: SYSTEM_PROMPT,
    tools: {
      read_file: createReadFileTool(sandbox),
      write_file: createWriteFileTool(sandbox),
      edit_file: createEditFileTool(sandbox),
      bash: createBashTool(sandbox),
      list_files: createListFilesTool(sandbox),
      grep: createGrepTool(sandbox),
      finish: createFinishTool(),
    },
    stopWhen: [isStepCount(maxSteps), hasToolCall("finish")],
    onStepEnd: (step) => {
      steps += 1;

      if (step.text) onEvent({ type: "text", text: step.text });

      for (const call of step.toolCalls) {
        if (call.toolName === "finish") {
          const input = call.input as { summary?: unknown };
          if (typeof input.summary === "string") summary = input.summary;
        }
        const result = step.toolResults.find(
          (r) => r.toolCallId === call.toolCallId,
        );
        onEvent({
          type: "tool",
          name: call.toolName,
          input: call.input,
          output: result?.output,
        });
      }

      const details = step.usage.inputTokenDetails;
      const hit = details?.cacheReadTokens ?? 0;
      const input = step.usage.inputTokens ?? 0;
      tokens.cacheHitTokens += hit;
      tokens.cacheMissTokens += details?.noCacheTokens ?? input - hit;
      tokens.outputTokens += step.usage.outputTokens ?? 0;
    },
  });

  await agent.generate({ prompt: task });
  return { summary, steps, tokens };
}
