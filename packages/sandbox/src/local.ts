import { exec } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ExecResult, Sandbox } from "./types.js";

const execAsync = promisify(exec);

export class LocalSandbox implements Sandbox {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(relativePath: string): string {
    const full = path.resolve(this.root, relativePath);
    if (full !== this.root && !full.startsWith(this.root + path.sep)) {
      throw new Error(`Path escapes the sandbox root: ${relativePath}`);
    }
    return full;
  }

  async readFile(relativePath: string): Promise<string> {
    return readFile(this.resolve(relativePath), "utf-8");
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const full = this.resolve(relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }
  async exec(
    command: string,
    options: { timeoutMs?: number } = {},
  ): Promise<ExecResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.root,
        timeout: options.timeoutMs ?? 120_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { exitCode: 0, stdout, stderr };
    } catch (error) {
      const e = error as { code?: number; stdout?: string; stderr?: string };
      return {
        exitCode: typeof e.code === "number" ? e.code : 1,
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? String(error),
      };
    }
  }
}
