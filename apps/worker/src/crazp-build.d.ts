declare module "crazp/build" {
  export function buildFilesystemAgent(input: {
    files: Array<{ path: string; content: string }>;
  }): Promise<{
    files: Array<{
      path: string;
      content: string;
      contentType?: string;
    }>;
    workerScript: string;
    wranglerConfig?: Record<string, unknown>;
  }>;
}
