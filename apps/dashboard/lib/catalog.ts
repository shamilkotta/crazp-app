/**
 * Catalog listings are not stored in the database yet. Production screens use
 * this fixture dataset until a catalog table exists.
 *
 * Dates are derived from a fixed epoch rather than `Date.now()` so server and
 * client renders agree.
 */

const NOW = new Date("2026-08-13T06:40:00.000Z");

function ago(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60_000);
}

const HOUR = 60;
const DAY = 24 * HOUR;

export type CatalogKind =
  | "tool"
  | "skill"
  | "channel"
  | "connection"
  | "subagent"
  | "template";

export type CatalogField = {
  key: string;
  label: string;
  type: "text" | "secret" | "url" | "select";
  placeholder?: string;
  options?: string[];
  required: boolean;
  help?: string;
};

export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  slug: string;
  name: string;
  /** One line, shown in listings. */
  summary: string;
  /** A short paragraph, shown on the item page. */
  description: string;
  author: { name: string; handle: string; verified: boolean };
  source: "builtin" | "community";
  version: string;
  updatedAt: Date;
  installs: number;
  tags: string[];
  /** Other catalog slugs that must be installed first. */
  requires: string[];
  /** What the user has to fill in at install time. */
  fields: CatalogField[];
  /** Only set for templates: what the template brings with it. */
  includes?: string[];
};

/** User-facing label for first-party vs community catalog items. */
export function catalogSourceLabel(source: CatalogItem["source"]) {
  return source === "builtin" ? "crazp" : "Community";
}

const KIMI = "@cf/moonshotai/kimi-k2.6";

export const catalogKinds: Array<{
  kind: CatalogKind;
  label: string;
  plural: string;
  blurb: string;
}> = [
  {
    kind: "tool",
    label: "Tool",
    plural: "Tools",
    blurb: "Things an agent can do",
  },
  {
    kind: "skill",
    label: "Skill",
    plural: "Skills",
    blurb: "How it should think",
  },
  {
    kind: "channel",
    label: "Channel",
    plural: "Channels",
    blurb: "Where it listens",
  },
  {
    kind: "connection",
    label: "Connection",
    plural: "Connections",
    blurb: "Accounts it acts on behalf of",
  },
  {
    kind: "subagent",
    label: "Subagent",
    plural: "Subagents",
    blurb: "Specialists it delegates to",
  },
  {
    kind: "template",
    label: "Template",
    plural: "Templates",
    blurb: "A whole agent to start from",
  },
];

const crazp = { name: "crazp", handle: "crazp", verified: true };
const community = (name: string, handle: string) => ({
  name,
  handle,
  verified: false,
});

const secretField = (
  key: string,
  label: string,
  help?: string
): CatalogField => ({
  key,
  label,
  type: "secret",
  required: true,
  help,
});

