"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";
import {
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  Database,
  FileCode2,
  FileText,
  GitBranch,
  GitPullRequest,
  Globe,
  Hash,
  Inbox,
  Kanban,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Package,
  Plane,
  Search,
  ShoppingCart,
  Terminal,
  ThumbsUp,
  Truck,
  Webhook,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const StageAnimationContext = createContext(true);

export function StageAnimationProvider({
  animated,
  children,
}: {
  animated: boolean;
  children: ReactNode;
}) {
  return (
    <StageAnimationContext value={animated}>{children}</StageAnimationContext>
  );
}

function useAnimatedInterval(
  callback: () => void,
  delay: number,
  deps: DependencyList = []
) {
  const animated = useContext(StageAnimationContext);

  useEffect(() => {
    if (!animated) return;
    const id = window.setInterval(callback, delay);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, delay, ...deps]);
}

function PulseDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 animate-pulse rounded-full bg-foreground",
        className
      )}
    />
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-muted-foreground"
          style={{
            animation: "agent-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}

export function ChatInterfaceCard() {
  const [step, setStep] = useState(0);

  useAnimatedInterval(() => {
    setStep((s) => (s + 1) % 4);
  }, 2200);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="grid size-6 place-items-center rounded-md bg-foreground/5">
          <Bot className="size-3.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium">Agent chat</p>
          <p className="font-mono text-[9px] text-muted-foreground">online</p>
        </div>
        <PulseDot />
      </div>

      <div className="flex flex-col gap-2">
        <div className="max-w-[85%] self-end rounded-lg rounded-br-sm bg-foreground px-2.5 py-1.5 text-[10px] leading-relaxed text-background">
          Ship the pricing page copy and open a PR
        </div>
        {step >= 1 ? (
          <div className="max-w-[90%] self-start rounded-lg rounded-bl-sm bg-muted px-2.5 py-1.5 text-[10px] leading-relaxed text-foreground">
            On it — drafting copy, then branching from main.
          </div>
        ) : null}
        {step >= 2 ? (
          <div className="max-w-[90%] self-start rounded-lg rounded-bl-sm bg-muted px-2.5 py-1.5 text-[10px] leading-relaxed text-foreground">
            Draft ready. Creating PR…
          </div>
        ) : null}
        {step === 3 ? (
          <div className="flex items-center gap-1.5 self-start text-[10px] text-muted-foreground">
            <TypingDots /> thinking
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BrowserAgentCard() {
  const [urlIndex, setUrlIndex] = useState(0);
  const urls = [
    "docs.stripe.com/api/prices",
    "github.com/search?q=pricing",
    "notion.so/brief/launch",
  ];

  useAnimatedInterval(() => {
    setUrlIndex((i) => (i + 1) % urls.length);
  }, 2800, [urls.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-2.5 py-2">
        <div className="flex gap-1">
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/20" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 py-1">
          <Globe className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-[9px] text-muted-foreground">
            {urls[urlIndex]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <Search className="size-3 text-muted-foreground" />
          <div className="h-1.5 flex-1 rounded-full bg-foreground/10" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[72, 54, 63].map((w, i) => (
            <div
              key={i}
              className="h-12 rounded-md border border-border/50 bg-muted/30 p-1.5"
            >
              <div
                className="mb-1.5 h-1 rounded-full bg-foreground/15"
                style={{ width: `${w}%` }}
              />
              <div className="h-1 w-[40%] rounded-full bg-foreground/8" />
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          scraping · 3 sources
        </div>
      </div>
    </div>
  );
}

export function CodeEditorCard() {
  const lines = [
    { n: 12, code: "export async function ship()", dim: false },
    { n: 13, code: "  const draft = await write()", dim: false },
    { n: 14, code: "  await openPullRequest({", dim: false },
    { n: 15, code: '    title: "feat: pricing"', dim: true },
    { n: 16, code: "  })", dim: false },
  ];
  const [cursor, setCursor] = useState(true);

  useAnimatedInterval(() => setCursor((c) => !c), 530);

  return (
    <div className="flex h-full flex-col font-mono text-[10px]">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-[9px] text-muted-foreground">
        <FileCode2 className="size-3" />
        pricing-page.tsx
        <span className="ml-auto flex items-center gap-1">
          <PulseDot className="bg-foreground/70" />
          editing
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        {lines.map((line) => (
          <div key={line.n} className="flex gap-3">
            <span className="w-4 shrink-0 text-right text-muted-foreground/50">
              {line.n}
            </span>
            <span
              className={cn(
                "whitespace-pre",
                line.dim ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {line.code}
              {line.n === 15 && cursor ? (
                <span className="ml-px inline-block h-3 w-px bg-foreground align-middle" />
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PullRequestCard() {
  const [checks, setChecks] = useState(1);

  useAnimatedInterval(() => {
    setChecks((c) => (c >= 3 ? 1 : c + 1));
  }, 1800);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-start gap-2">
        <GitPullRequest className="mt-0.5 size-4 text-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-snug font-medium">
            feat: rewrite pricing page copy
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
            #428 · agent → main
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-muted/20 p-2">
        {[
          { label: "lint", ok: checks >= 1 },
          { label: "typecheck", ok: checks >= 2 },
          { label: "preview", ok: checks >= 3 },
        ].map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-2 text-[10px]"
          >
            {check.ok ? (
              <CheckCircle2 className="size-3 text-foreground" />
            ) : (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
            <span className="font-mono text-muted-foreground">
              {check.label}
            </span>
            <span className="ml-auto text-muted-foreground/70">
              {check.ok ? "passed" : "running"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
        <GitBranch className="size-3" />
        +48 −12 · ready to merge
      </div>
    </div>
  );
}

export function EmailComposeCard() {
  const [progress, setProgress] = useState(0);

  useAnimatedInterval(() => {
    setProgress((p) => (p >= 100 ? 0 : p + 8));
  }, 400);

  const body =
    "Hi Maya — attaching the revised proposal and two times that work next week.";
  const visible = body.slice(0, Math.floor((progress / 100) * body.length));

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Mail className="size-3.5" />
        <span className="text-[11px] font-medium">Compose</span>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          draft
        </span>
      </div>
      <div className="flex flex-col gap-1.5 text-[10px]">
        <div className="flex gap-2">
          <span className="w-8 text-muted-foreground">To</span>
          <span>maya@acme.co</span>
        </div>
        <div className="flex gap-2">
          <span className="w-8 text-muted-foreground">Subj</span>
          <span className="truncate">Follow-up: Q3 proposal</span>
        </div>
      </div>
      <p className="mt-1 min-h-14 flex-1 text-[10px] leading-relaxed text-foreground/90">
        {visible}
        <span className="inline-block h-3 w-px animate-pulse bg-foreground align-middle" />
      </p>
      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        <span className="font-mono text-[9px] text-muted-foreground">
          agent · sending soon
        </span>
        <span className="rounded-sm bg-foreground px-2 py-0.5 text-[9px] text-background">
          Send
        </span>
      </div>
    </div>
  );
}

export function OrderFlowCard() {
  const stages = ["Cart", "Pay", "Ship", "Done"];
  const [stage, setStage] = useState(0);

  useAnimatedInterval(() => {
    setStage((s) => (s + 1) % stages.length);
  }, 1600, [stages.length]);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <ShoppingCart className="size-3.5" />
        <span className="text-[11px] font-medium">Office supplies</span>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          $186.40
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        {stages.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-[9px]",
                i <= stage
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground"
              )}
            >
              {i < stage ? <Check className="size-2.5" /> : i + 1}
            </span>
            <span className="font-mono text-[8px] text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-border/60 bg-muted/20 p-2">
        <div className="flex items-center gap-2 text-[10px]">
          <Package className="size-3.5 text-muted-foreground" />
          <span>12× notebooks · 4× pens</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Truck className="size-3.5" />
          <span>Arrives Thu · tracked</span>
        </div>
      </div>
    </div>
  );
}

export function CalendarBookCard() {
  const slots = ["Tue 10:00", "Tue 14:30", "Wed 09:00"];
  const [picked, setPicked] = useState(1);

  useAnimatedInterval(() => {
    setPicked((p) => (p + 1) % slots.length);
  }, 2000, [slots.length]);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-3.5" />
        <span className="text-[11px] font-medium">Book intro call</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {slots.map((slot, i) => (
          <div
            key={slot}
            className={cn(
              "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[10px] transition-colors",
              i === picked
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 text-muted-foreground"
            )}
          >
            <span>{slot}</span>
            {i === picked ? (
              <span className="font-mono text-[8px] opacity-80">booked</span>
            ) : (
              <ChevronRight className="size-3 opacity-50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SlackThreadCard() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <MessageSquare className="size-3.5" />
        <span className="text-[11px] font-medium">#launch</span>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          3 replies
        </span>
      </div>
      <div className="flex flex-col gap-2 text-[10px]">
        <div className="flex gap-2">
          <span className="grid size-5 shrink-0 place-items-center rounded bg-foreground/10 text-[8px] font-medium">
            JD
          </span>
          <div>
            <p className="font-medium">jordan</p>
            <p className="text-muted-foreground">
              Can someone update the FAQ before Friday?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="grid size-5 shrink-0 place-items-center rounded bg-foreground text-[8px] font-medium text-background">
            AI
          </span>
          <div>
            <p className="font-medium">crazp</p>
            <p className="text-muted-foreground">
              Done — PR linked. FAQ section refreshed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TerminalCard() {
  const [lines, setLines] = useState([
    "$ crazp run deploy-preview",
    "→ bundling worker…",
  ]);

  useAnimatedInterval(() => {
    const sequence = [
      ["$ crazp run deploy-preview", "→ bundling worker…"],
      [
        "$ crazp run deploy-preview",
        "→ bundling worker…",
        "→ uploading assets…",
      ],
      [
        "$ crazp run deploy-preview",
        "→ bundling worker…",
        "→ uploading assets…",
        "✓ preview ready",
      ],
    ];
    setLines((current) => {
      const currentIndex = sequence.findIndex(
        (lines) => lines.length === current.length
      );
      return sequence[(currentIndex + 1) % sequence.length]!;
    });
  }, 1600);

  return (
    <div className="flex h-full flex-col bg-foreground/3 p-3 font-mono text-[10px]">
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <Terminal className="size-3" />
        agent-shell
      </div>
      <div className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <span
            key={`${line}-${i}`}
            className={cn(
              line.startsWith("✓")
                ? "text-foreground"
                : line.startsWith("$")
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {line}
          </span>
        ))}
        <span className="inline-block h-3 w-1.5 animate-pulse bg-foreground/70" />
      </div>
    </div>
  );
}

export function InboxTriageCard() {
  const items = [
    { from: "Acme", subject: "Contract revision", tag: "reply" },
    { from: "Notion", subject: "Weekly digest", tag: "archive" },
    { from: "Linear", subject: "Sprint rolled", tag: "label" },
  ];
  const [active, setActive] = useState(0);

  useAnimatedInterval(() => {
    setActive((a) => (a + 1) % items.length);
  }, 1700, [items.length]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Inbox className="size-3.5" />
        <span className="text-[11px] font-medium">Inbox triage</span>
        <PulseDot className="ml-auto" />
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div
            key={item.subject}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] transition-colors",
              i === active ? "bg-foreground/5" : "opacity-55"
            )}
          >
            <CircleDot className="size-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.from}</p>
              <p className="truncate text-muted-foreground">{item.subject}</p>
            </div>
            <span className="shrink-0 font-mono text-[8px] text-muted-foreground uppercase">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiffViewCard() {
  return (
    <div className="flex h-full flex-col font-mono text-[10px]">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-[9px] text-muted-foreground">
        <Code2 className="size-3" />
        faq.md
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <div className="rounded-sm bg-foreground/4 px-2 py-0.5 text-muted-foreground">
          {"  ## Pricing"}
        </div>
        <div className="rounded-sm bg-foreground/10 px-2 py-0.5 line-through opacity-60">
          - Free forever for teams
        </div>
        <div className="rounded-sm bg-foreground/10 px-2 py-0.5">
          + Free for solo · Pro from $29
        </div>
        <div className="rounded-sm bg-foreground/4 px-2 py-0.5 text-muted-foreground">
          {"  Contact sales for Enterprise"}
        </div>
      </div>
    </div>
  );
}

export function DeliveryMapCard() {
  const [pin, setPin] = useState(0);

  useAnimatedInterval(() => setPin((p) => (p + 1) % 3), 1400);

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-3">
      <div className="relative z-10 flex items-center gap-2">
        <MapPin className="size-3.5" />
        <span className="text-[11px] font-medium">Route planner</span>
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-size-[28px_28px] text-foreground opacity-[0.06]"
      />
      <svg className="absolute inset-0 size-full" aria-hidden>
        <path
          d="M 40 160 C 90 120, 140 180, 200 100 S 280 40, 340 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          className="text-foreground/40"
        />
      </svg>
      {[
        { x: "12%", y: "62%" },
        { x: "48%", y: "38%" },
        { x: "78%", y: "28%" },
      ].map((pos, i) => (
        <span
          key={i}
          className={cn(
            "absolute z-10 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[8px] transition-all",
            i === pin
              ? "scale-110 border-foreground bg-foreground text-background"
              : "border-border bg-background text-muted-foreground"
          )}
          style={{ left: pos.x, top: pos.y }}
        >
          {i + 1}
        </span>
      ))}
      <p className="relative z-10 mt-auto font-mono text-[9px] text-muted-foreground">
        3 stops · ETA 42m
      </p>
    </div>
  );
}

export function CrmUpdateCard() {
  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium">HubSpot · deal</span>
        <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground uppercase">
          updated
        </span>
      </div>
      <div className="rounded-md border border-border/60 p-2.5">
        <p className="text-[12px] font-medium">Northwind · Expansion</p>
        <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
          $48,000 · Stage: Proposal
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full w-[68%] rounded-full bg-foreground transition-all"
            style={{ animation: "agent-grow 2.4s ease-in-out infinite" }}
          />
        </div>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground">
        Next step set · demo booked
      </p>
    </div>
  );
}

export function ResearchNotesCard() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Search className="size-3.5" />
        <span className="text-[11px] font-medium">Research brief</span>
      </div>
      <div className="flex flex-col gap-1.5 text-[10px]">
        {[
          "Competitor A ships usage-based only",
          "3 buyers asked for SSO in trials",
          "Pricing page bounce −12% after rewrite",
        ].map((note, i) => (
          <div
            key={note}
            className="flex gap-2 rounded-md border border-border/50 bg-muted/20 px-2 py-1.5"
            style={{
              animation: "agent-fade-in 0.6s ease both",
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <span className="font-mono text-muted-foreground">{i + 1}.</span>
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationStackCard() {
  const notes = [
    { title: "PR checks passed", time: "now" },
    { title: "Email sent to Maya", time: "1m" },
    { title: "Meeting booked Tue", time: "3m" },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-1.5 p-3">
      {notes.map((note, i) => (
        <div
          key={note.title}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/90 px-2.5 py-2 shadow-sm backdrop-blur"
          style={{
            transform: `translateY(${i * -2}px) scale(${1 - i * 0.03})`,
            opacity: 1 - i * 0.15,
            animation: "agent-slide-up 2.8s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        >
          <span className="grid size-5 place-items-center rounded-md bg-foreground/5">
            <Bot className="size-3" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium">{note.title}</p>
            <p className="font-mono text-[8px] text-muted-foreground">
              {note.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentThinkingCard() {
  const steps = [
    "Read brief",
    "Gather sources",
    "Draft reply",
    "Ask for confirm",
  ];
  const [active, setActive] = useState(0);

  useAnimatedInterval(() => {
    setActive((a) => (a + 1) % steps.length);
  }, 1500, [steps.length]);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <Bot className="size-3.5" />
        <span className="text-[11px] font-medium">Agent loop</span>
        <TypingDots />
      </div>
      <div className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <div
            key={step}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]",
              i === active && "bg-foreground/5",
              i < active && "text-muted-foreground"
            )}
          >
            {i < active ? (
              <Check className="size-3" />
            ) : i === active ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <span className="size-3 rounded-full border border-border" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpreadsheetCard() {
  const rows = [
    ["SKU", "Qty", "Cost"],
    ["NB-01", "12", "48"],
    ["PN-04", "40", "22"],
    ["MK-09", "6", "90"],
  ];

  return (
    <div className="flex h-full flex-col p-2.5">
      <div className="mb-2 flex items-center gap-2 px-0.5 text-[11px] font-medium">
        Order sheet
        <span className="ml-auto font-mono text-[9px] text-muted-foreground">
          live
        </span>
      </div>
      <div className="grid flex-1 grid-cols-3 overflow-hidden rounded-md border border-border/60 font-mono text-[9px]">
        {rows.flatMap((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={cn(
                "border-r border-b border-border/50 px-2 py-1.5 last:border-r-0",
                ri === 0 && "bg-muted/40 font-medium text-muted-foreground",
                ri === 2 && ci === 1 && "bg-foreground/5"
              )}
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SlackChannelCard() {
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const animated = useContext(StageAnimationContext);

  useEffect(() => {
    if (!animated) return;
    const full =
      "Linked the PR + updated the FAQ. Ready for review @jordan";
    let i = 0;
    let phase: "type" | "hold" | "clear" = "type";
    const id = window.setInterval(() => {
      if (phase === "type") {
        setTyping(true);
        i += 2;
        setDraft(full.slice(0, i));
        if (i >= full.length) phase = "hold";
      } else if (phase === "hold") {
        setTyping(false);
        phase = "clear";
      } else {
        setDraft("");
        i = 0;
        phase = "type";
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [animated]);

  return (
    <div className="flex h-full flex-col text-[10px]">
      <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2">
        <Hash className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold">product</span>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">
          128 members
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-2.5">
        <div className="flex gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-foreground/10 text-[8px] font-semibold">
            MY
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold">maya</span>
              <span className="font-mono text-[8px] text-muted-foreground">
                9:41 AM
              </span>
            </div>
            <p className="text-muted-foreground">
              @crazp can you push the FAQ update and ping me here?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-foreground text-[8px] font-semibold text-background">
            AI
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold">crazp</span>
              <span className="rounded-sm bg-foreground/10 px-1 font-mono text-[7px] uppercase">
                app
              </span>
              <span className="font-mono text-[8px] text-muted-foreground">
                9:42 AM
              </span>
            </div>
            <p className="text-muted-foreground">
              On it — drafting the FAQ patch and opening the PR.
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-border/70 px-1.5 py-0.5 text-[8px] text-muted-foreground">
              <ThumbsUp className="size-2.5" /> 2
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 px-2.5 py-2">
        <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {draft || (typing ? "" : "Message #product")}
            {typing ? (
              <span className="ml-px inline-block h-3 w-px animate-pulse bg-foreground align-middle" />
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LinearIssueCard() {
  const [status, setStatus] = useState(0);
  const statuses = ["Backlog", "In Progress", "In Review", "Done"];

  useAnimatedInterval(() => {
    setStatus((s) => (s + 1) % statuses.length);
  }, 1800, [statuses.length]);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-muted-foreground">
          CRA-184
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase",
            status === 3
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground"
          )}
        >
          {statuses[status]}
        </span>
      </div>
      <p className="text-[11px] font-medium leading-snug">
        Agent-authored FAQ refresh for pricing page
      </p>
      <div className="mt-auto flex flex-wrap gap-1">
        {["docs", "agent", "P1"].map((tag) => (
          <span
            key={tag}
            className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border/60 pt-2 text-[9px] text-muted-foreground">
        <span className="grid size-4 place-items-center rounded-full bg-foreground/10 text-[7px] font-medium text-foreground">
          AI
        </span>
        Assigned to crazp
      </div>
    </div>
  );
}

export function NotionPageCard() {
  const [lines, setLines] = useState(1);

  useAnimatedInterval(() => {
    setLines((n) => (n >= 4 ? 1 : n + 1));
  }, 1400);

  const blocks = [
    "Pricing FAQ",
    "What’s included in Pro?",
    "SSO, seats, and priority support.",
    "Can we start free?",
  ];

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <FileText className="size-3.5" />
        <span className="text-[11px] font-medium">Notion · draft</span>
        <PulseDot className="ml-auto" />
      </div>
      <div className="flex flex-col gap-1.5">
        {blocks.slice(0, lines).map((block, i) => (
          <div
            key={block}
            className={cn(
              "rounded-md px-2 py-1.5 text-[10px]",
              i === 0
                ? "bg-foreground/5 text-[12px] font-semibold"
                : "border border-border/50 text-muted-foreground"
            )}
          >
            {block}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoardCard() {
  const columns = [
    { name: "Todo", count: 3 },
    { name: "Doing", count: 1 },
    { name: "Done", count: 4 },
  ];
  const [col, setCol] = useState(0);

  useAnimatedInterval(() => {
    setCol((c) => (c + 1) % 3);
  }, 1600);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Kanban className="size-3.5" />
        <span className="text-[11px] font-medium">Board · Sprint 12</span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {columns.map((column, i) => (
          <div
            key={column.name}
            className="flex flex-col gap-1 rounded-md border border-border/50 bg-muted/20 p-1.5"
          >
            <span className="font-mono text-[8px] text-muted-foreground uppercase">
              {column.name}
            </span>
            <div
              className={cn(
                "rounded-sm border px-1.5 py-2 text-[8px] leading-tight transition-colors",
                i === col
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/60 bg-background text-muted-foreground"
              )}
            >
              FAQ update
            </div>
            <div className="h-6 rounded-sm border border-dashed border-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApprovalGateCard() {
  const [waiting, setWaiting] = useState(true);

  useAnimatedInterval(() => setWaiting((w) => !w), 2200);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <Bot className="size-3.5" />
        <span className="text-[11px] font-medium">Needs approval</span>
      </div>
      <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
        <p className="text-[10px] font-medium">Send contract to Acme?</p>
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          attachment · acme-msa-v3.pdf
        </p>
      </div>
      <div className="mt-auto flex gap-1.5">
        <span
          className={cn(
            "flex-1 rounded-md border py-1.5 text-center text-[9px] font-medium transition-colors",
            waiting
              ? "border-border text-muted-foreground"
              : "border-foreground bg-foreground text-background"
          )}
        >
          {waiting ? "Approve" : "Approved"}
        </span>
        <span className="flex-1 rounded-md border border-border py-1.5 text-center text-[9px] text-muted-foreground">
          Reject
        </span>
      </div>
    </div>
  );
}

export function DatabaseQueryCard() {
  const [running, setRunning] = useState(true);

  useAnimatedInterval(() => setRunning((r) => !r), 2000);

  return (
    <div className="flex h-full flex-col font-mono text-[10px]">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-[9px] text-muted-foreground">
        <Database className="size-3" />
        query · production
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <span className="text-muted-foreground">SELECT count(*) FROM</span>
        <span>trials WHERE plan = &apos;pro&apos;</span>
        <span className="text-muted-foreground">AND created_at &gt; now() - 7;</span>
        <div className="mt-auto flex items-center gap-1.5 border-t border-border/50 pt-2 text-[9px]">
          {running ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              <span className="text-muted-foreground">running…</span>
            </>
          ) : (
            <>
              <Check className="size-3" />
              <span>1 row · 42ms · 1,284</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MeetingNotesCard() {
  const notes = [
    "Maya: need SSO before Q3 close",
    "Agent: draft security addendum",
    "Jordan: share pricing FAQ link",
  ];
  const [count, setCount] = useState(1);

  useAnimatedInterval(() => {
    setCount((c) => (c >= notes.length ? 1 : c + 1));
  }, 1500, [notes.length]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Mic className="size-3.5" />
        <span className="text-[11px] font-medium">Live notes</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[8px] text-muted-foreground">
          <PulseDot />
          recording
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {notes.slice(0, count).map((note) => (
          <div
            key={note}
            className="rounded-md border border-border/50 px-2 py-1.5 text-[10px] text-muted-foreground"
          >
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CiPipelineCard() {
  const steps = ["Install", "Lint", "Test", "Deploy"];
  const [step, setStep] = useState(0);

  useAnimatedInterval(() => {
    setStep((s) => (s + 1) % (steps.length + 1));
  }, 1200, [steps.length]);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <GitBranch className="size-3.5" />
        <span className="text-[11px] font-medium">CI · main</span>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">
          #2048
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md border border-border/50 px-2 py-1.5 text-[10px]"
          >
            {i < step ? (
              <CheckCircle2 className="size-3" />
            ) : i === step ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <span className="size-3 rounded-full border border-border" />
            )}
            <span className={i > step ? "text-muted-foreground" : undefined}>
              {label}
            </span>
            <span className="ml-auto font-mono text-[8px] text-muted-foreground">
              {i < step ? "pass" : i === step ? "run" : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FileSearchCard() {
  const hits = [
    "apps/web/pricing/faq.md",
    "packages/docs/sso.md",
    "skills/support/SKILL.md",
  ];
  const [q, setQ] = useState("");

  const animated = useContext(StageAnimationContext);

  useEffect(() => {
    if (!animated) return;
    const full = "pricing faq sso";
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % (full.length + 8);
      setQ(full.slice(0, Math.min(i, full.length)));
    }, 160);
    return () => window.clearInterval(id);
  }, [animated]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-2 py-1.5">
        <Search className="size-3 text-muted-foreground" />
        <span className="font-mono text-[10px]">
          {q}
          <span className="ml-px inline-block h-3 w-px animate-pulse bg-foreground align-middle" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {hits.map((hit, i) => (
          <div
            key={hit}
            className={cn(
              "truncate rounded-md px-2 py-1.5 font-mono text-[9px]",
              i === 0 ? "bg-foreground/5 text-foreground" : "text-muted-foreground"
            )}
          >
            {hit}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VoiceTranscriptCard() {
  const [line, setLine] = useState(0);
  const lines = [
    "Customer: Can you book a demo?",
    "Agent: Sure — Tuesday 10 works?",
    "Customer: Perfect, send an invite.",
  ];

  useAnimatedInterval(() => {
    setLine((l) => (l + 1) % lines.length);
  }, 1800, [lines.length]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Mic className="size-3.5" />
        <span className="text-[11px] font-medium">Voice call</span>
        <span className="ml-auto font-mono text-[8px] text-muted-foreground">
          04:12
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {lines.map((text, i) => (
          <p
            key={text}
            className={cn(
              "rounded-md px-2 py-1.5 text-[10px] transition-opacity",
              i === line
                ? "bg-foreground/5 opacity-100"
                : "opacity-35 text-muted-foreground"
            )}
          >
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}

export function FlightBookCard() {
  const [booked, setBooked] = useState(false);

  useAnimatedInterval(() => setBooked((b) => !b), 2400);

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2">
        <Plane className="size-3.5" />
        <span className="text-[11px] font-medium">Travel · SFO → JFK</span>
      </div>
      <div className="rounded-md border border-border/60 p-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium">Tue · 8:15a</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">4:42p</span>
        </div>
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          UA 455 · economy · $318
        </p>
      </div>
      <div
        className={cn(
          "mt-auto rounded-md py-1.5 text-center text-[9px] font-medium transition-colors",
          booked
            ? "bg-foreground text-background"
            : "border border-border text-muted-foreground"
        )}
      >
        {booked ? "Ticket issued" : "Hold seat"}
      </div>
    </div>
  );
}

export function MetricsPulseCard() {
  const bars = [40, 65, 48, 80, 56, 72, 90, 62];
  const [hl, setHl] = useState(3);

  useAnimatedInterval(() => {
    setHl((h) => (h + 1) % bars.length);
  }, 900, [bars.length]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium">Agent runs</span>
        <span className="font-mono text-[10px]">1,284</span>
      </div>
      <div className="flex flex-1 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm transition-colors",
              i === hl ? "bg-foreground" : "bg-foreground/20"
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="font-mono text-[8px] text-muted-foreground">
        last 8h · +18% vs yesterday
      </p>
    </div>
  );
}

export function WebhookEventCard() {
  const events = [
    { name: "invoice.paid", status: "ok" },
    { name: "seat.added", status: "ok" },
    { name: "agent.completed", status: "live" },
  ];
  const [active, setActive] = useState(2);

  useAnimatedInterval(() => {
    setActive((a) => (a + 1) % events.length);
  }, 1600, [events.length]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Webhook className="size-3.5" />
        <span className="text-[11px] font-medium">Webhooks</span>
      </div>
      <div className="flex flex-col gap-1">
        {events.map((event, i) => (
          <div
            key={event.name}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2 py-1.5 font-mono text-[9px]",
              i === active
                ? "border-foreground/40 bg-foreground/5"
                : "border-border/50 text-muted-foreground"
            )}
          >
            <span className="truncate">{event.name}</span>
            <span className="ml-auto uppercase">
              {i === active ? "recv" : event.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
