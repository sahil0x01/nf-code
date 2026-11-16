import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@nullfuse/sandbox";
import { truncateOutput } from "./util.js";

export function createBashTool(sandbox: Sandbox) {
  return tool({
    description:
      "Run a shell command in the project root: install dependencies, build, run tests, use git. " +
      "Each call starts a fresh shell, so `cd` does not carry over between calls. " +
      "Returns the exit code, stdout and stderr.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to run"),
      timeoutSeconds: z
        .number()
        .int()
        .min(1)
        .max(600)
        .optional()
        .describe("Time limit in seconds (default 120)"),
    }),
    execute: async ({ command, timeoutSeconds }) => {
      const result = await sandbox.exec(command, {
        timeoutMs: (timeoutSeconds ?? 120) * 1000,
      });
      const parts = [`exit code: ${result.exitCode}`];
      if (result.stdout) parts.push(`stdout:\n${result.stdout}`);
      if (result.stderr) parts.push(`stderr:\n${result.stderr}`);
      return truncateOutput(parts.join("\n"));
    },
  });
}
