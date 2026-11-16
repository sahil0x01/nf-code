import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@nullfuse/sandbox";

export function createWriteFileTool(sandbox: Sandbox) {
  return tool({
    description:
      "Create a new file, or completely overwrite an existing one. " +
      "To change part of an existing file, use edit_file instead.",
    inputSchema: z.object({
      path: z.string().describe("File path, relative to the project root"),
      content: z.string().describe("The full content of the file"),
    }),
    execute: async ({ path, content }) => {
      try {
        await sandbox.writeFile(path, content);
        return `Wrote ${content.split("\n").length} lines to ${path}`;
      } catch (error) {
        return `Error: could not write ${path}: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}
