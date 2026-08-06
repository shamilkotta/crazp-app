import type {
  D1Database,
  IncomingRequestCfProperties,
  KVNamespace,
} from "@cloudflare/workers-types";
import { createDb } from "@workspace/db";
import { members } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { withCloudflare } from "better-auth-cloudflare";
import { sendAuthEmail, type SendEmailBinding } from "./email";

export type AuthEnv = {
  DATABASE: D1Database;
  KV?: KVNamespace;
  EMAIL?: SendEmailBinding;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  COOKIE_DOMAIN?: string;
  EMAIL_FROM?: string;
};

export type CloudflareContext = {
  env: AuthEnv;
  cf?: IncomingRequestCfProperties;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function personalOrgName(user: { name: string; email: string }) {
  const base = user.name?.trim() || user.email.split("@")[0] || "user";
  return `${base}'s Team`;
}

function personalOrgSlug(user: { id: string; name: string; email: string }) {
  const base = slugify(user.name || user.email.split("@")[0] || "team");
  return `${base}-${user.id.slice(0, 8)}`;
}

function parseTrustedOrigins(value: string | undefined, baseURL: string) {
  const origins = (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  try {
    origins.push(new URL(baseURL).origin);
  } catch {
    // ignore invalid base URL during CLI schema generation
  }

  return [...new Set(origins)];
}

function isLocalhostDomain(domain: string) {
  const host = domain.replace(/^\./, "");
  return host === "localhost" || host.endsWith(".localhost");
}

/**
 * Cross-subdomain cookies need a shared Domain attribute (e.g. `.crazp.dev`).
 * Browsers reject `Domain=localhost` / `Domain=.localhost`, so local hosts
 * must use host-only cookies instead.
 */
function cookieDomain(env: AuthEnv) {
  if (env.COOKIE_DOMAIN) {
    return isLocalhostDomain(env.COOKIE_DOMAIN) ? undefined : env.COOKIE_DOMAIN;
  }
  try {
    const hostname = new URL(env.BETTER_AUTH_URL).hostname;
    if (isLocalhostDomain(hostname)) {
      return undefined;
    }
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
  } catch {
    // fall through
  }
  return undefined;
}

function authBuilder(ctx: CloudflareContext) {
  const db = createDb(ctx.env.DATABASE);
  const emailFrom = ctx.env.EMAIL_FROM ?? "noreply@crazp.dev";
  const trustedOrigins = parseTrustedOrigins(
    ctx.env.BETTER_AUTH_TRUSTED_ORIGINS,
    ctx.env.BETTER_AUTH_URL
  );
  const domain = cookieDomain(ctx.env);

  let instanceRef: {
    api: {
      createOrganization: (input: {
        body: { name: string; slug: string; userId: string };
      }) => Promise<unknown>;
    };
  };

  const instance = betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: ctx.cf ?? {},
        d1: {
          db,
          options: {
            usePlural: true,
          },
        },
        kv: ctx.env.KV,
      },
      {
        appName: "crazp",
        secret: ctx.env.BETTER_AUTH_SECRET,
        baseURL: ctx.env.BETTER_AUTH_URL,
        trustedOrigins,
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: true,
          minPasswordLength: 8,
          maxPasswordLength: 256,
          revokeSessionsOnPasswordReset: true,
          sendResetPassword: async ({ user, url }) => {
            await sendAuthEmail(ctx.env.EMAIL, emailFrom, {
              to: user.email,
              subject: "Reset your crazp password",
              text: `Reset your password: ${url}`,
              html: `<p>Reset your password by clicking <a href="${url}">this link</a>.</p>`,
            });
          },
        },
        emailVerification: {
          sendOnSignUp: true,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            await sendAuthEmail(ctx.env.EMAIL, emailFrom, {
              to: user.email,
              subject: "Verify your crazp email",
              text: `Verify your email: ${url}`,
              html: `<p>Verify your email by clicking <a href="${url}">this link</a>.</p>`,
            });
          },
        },
        session: {
          expiresIn: 60 * 60 * 24 * 7,
          updateAge: 60 * 60 * 24,
          cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
          },
        },
        rateLimit: {
          enabled: true,
          window: 60,
          max: 100,
          storage: ctx.env.KV ? "secondary-storage" : "memory",
          customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60, max: 3 },
            "/request-password-reset": { window: 60, max: 3 },
            "/forget-password": { window: 60, max: 3 },
          },
        },
        advanced: {
          useSecureCookies: ctx.env.BETTER_AUTH_URL.startsWith("https://"),
          ...(domain
            ? {
                crossSubDomainCookies: {
                  enabled: true,
                  domain,
                },
              }
            : {}),
          ipAddress: {
            ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
          },
        },
        plugins: [
          organization({
            allowUserToCreateOrganization: true,
            creatorRole: "owner",
            invitationExpiresIn: 60 * 60 * 24 * 7,
            sendInvitationEmail: async (data) => {
              const inviteUrl = `${ctx.env.BETTER_AUTH_URL}/accept-invite?invitationId=${data.invitation.id}`;
              await sendAuthEmail(ctx.env.EMAIL, emailFrom, {
                to: data.email,
                subject: `Join ${data.organization.name} on crazp`,
                text: `${data.inviter.user.name} invited you to join ${data.organization.name}. Accept: ${inviteUrl}`,
                html: `<p>${data.inviter.user.name} invited you to join <strong>${data.organization.name}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
              });
            },
          }),
          nextCookies(),
        ],
        databaseHooks: {
          user: {
            create: {
              after: async (user) => {
                await instanceRef.api.createOrganization({
                  body: {
                    name: personalOrgName(user),
                    slug: personalOrgSlug(user),
                    userId: user.id,
                  },
                });
              },
            },
          },
          session: {
            create: {
              before: async (session) => {
                if (session.activeOrganizationId) {
                  return { data: session };
                }

                const membership = await db.query.members.findFirst({
                  where: eq(members.userId, session.userId),
                });

                return {
                  data: {
                    ...session,
                    activeOrganizationId: membership?.organizationId,
                  },
                };
              },
            },
          },
        },
      }
    ),
  });

  instanceRef = instance as typeof instanceRef;
  return instance;
}

let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null;

export function initAuth(ctx: CloudflareContext) {
  if (!authInstance) {
    authInstance = authBuilder(ctx);
  }
  return authInstance;
}

export type Auth = Awaited<ReturnType<typeof initAuth>>;
export type Session = Auth["$Infer"]["Session"];
