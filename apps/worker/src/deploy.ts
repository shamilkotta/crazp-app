import { getSandbox } from "./sandbox";

export type DeployCrazpInput = {
  deploymentId: string;
  workerName: string;
  dispatchNamespace: string;
};

export type DeployCrazpResult = {
  stdout: string;
  stderr: string;
};

export async function deployCrazp(
  env: CloudflareEnv,
  input: DeployCrazpInput
): Promise<DeployCrazpResult> {
  const sandbox = getSandbox(env, input.deploymentId);
  const workdir = `/workspace/crazp/${input.deploymentId}`;

  const deploy = await sandbox.exec(
    [
      "wrangler",
      "deploy",
      "--config",
      shellQuote(".crazp/output/wrangler.json"),
      "--name",
      shellQuote(input.workerName),
      "--dispatch-namespace",
      shellQuote(input.dispatchNamespace),
    ].join(" "),
    {
      cwd: workdir,
      env: {
        CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
        WRANGLER_SEND_METRICS: "false",
      },
    }
  );

  if (!deploy.success) {
    throw new Error(
      `Sandbox deploy failed:\n${deploy.stderr || deploy.stdout}`
    );
  }

  return {
    stdout: deploy.stdout,
    stderr: deploy.stderr,
  };
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
