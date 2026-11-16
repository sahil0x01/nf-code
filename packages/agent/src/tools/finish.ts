import { tool } from "ai";
import { z } from "zod";

export function createFinishTool() {
  return tool({
    description:
      "Call this once the task is complete and verified, or when you cannot continue. " +
      "This ends the run.",
    inputSchema: z.object({
      summary: z
        .string()
        .describe(
          "What you changed, how you verified it, and anything left undone",
        ),
    }),
    execute: async ({ summary }) => summary,
  });
}
