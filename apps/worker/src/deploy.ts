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
      // Workers for Platforms dispatch namespace — restore when the account has access.
      // "--dispatch-namespace",
      // shellQuote(input.dispatchNamespace),
    ].join(" "),
    {
      cwd: workdir,
      env: {
        CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
        // Placeholder only — wrangler refuses to run without this env var.
        // The real token stays on the Worker and is injected by outboundByHost.
        CLOUDFLARE_API_TOKEN: "injected-by-outbound-handler",
        WRANGLER_SEND_METRICS: "false",
        // DinD cannot use iptables, so docker build must share the host network.
        WRANGLER_CI_OVERRIDE_NETWORK_MODE_HOST: "true",
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
