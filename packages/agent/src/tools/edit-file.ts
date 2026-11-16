import { tool } from "ai";
import { z } from "zod";
import type { Sandbox } from "@nullfuse/sandbox";

export function createEditFileTool(sandbox: Sandbox) {
  return tool({
    description:
      "Edit a file by replacing one exact snippet of text with new text. " +
      "oldString must match the file exactly (including whitespace) and must appear exactly once; " +
      "include a few surrounding lines to make it unique.",
    inputSchema: z.object({
      path: z.string().describe("File path, relative to the project root"),
      oldString: z.string().min(1).describe("The exact text to replace"),
      newString: z.string().describe("The text to put in its place"),
    }),
    execute: async ({ path, oldString, newString }) => {
      let content: string;
      try {
        content = await sandbox.readFile(path);
      } catch (error) {
        return `Error: could not read ${path}: ${error instanceof Error ? error.message : String(error)}`;
      }

      const first = content.indexOf(oldString);
      if (first === -1) {
        return `Error: oldString was not found in ${path}. Read the file again and copy the text exactly.`;
      }
      if (content.indexOf(oldString, first + 1) !== -1) {
        return `Error: oldString appears more than once in ${path}. Include more surrounding lines so it matches exactly one place.`;
      }

      const updated =
        content.slice(0, first) +
        newString +
        content.slice(first + oldString.length);
      await sandbox.writeFile(path, updated);
      return `Edited ${path}`;
    },
  });
}
