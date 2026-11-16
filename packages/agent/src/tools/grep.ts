import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@nullfuse/sandbox";
import { shellQuote, truncateOutput } from "./util.js";

export function createGrepTool(sandbox: Sandbox) {
  return tool({
    description:
      "Search file contents with a regular expression. Returns matching lines as path:line:text. " +
      "Respects .gitignore.",
    inputSchema: z.object({
      pattern: z.string().describe("Regular expression to search for"),
      directory: z
        .string()
        .optional()
        .describe("Directory to search (default: project root)"),
      glob: z
        .string()
        .optional()
        .describe("Only search files matching this glob, e.g. '*.ts'"),
    }),
    execute: async ({ pattern, directory, glob }) => {
      const parts = [
        "rg --line-number --no-heading --no-require-git --max-count 20",
      ];
      if (glob) parts.push(`--glob ${shellQuote(glob)}`);
      parts.push("-e", shellQuote(pattern), "--", shellQuote(directory ?? "."));
      const result = await sandbox.exec(parts.join(" "));
      if (result.exitCode === 1) return "No matches.";
      if (result.exitCode !== 0)
        return `Error: ${result.stderr || "search failed"}`;
      return truncateOutput(result.stdout);
    },
  });
}