export const catalog: CatalogItem[] = [
  /* ---- channels ---- */
  {
    id: "cat_ch_slack",
    kind: "channel",
    slug: "slack",
    name: "Slack",
    summary: "Listen in channels and threads, reply as a bot user.",
    description:
      "Install the agent into a Slack workspace. It can be mentioned in any channel it has been invited to, replies in-thread, and can post unprompted when a workflow tells it to.",
    author: crazp,
    source: "builtin",
    version: "2.4.0",
    updatedAt: ago(9 * DAY),
    installs: 18_420,
    tags: ["chat", "team"],
    requires: [],
    fields: [
      secretField("botToken", "Bot token", "Starts with xoxb-"),
      secretField("signingSecret", "Signing secret"),
      {
        key: "defaultChannel",
        label: "Default channel",
        type: "text",
        placeholder: "#support-inbox",
        required: false,
      },
    ],
  },
  {
    id: "cat_ch_whatsapp",
    kind: "channel",
    slug: "whatsapp",
    name: "WhatsApp",
    summary: "Answer messages sent to a WhatsApp Business number.",
    description:
      "Connects through the WhatsApp Cloud API. Handles text, images and documents, which makes it the usual choice for agents that read invoices or receipts.",
    author: crazp,
    source: "builtin",
    version: "1.9.2",
    updatedAt: ago(21 * DAY),
    installs: 9_310,
    tags: ["chat", "support"],
    requires: [],
    fields: [
      secretField("accessToken", "Access token"),
      {
        key: "phoneNumberId",
        label: "Phone number ID",
        type: "text",
        placeholder: "1029384756",
        required: true,
      },
      secretField("verifyToken", "Webhook verify token"),
    ],
  },
  {
    id: "cat_ch_telegram",
    kind: "channel",
    slug: "telegram",
    name: "Telegram",
    summary: "Run the agent as a Telegram bot, in DMs or groups.",
    description:
      "The fastest channel to get working — create a bot with BotFather, paste the token, and the agent is reachable in under a minute.",
    author: crazp,
    source: "builtin",
    version: "1.4.0",
    updatedAt: ago(30 * DAY),
    installs: 7_880,
    tags: ["chat"],
    requires: [],
    fields: [secretField("botToken", "Bot token", "From @BotFather")],
  },
  {
    id: "cat_ch_discord",
    kind: "channel",
    slug: "discord",
    name: "Discord",
    summary: "Respond in servers, threads and DMs.",
    description:
      "Useful for community support agents. Supports slash commands as well as mentions.",
    author: crazp,
    source: "builtin",
    version: "1.2.1",
    updatedAt: ago(34 * DAY),
    installs: 4_120,
    tags: ["chat", "community"],
    requires: [],
    fields: [
      secretField("botToken", "Bot token"),
      {
        key: "applicationId",
        label: "Application ID",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "cat_ch_email",
    kind: "channel",
    slug: "email",
    name: "Email",
    summary: "Give the agent its own address and let it reply to threads.",
    description:
      "Inbound mail is parsed into a conversation, so a long reply chain reads as one thread rather than six separate runs.",
    author: crazp,
    source: "builtin",
    version: "2.0.0",
    updatedAt: ago(12 * DAY),
    installs: 11_640,
    tags: ["async", "support"],
    requires: [],
    fields: [
      {
        key: "address",
        label: "Address",
        type: "text",
        placeholder: "help@yourdomain.com",
        required: true,
      },
      secretField("providerToken", "Provider token", "Postmark or Resend"),
    ],
  },
  {
    id: "cat_ch_web",
    kind: "channel",
    slug: "web-widget",
    name: "Web widget",
    summary: "A embeddable chat bubble for your own site.",
    description:
      "Drop one script tag into your site and the agent appears as a chat bubble. Appearance follows your brand colours; conversations show up in run history like any other channel.",
    author: crazp,
    source: "builtin",
    version: "3.1.0",
    updatedAt: ago(5 * DAY),
    installs: 14_050,
    tags: ["web", "embed"],
    requires: [],
    fields: [
      {
        key: "allowedOrigins",
        label: "Allowed origins",
        type: "text",
        placeholder: "https://northwind.co",
        required: true,
        help: "Comma separated. The widget refuses to load elsewhere.",
      },
    ],
  },

  /* ---- connections ---- */
  {
    id: "cat_cn_zendesk",
    kind: "connection",
    slug: "zendesk",
    name: "Zendesk",
    summary: "Read, create and assign tickets.",
    description:
      "Authorise once with OAuth and the agent can open tickets, move them between queues, and read a customer's history before it answers.",
    author: crazp,
    source: "builtin",
    version: "1.7.0",
    updatedAt: ago(16 * DAY),
    installs: 6_240,
    tags: ["support", "oauth"],
    requires: [],
    fields: [
      {
        key: "subdomain",
        label: "Subdomain",
        type: "text",
        placeholder: "northwind",
        required: true,
      },
      {
        key: "scopes",
        label: "Scopes",
        type: "text",
        placeholder: "tickets:write users:read",
        required: true,
      },
    ],
  },
  {
    id: "cat_cn_stripe",
    kind: "connection",
    slug: "stripe",
    name: "Stripe",
    summary: "Look up customers, charges and subscriptions.",
    description:
      "Use a restricted key so the agent can read billing state without being able to move money. Refunds are a separate scope you have to grant deliberately.",
    author: crazp,
    source: "builtin",
    version: "2.2.0",
    updatedAt: ago(7 * DAY),
    installs: 8_970,
    tags: ["billing"],
    requires: [],
    fields: [
      secretField("restrictedKey", "Restricted key", "Starts with rk_"),
      {
        key: "scopes",
        label: "Scopes",
        type: "text",
        placeholder: "customers:read charges:read",
        required: true,
      },
    ],
  },
  {
    id: "cat_cn_github",
    kind: "connection",
    slug: "github",
    name: "GitHub",
    summary: "Read repositories, issues and pull requests.",
    description:
      "Scoped to the repositories you pick. Most people pair this with the release-notes template.",
    author: crazp,
    source: "builtin",
    version: "1.5.3",
    updatedAt: ago(19 * DAY),
    installs: 7_410,
    tags: ["dev", "oauth"],
    requires: [],
    fields: [
      {
        key: "repositories",
        label: "Repositories",
        type: "text",
        placeholder: "northwind/api, northwind/web",
        required: true,
      },
    ],
  },
  {
    id: "cat_cn_hubspot",
    kind: "connection",
    slug: "hubspot",
    name: "HubSpot",
    summary: "Read and update deals, contacts and companies.",
    description:
      "Gives sales agents enough context to write a useful digest, and enough permission to log activity back onto the deal.",
    author: community("Priya Nair", "priya"),
    source: "community",
    version: "0.8.1",
    updatedAt: ago(26 * DAY),
    installs: 1_180,
    tags: ["sales", "crm"],
    requires: [],
    fields: [secretField("privateAppToken", "Private app token")],
  },
  {
    id: "cat_cn_notion",
    kind: "connection",
    slug: "notion",
    name: "Notion",
    summary: "Read pages and databases, append blocks.",
    description:
      "Handy when your documentation lives in Notion and you want the agent to quote it rather than guess.",
    author: community("Tomas Vlk", "tomas"),
    source: "community",
    version: "1.1.0",
    updatedAt: ago(41 * DAY),
    installs: 2_640,
    tags: ["docs"],
    requires: [],
    fields: [secretField("integrationToken", "Integration token")],
  },

  /* ---- tools ---- */
  {
    id: "cat_tl_web_search",
    kind: "tool",
    slug: "web-search",
    name: "Web search",
    summary: "Search the public web and read the results.",
    description:
      "Returns ranked results with a short extract from each page, so the agent can decide what to open rather than fetching everything.",
    author: crazp,
    source: "builtin",
    version: "1.0.0",
    updatedAt: ago(48 * DAY),
    installs: 22_900,
    tags: ["research", "builtin"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_tl_browser",
    kind: "tool",
    slug: "browser",
    name: "Headless browser",
    summary: "Open a page, click things, and read what comes back.",
    description:
      "For sites with no API. Runs in a sandbox with a per-run time limit; the agent gets the rendered text, not raw HTML.",
    author: crazp,
    source: "builtin",
    version: "1.6.0",
    updatedAt: ago(11 * DAY),
    installs: 9_640,
    tags: ["automation", "sandbox"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_tl_sql",
    kind: "tool",
    slug: "sql-query",
    name: "SQL query",
    summary: "Run read-only queries against a database you connect.",
    description:
      "Statements are parsed and rejected unless they are a single SELECT, so an agent cannot write even if it is asked to.",
    author: community("Marek Dolinski", "marek"),
    source: "community",
    version: "0.6.2",
    updatedAt: ago(23 * DAY),
    installs: 3_180,
    tags: ["data"],
    requires: [],
    fields: [
      secretField("connectionString", "Connection string"),
      {
        key: "maxRows",
        label: "Row limit",
        type: "text",
        placeholder: "500",
        required: false,
      },
    ],
  },
  {
    id: "cat_tl_ticket",
    kind: "tool",
    slug: "create-ticket",
    name: "Create ticket",
    summary: "Open a ticket and assign it to a queue.",
    description:
      "Needs a support connection. The agent supplies a title, body and priority; the queue is either fixed here or chosen at run time.",
    author: crazp,
    source: "builtin",
    version: "1.3.0",
    updatedAt: ago(16 * DAY),
    installs: 5_870,
    tags: ["support"],
    requires: ["zendesk"],
    fields: [
      {
        key: "defaultQueue",
        label: "Default queue",
        type: "text",
        placeholder: "tier-1",
        required: false,
      },
    ],
  },
  {
    id: "cat_tl_send_email",
    kind: "tool",
    slug: "send-email",
    name: "Send email",
    summary: "Send a message from an address you own.",
    description:
      "Separate from the email channel: this is the agent starting a conversation rather than replying to one.",
    author: crazp,
    source: "builtin",
    version: "1.1.0",
    updatedAt: ago(29 * DAY),
    installs: 8_120,
    tags: ["async"],
    requires: [],
    fields: [
      {
        key: "fromAddress",
        label: "From address",
        type: "text",
        placeholder: "agent@northwind.co",
        required: true,
      },
    ],
  },
  {
    id: "cat_tl_pdf",
    kind: "tool",
    slug: "read-document",
    name: "Read document",
    summary: "Pull text and tables out of a PDF or image.",
    description:
      "Keeps table structure, which is what makes invoice and statement reading work at all.",
    author: community("Lena Fischer", "lena"),
    source: "community",
    version: "1.2.4",
    updatedAt: ago(14 * DAY),
    installs: 4_460,
    tags: ["documents", "ocr"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_tl_calendar",
    kind: "tool",
    slug: "book-meeting",
    name: "Book a meeting",
    summary: "Find free time and put something on a calendar.",
    description:
      "Reads availability across the calendars you connect and writes the invite. It will never double-book without asking.",
    author: community("Sofia Márquez", "sofia"),
    source: "community",
    version: "0.9.0",
    updatedAt: ago(37 * DAY),
    installs: 2_050,
    tags: ["scheduling"],
    requires: [],
    fields: [
      {
        key: "calendarId",
        label: "Calendar",
        type: "text",
        placeholder: "team@northwind.co",
        required: true,
      },
      {
        key: "duration",
        label: "Default length",
        type: "select",
        options: ["15 min", "30 min", "45 min", "60 min"],
        required: false,
      },
    ],
  },

  /* ---- skills ---- */
  {
    id: "cat_sk_triage",
    kind: "skill",
    slug: "support-triage-rubric",
    name: "Support triage rubric",
    summary: "Grade urgency from P0 to P3 consistently.",
    description:
      "A written rubric with worked examples. Agents that use it stop calling everything urgent, which is the usual failure mode of a support agent.",
    author: crazp,
    source: "builtin",
    version: "1.4.0",
    updatedAt: ago(13 * DAY),
    installs: 6_730,
    tags: ["support"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_tone",
    kind: "skill",
    slug: "plain-language",
    name: "Plain language",
    summary: "Write like a person, not a policy document.",
    description:
      "Short sentences, no exclamation marks, name the problem before the fix. The most installed skill on the platform, for good reason.",
    author: crazp,
    source: "builtin",
    version: "2.0.1",
    updatedAt: ago(6 * DAY),
    installs: 19_880,
    tags: ["writing"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_refund",
    kind: "skill",
    slug: "refund-policy",
    name: "Refund policy",
    summary: "When a refund is allowed and who has to approve it.",
    description:
      "A starting point you are meant to edit — the thresholds are placeholders until you replace them with your own.",
    author: crazp,
    source: "builtin",
    version: "1.0.2",
    updatedAt: ago(33 * DAY),
    installs: 3_420,
    tags: ["billing", "policy"],
    requires: [],
    fields: [
      {
        key: "windowDays",
        label: "Automatic window",
        type: "text",
        placeholder: "14",
        required: false,
        help: "Days after purchase a refund needs no approval.",
      },
    ],
  },
  {
    id: "cat_sk_escalate",
    kind: "skill",
    slug: "escalation-brief",
    name: "Escalation brief",
    summary: "Hand off to a human in four lines.",
    description:
      "Teaches the agent to summarise a conversation the way an on-call engineer wants to receive it: what happened, what was tried, what is needed.",
    author: community("Dan Whitfield", "dan"),
    source: "community",
    version: "1.1.0",
    updatedAt: ago(18 * DAY),
    installs: 2_910,
    tags: ["support", "handoff"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_rag",
    kind: "skill",
    slug: "cite-your-sources",
    name: "Cite your sources",
    summary: "Quote the page, or say you don't know.",
    description:
      "Pairs with any documentation connection. Turns confident invention into a plain admission that the docs do not cover it.",
    author: crazp,
    source: "builtin",
    version: "1.2.0",
    updatedAt: ago(10 * DAY),
    installs: 12_240,
    tags: ["docs", "accuracy"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_deescalate",
    kind: "skill",
    slug: "de-escalation",
    name: "De-escalation",
    summary: "Lower the temperature before you try to solve anything.",
    description:
      "Acknowledge the frustration in one sentence, then get specific. No 'I understand how you feel' and no exclamation marks. Works on the tickets that would otherwise bounce to a human for tone alone.",
    author: crazp,
    source: "builtin",
    version: "1.3.0",
    updatedAt: ago(8 * DAY),
    installs: 8_410,
    tags: ["support", "writing"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_privacy",
    kind: "skill",
    slug: "privacy-redaction",
    name: "Privacy redaction",
    summary: "Never repeat a card number, address, or government ID.",
    description:
      "Teaches the agent to recognise common PII, mask it in replies, and refuse to log it back into the conversation. Pair with any support or billing agent that sees customer records.",
    author: crazp,
    source: "builtin",
    version: "1.1.0",
    updatedAt: ago(21 * DAY),
    installs: 5_560,
    tags: ["privacy", "policy"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_qualify",
    kind: "skill",
    slug: "lead-qualification",
    name: "Lead qualification",
    summary: "Ask BANT in a way that does not feel like a form.",
    description:
      "Budget, authority, need, timing — in that order, but only after the prospect has said what they are trying to do. Stops the agent from pitching before it knows who it is talking to.",
    author: community("Priya Nair", "priya"),
    source: "community",
    version: "0.9.4",
    updatedAt: ago(11 * DAY),
    installs: 1_870,
    tags: ["sales"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_notes",
    kind: "skill",
    slug: "meeting-notes",
    name: "Meeting notes",
    summary: "Decisions, owners, and dates. Nothing else.",
    description:
      "Turns a transcript into a one-page brief: what was decided, who owns it, and by when. Drops the recap of who said what, which nobody rereads.",
    author: crazp,
    source: "builtin",
    version: "1.0.0",
    updatedAt: ago(4 * DAY),
    installs: 4_980,
    tags: ["writing", "ops"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_review",
    kind: "skill",
    slug: "code-review-voice",
    name: "Code review voice",
    summary: "Comment on the diff, not the person.",
    description:
      "Findings first, severity second, suggested patch last. No 'great job' padding. Flags missing tests and silent error handling because those are the ones that ship.",
    author: community("Leo Park", "leo"),
    source: "community",
    version: "1.2.2",
    updatedAt: ago(16 * DAY),
    installs: 3_140,
    tags: ["engineering"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_incident",
    kind: "skill",
    slug: "incident-status",
    name: "Incident status",
    summary: "What is broken, who is affected, what we know.",
    description:
      "A status-page voice: present tense, no speculation, no 'we apologise for the inconvenience'. Updates are additive so a later note never silently rewrites an earlier one.",
    author: crazp,
    source: "builtin",
    version: "1.5.0",
    updatedAt: ago(2 * DAY),
    installs: 7_220,
    tags: ["ops", "writing"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_faq",
    kind: "skill",
    slug: "answer-from-faq",
    name: "Answer from FAQ",
    summary: "Prefer the published answer over a clever paraphrase.",
    description:
      "If the docs have a canonical reply, use it. If they do not, say so and offer to escalate. Stops the agent inventing a policy that sounds right.",
    author: crazp,
    source: "builtin",
    version: "1.0.3",
    updatedAt: ago(19 * DAY),
    installs: 9_050,
    tags: ["docs", "support"],
    requires: ["cite-your-sources"],
    fields: [],
  },
  {
    id: "cat_sk_i18n",
    kind: "skill",
    slug: "reply-in-kind",
    name: "Reply in kind",
    summary: "Match the customer's language. Do not mix.",
    description:
      "Detects the language of the latest message and stays in it, including error messages. Falls back to English only if it cannot tell, and says that it is doing so.",
    author: community("Marta Silva", "marta"),
    source: "community",
    version: "1.0.1",
    updatedAt: ago(27 * DAY),
    installs: 2_430,
    tags: ["writing", "support"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_recovery",
    kind: "skill",
    slug: "service-recovery",
    name: "Service recovery",
    summary: "Make it right without giving away the store.",
    description:
      "When the company is at fault: apology, specific fix, what happens next. Credits and refunds stay inside the policy skill — this one is about the conversation, not the ledger.",
    author: crazp,
    source: "builtin",
    version: "1.1.1",
    updatedAt: ago(14 * DAY),
    installs: 4_670,
    tags: ["support", "billing"],
    requires: ["refund-policy"],
    fields: [],
  },
  {
    id: "cat_sk_routing",
    kind: "skill",
    slug: "feature-request-routing",
    name: "Feature request routing",
    summary: "Capture the ask, do not promise the roadmap.",
    description:
      "Logs a feature request with the job to be done and how often it comes up. Never says 'I'll pass this to the product team' unless a ticket was actually opened.",
    author: community("Jonah Ellis", "jonah"),
    source: "community",
    version: "0.8.0",
    updatedAt: ago(40 * DAY),
    installs: 1_260,
    tags: ["product", "support"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_churn",
    kind: "skill",
    slug: "save-the-account",
    name: "Save the account",
    summary: "Ask why they are leaving before you discount.",
    description:
      "A short save play: diagnose, offer the smallest relevant fix, then the pause, then the discount. Stops the agent from leading with 30% off every time someone types cancel.",
    author: crazp,
    source: "builtin",
    version: "1.2.0",
    updatedAt: ago(9 * DAY),
    installs: 3_890,
    tags: ["billing", "sales"],
    requires: [],
    fields: [
      {
        key: "maxDiscount",
        label: "Max discount",
        type: "select",
        options: ["10%", "20%", "30%"],
        required: false,
        help: "The agent will not go above this without a human.",
      },
    ],
  },
  {
    id: "cat_sk_onboard",
    kind: "skill",
    slug: "first-week-onboarding",
    name: "First-week onboarding",
    summary: "One next step at a time, not a tour of every feature.",
    description:
      "Picks the single most useful action for a new account and waits until it is done. The usual failure mode is a 12-bullet getting-started email nobody finishes.",
    author: crazp,
    source: "builtin",
    version: "1.0.0",
    updatedAt: ago(7 * DAY),
    installs: 6_110,
    tags: ["product", "writing"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_legal",
    kind: "skill",
    slug: "do-not-advise",
    name: "Do not advise",
    summary: "No legal, tax, or medical claims. Point to a human.",
    description:
      "A hard stop for regulated questions. The agent names the domain, refuses to opine, and offers a specialist or a documented policy page instead.",
    author: crazp,
    source: "builtin",
    version: "2.1.0",
    updatedAt: ago(3 * DAY),
    installs: 11_040,
    tags: ["policy", "accuracy"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sk_compete",
    kind: "skill",
    slug: "competitive-positioning",
    name: "Competitive positioning",
    summary: "Compare on facts. Do not badmouth.",
    description:
      "When a prospect names a competitor, answer with the documented differences and where the other product is a better fit. Invented knock-downs get agents uninstalled.",
    author: community("Asha Menon", "asha"),
    source: "community",
    version: "1.0.0",
    updatedAt: ago(22 * DAY),
    installs: 1_540,
    tags: ["sales"],
    requires: [],
    fields: [],
  },

  /* ---- subagents ---- */
  {
    id: "cat_sa_billing",
    kind: "subagent",
    slug: "billing-investigator",
    name: "Billing investigator",
    summary: "Reconstructs a billing timeline for a disputed charge.",
    description:
      "Given a customer, it walks the invoices and charges and explains what was billed when, without taking a side. Comes with its own narrow toolset.",
    author: crazp,
    source: "builtin",
    version: "1.3.0",
    updatedAt: ago(15 * DAY),
    installs: 2_180,
    tags: ["billing"],
    requires: ["stripe"],
    fields: [
      {
        key: "model",
        label: "Model",
        type: "select",
        options: [KIMI, "@cf/meta/llama-4-scout-17b"],
        required: false,
      },
    ],
  },
  {
    id: "cat_sa_researcher",
    kind: "subagent",
    slug: "researcher",
    name: "Researcher",
    summary: "Goes away, reads a lot, comes back with a summary.",
    description:
      "Runs a longer loop than the parent agent so a slow question does not block a fast conversation.",
    author: crazp,
    source: "builtin",
    version: "1.0.0",
    updatedAt: ago(24 * DAY),
    installs: 4_620,
    tags: ["research"],
    requires: [],
    fields: [],
  },
  {
    id: "cat_sa_translator",
    kind: "subagent",
    slug: "translator",
    name: "Translator",
    summary: "Answers in the language the customer wrote in.",
    description:
      "Detects the incoming language, translates the draft reply, and keeps product names untouched.",
    author: community("Yuki Tanaka", "yuki"),
    source: "community",
    version: "0.7.3",
    updatedAt: ago(31 * DAY),
    installs: 1_540,
    tags: ["i18n"],
    requires: [],
    fields: [],
  },

  /* ---- templates ---- */
  {
    id: "cat_tp_support",
    kind: "template",
    slug: "support-triage",
    name: "Support triage",
    summary: "Reads inbound support, answers the easy half, routes the rest.",
    description:
      "The most common first agent. Arrives with a triage rubric, a tone-of-voice skill, ticket tooling and a Slack channel ready to configure.",
    author: crazp,
    source: "builtin",
    version: "2.1.0",
    updatedAt: ago(8 * DAY),
    installs: 5_910,
    tags: ["support", "popular"],
    requires: [],
    fields: [],
    includes: [
      "4 tools",
      "2 skills",
      "Slack channel",
      "Zendesk connection",
      "1 subagent",
    ],
  },
  {
    id: "cat_tp_release",
    kind: "template",
    slug: "release-notes",
    name: "Release notes writer",
    summary: "Turns merged pull requests into notes a customer understands.",
    description:
      "Wakes on a tag, reads the diff summaries, groups by user-visible outcome, and posts where your team already reads.",
    author: crazp,
    source: "builtin",
    version: "1.4.0",
    updatedAt: ago(20 * DAY),
    installs: 2_380,
    tags: ["dev"],
    requires: [],
    fields: [],
    includes: ["3 tools", "1 skill", "GitHub connection", "1 schedule"],
  },
  {
    id: "cat_tp_docs",
    kind: "template",
    slug: "docs-answerer",
    name: "Docs answerer",
    summary: "Answers product questions using only your documentation.",
    description:
      "Ships with the cite-your-sources skill so it quotes a page or admits the gap, and a web widget so you can put it in your docs site the same day.",
    author: crazp,
    source: "builtin",
    version: "1.8.0",
    updatedAt: ago(4 * DAY),
    installs: 4_050,
    tags: ["docs", "popular"],
    requires: [],
    fields: [],
    includes: ["4 tools", "5 skills", "Web widget"],
  },
  {
    id: "cat_tp_invoice",
    kind: "template",
    slug: "invoice-reader",
    name: "Invoice reader",
    summary: "Pulls line items out of invoices sent over WhatsApp.",
    description:
      "Reads documents, checks the arithmetic, and flags anything where the total does not match the lines.",
    author: community("Lena Fischer", "lena"),
    source: "community",
    version: "1.0.1",
    updatedAt: ago(27 * DAY),
    installs: 860,
    tags: ["documents", "finance"],
    requires: [],
    fields: [],
    includes: ["3 tools", "WhatsApp channel"],
  },
];

export const featuredCatalogSlugs = [
  "support-triage",
  "plain-language",
  "slack",
  "web-search",
];

export const catalogTags = Array.from(
  new Set(catalog.flatMap((item) => item.tags))
).sort();

export function catalogItem(slug: string) {
  return catalog.find((item) => item.slug === slug);
}

export const templates = catalog.filter((item) => item.kind === "template");
