import { tool } from "ai";
import z from "zod";
import type { Sandbox } from "@nullfuse/sandbox";

const MAX_LINES = 2000;

export function createReadFileTool(sandbox: Sandbox) {
  return tool({
    description:
      "Read a text file. Returns the content with line numbers. " +
      "For large files, pass startLine and endLine to read just a section.",
    inputSchema: z.object({
      path: z.string().describe("File path, relative to the project root"),
      startLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("First line to read (1-based)"),
      endLine: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Last line to read (inclusive)"),
    }),
    execute: async ({ path, startLine, endLine }) => {
      let content: string;
      try {
        content = await sandbox.readFile(path);
      } catch (error) {
        return `Error: could not read ${path}: ${error instanceof Error ? error.message : String(error)}`;
      }

      const lines = content.split("\n");
      const from = startLine ?? 1;
      const to = Math.min(
        endLine ?? lines.length,
        from + MAX_LINES - 1,
        lines.length,
      );

      const numbered = lines
        .slice(from - 1, to)
        .map((line, i) => `${String(from + i).padStart(5)}  ${line}`)
        .join("\n");

      const truncated =
        to < (endLine ?? lines.length)
          ? `\n[Output cut at line ${to} of ${lines.length}. Use startLine/endLine to read more.]`
          : "";

      return numbered + truncated;
    },
  });
}
