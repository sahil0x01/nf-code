export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface Sandbox {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exec(command: string, options?: { timeoutMs?: number }): Promise<ExecResult>;
}
