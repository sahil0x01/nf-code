import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@nullfuse/sandbox";
import { shellQuote, truncateOutput } from "./util.js";

export function createListFilesTool(sandbox: Sandbox) {
  return tool({
    description:
      "List files in the project, one path per line. Respects .gitignore. " +
      "Optionally limit to a directory or a glob such as '*.ts'.",
    inputSchema: z.object({
      directory: z
        .string()
        .optional()
        .describe("Directory to list (default: project root)"),
      glob: z
        .string()
        .optional()
        .describe("Only files matching this glob, e.g. '*.ts'"),
    }),
    execute: async ({ directory, glob }) => {
      const parts = ["rg --files --no-require-git"];
      if (glob) parts.push(`--glob ${shellQuote(glob)}`);
      parts.push("--", shellQuote(directory ?? "."));
      const result = await sandbox.exec(parts.join(" "));
      if (!result.stdout) return result.stderr || "No files found.";
      return truncateOutput(result.stdout);
    },
  });
}
