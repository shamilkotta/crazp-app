"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowRight,
  Bot,
  Calendar,
  CalendarClock,
  FileText,
  GitBranch,
  Globe,
  Inbox,
  Mail,
  MessageCircle,
  MessagesSquare,
  MousePointer2,
  Search,
  Webhook,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

type NodeKind = "agent" | "decision" | "tool";

type FlowNode = {
  id: string;
  kind: NodeKind;
  title: string;
  meta?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  active?: boolean;
  Icon?: typeof Mail;
};

type FlowEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  active?: boolean;
};

/**
 * Top → bottom flow
 *
 * Triggers (row) → Agent → Reply needed?
 *   yes → Chat apps → Email → Notify
 *   no  → Need research?
 *           yes → Browse → Research → Docs
 *           no  → Code task?
 *                   yes → Code hosts
 *                   no  → Book meeting? → Calendar / CRM
 */
const INITIAL_NODES: FlowNode[] = [
  {
    id: "trigger-schedule",
    kind: "tool",
    title: "Schedule",
    meta: "cron · nightly",
    x: 6,
    y: 2,
    w: 132,
    h: 56,
    Icon: CalendarClock,
  },
  {
    id: "trigger-webhook",
    kind: "tool",
    title: "Webhook",
    meta: "event · CRM",
    x: 28,
    y: 2,
    w: 132,
    h: 56,
    Icon: Webhook,
  },
  {
    id: "trigger-inbox",
    kind: "tool",
    title: "Inbox",
    meta: "email · received",
    x: 50,
    y: 2,
    w: 132,
    h: 56,
    Icon: Inbox,
  },
  {
    id: "trigger-chat",
    kind: "tool",
    title: "Chat",
    meta: "Slack · Teams · Discord",
    x: 72,
    y: 2,
    w: 132,
    h: 56,
    active: true,
    Icon: MessagesSquare,
  },
  {
    id: "agent",
    kind: "agent",
    title: "Agent",
    meta: "Brain",
    x: 40,
    y: 14,
    w: 148,
    h: 100,
    active: true,
    Icon: Bot,
  },
  {
    id: "decide-reply",
    kind: "decision",
    title: "Reply needed?",
    x: 42,
    y: 30,
    w: 112,
    h: 36,
    active: true,
  },
  {
    id: "chat-reply",
    kind: "tool",
    title: "Chat apps",
    meta: "Slack · Teams · …",
    x: 8,
    y: 42,
    w: 140,
    h: 56,
    active: true,
    Icon: MessagesSquare,
  },
  {
    id: "email",
    kind: "tool",
    title: "Email",
    meta: "send · follow-up",
    x: 8,
    y: 56,
    w: 140,
    h: 56,
    active: true,
    Icon: Mail,
  },
  {
    id: "messages",
    kind: "tool",
    title: "Notify",
    meta: "push · SMS · chat",
    x: 8,
    y: 70,
    w: 140,
    h: 56,
    active: true,
    Icon: MessageCircle,
  },
  {
    id: "decide-research",
    kind: "decision",
    title: "Need research?",
    x: 42,
    y: 42,
    w: 118,
    h: 36,
  },
  {
    id: "browse",
    kind: "tool",
    title: "Browse",
    meta: "open · sources",
    x: 36,
    y: 54,
    w: 132,
    h: 56,
    Icon: Globe,
  },
  {
    id: "research",
    kind: "tool",
    title: "Research",
    meta: "synthesize · notes",
    x: 36,
    y: 68,
    w: 140,
    h: 56,
    Icon: Search,
  },
  {
    id: "docs",
    kind: "tool",
    title: "Docs",
    meta: "Notion · Drive · …",
    x: 36,
    y: 82,
    w: 140,
    h: 56,
    Icon: FileText,
  },
  {
    id: "decide-code",
    kind: "decision",
    title: "Code task?",
    x: 68,
    y: 54,
    w: 100,
    h: 36,
  },
  {
    id: "github",
    kind: "tool",
    title: "Code hosts",
    meta: "GitHub · GitLab · …",
    x: 78,
    y: 66,
    w: 140,
    h: 56,
    Icon: GitBranch,
  },
  {
    id: "decide-meeting",
    kind: "decision",
    title: "Book meeting?",
    x: 68,
    y: 78,
    w: 116,
    h: 36,
  },
  {
    id: "calendar",
    kind: "tool",
    title: "Calendar",
    meta: "Google · Outlook · …",
    x: 54,
    y: 90,
    w: 140,
    h: 56,
    Icon: Calendar,
  },
  {
    id: "crm",
    kind: "tool",
    title: "CRM",
    meta: "HubSpot · Salesforce",
    x: 76,
    y: 90,
    w: 140,
    h: 56,
    Icon: FileText,
  },
];

const EDGES: FlowEdge[] = [
  // Invocations into the brain
  { id: "in1", from: "trigger-schedule", to: "agent", label: "run" },
  { id: "in2", from: "trigger-webhook", to: "agent", label: "event" },
  { id: "in3", from: "trigger-inbox", to: "agent", label: "mail" },
  { id: "in4", from: "trigger-chat", to: "agent", label: "ping", active: true },

  // Route work after invoke
  { id: "e1", from: "agent", to: "decide-reply", active: true },
  {
    id: "e2",
    from: "decide-reply",
    to: "chat-reply",
    label: "yes",
    active: true,
  },
  { id: "e3", from: "chat-reply", to: "email", label: "then", active: true },
  { id: "e4", from: "email", to: "messages", label: "notify", active: true },
  { id: "e5", from: "decide-reply", to: "decide-research", label: "no" },
  { id: "e6", from: "decide-research", to: "browse", label: "yes" },
  { id: "e7", from: "browse", to: "research", label: "then" },
  { id: "e8", from: "research", to: "docs", label: "write" },
  { id: "e9", from: "decide-research", to: "decide-code", label: "no" },
  { id: "e10", from: "decide-code", to: "github", label: "yes" },
  { id: "e11", from: "decide-code", to: "decide-meeting", label: "no" },
  { id: "e12", from: "decide-meeting", to: "calendar", label: "yes" },
  { id: "e13", from: "decide-meeting", to: "crm", label: "else" },
];

const NODE_CUES: Record<string, string> = {
  "trigger-schedule": "Cron just fired",
  "trigger-webhook": "Incoming webhook",
  "trigger-inbox": "New mail landed",
  "trigger-chat": "Mention in chat",
  agent: "Agent taking over…",
  "decide-reply": "Should we reply?",
  "chat-reply": "Drafting in chat",
  email: "Sending follow-up",
  messages: "Notifying owner",
  "decide-research": "Need more context?",
  browse: "Opening sources",
  research: "Synthesizing notes",
  docs: "Writing the brief",
  "decide-code": "Is this a code task?",
  github: "Opening a PR",
  "decide-meeting": "Book a call?",
  calendar: "Scheduling time",
  crm: "Updating the record",
};

function StatusCue({
  label,
  visible,
  variant = "a",
}: {
  label: string;
  visible: boolean;
  variant?: "a" | "b";
}) {
  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-start",
        variant === "a" ? "crazp-cue-a" : "crazp-cue-b"
      )}
    >
      <span
        className={cn(
          "mb-0.5 ml-3 border border-foreground bg-foreground px-2 py-0.5 text-[9px] font-medium whitespace-nowrap text-background transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {label}
      </span>
      <MousePointer2
        aria-hidden
        className="size-3.5 shrink-0 text-foreground"
        strokeWidth={1.5}
      />
    </div>
  );
}

function pickNextNodeId(nodes: FlowNode[], avoid: string[]) {
  const pool = nodes.filter((n) => !avoid.includes(n.id));
  const list = pool.length > 0 ? pool : nodes;
  return list[Math.floor(Math.random() * list.length)]!.id;
}

function nodeAnchor(node: FlowNode) {
  return {
    left: `calc(${node.x}% + ${node.w * 0.55}px)`,
    top: `calc(${node.y}% + ${node.h * 0.35}px)`,
  };
}

function MiniNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center border border-current/25 bg-background/60 backdrop-blur">
            <Bot className="size-4" />
          </span>
          <span>crazp</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden border border-current/15 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
            Waitlist open
          </span>
        </div>
      </div>
    </header>
  );
}

function WaitlistForm() {
  return (
    <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        placeholder="Enter your email"
        aria-label="Email address"
        className="h-11 rounded-none border-border bg-background/85 text-sm shadow-none backdrop-blur"
      />
      <Button type="submit" className="h-11 rounded-none px-5">
        Join waitlist
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

function portPoint(
  node: FlowNode,
  side: "top" | "bottom",
  containerW: number,
  containerH: number
) {
  const x = (node.x / 100) * containerW + node.w / 2;
  const y =
    side === "top"
      ? (node.y / 100) * containerH
      : (node.y / 100) * containerH + node.h;
  return { x, y };
}

function curvePath(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const dy = Math.max(36, Math.abs(to.y - from.y) * 0.45);
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy} ${to.x} ${to.y - dy} ${to.x} ${to.y}`;
}

function midpoint(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  return {
    x: (from.x + to.x) / 2 + 10,
    y: (from.y + to.y) / 2,
  };
}

function WorkflowCanvas({ interactive = true }: { interactive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const nodesRef = useRef(nodes);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [cursors, setCursors] = useState(() => [
    {
      id: "cue-a" as const,
      nodeId: "agent",
      parked: true,
      variant: "a" as const,
    },
    {
      id: "cue-b" as const,
      nodeId: "trigger-chat",
      parked: true,
      variant: "b" as const,
    },
  ]);
  const cursorsRef = useRef(cursors);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    cursorsRef.current = cursors;
  }, [cursors]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const dwellMs = (index: number) => 2400 + index * 700 + Math.random() * 900;
    const travelMs = () => 900 + Math.random() * 500;

    const scheduleMove = (index: number, delay: number) => {
      const timer = window.setTimeout(() => {
        if (cancelled) return;

        setCursors((prev) => {
          const current = prev[index];
          if (!current) return prev;
          const otherIds = prev
            .filter((_, i) => i !== index)
            .map((c) => c.nodeId);
          const nextId = pickNextNodeId(nodesRef.current, [
            current.nodeId,
            ...otherIds,
          ]);
          const next = prev.map((c, i) =>
            i === index ? { ...c, nodeId: nextId, parked: false } : c
          );
          cursorsRef.current = next;
          return next;
        });

        const moveTimer = window.setTimeout(() => {
          if (cancelled) return;
          setCursors((prev) => {
            const next = prev.map((c, i) =>
              i === index ? { ...c, parked: true } : c
            );
            cursorsRef.current = next;
            return next;
          });
          scheduleMove(index, dwellMs(index));
        }, travelMs());

        timers.push(moveTimer);
      }, delay);

      timers.push(timer);
    };

    scheduleMove(0, 1200);
    scheduleMove(1, 2800);

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, node: FlowNode) {
    if (!interactive || !containerRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left - (node.x / 100) * rect.width,
      y: event.clientY - rect.top - (node.y / 100) * rect.height,
    };
    setDragId(node.id);

    const onMove = (moveEvent: PointerEvent) => {
      const canvas = containerRef.current;
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      const current = nodesRef.current.find((n) => n.id === node.id);
      if (!current) return;

      const nextX =
        ((moveEvent.clientX - box.left - dragOffset.current.x) / box.width) *
        100;
      const nextY =
        ((moveEvent.clientY - box.top - dragOffset.current.y) / box.height) *
        100;
      const maxX = ((box.width - current.w) / box.width) * 100;
      const maxY = ((box.height - current.h) / box.height) * 100;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? {
                ...n,
                x: Math.min(Math.max(0, nextX), maxX),
                y: Math.min(Math.max(0, nextY), maxY),
              }
            : n
        )
      );
    };

    const onUp = () => {
      setDragId(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-[420px] w-full select-none",
        interactive ? "touch-none" : "pointer-events-none"
      )}
      aria-hidden={!interactive}
      aria-label={interactive ? "Interactive agent workflow canvas" : undefined}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 4%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
        maskComposite: "intersect",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 4%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskComposite: "source-in",
      }}
    >
      <style>{`
        @keyframes crazp-pulse-dot {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes crazp-cue-a {
          0%, 100% { transform: translate(0, 0); opacity: 0.9; }
          45% { transform: translate(-8px, -12px); opacity: 1; }
        }
        @keyframes crazp-cue-b {
          0%, 100% { transform: translate(0, 0); opacity: 0.85; }
          50% { transform: translate(10px, -9px); opacity: 1; }
        }
        .crazp-pulse-dot {
          animation: crazp-pulse-dot 1.8s ease-in-out infinite;
        }
        .crazp-cue-a {
          animation: crazp-cue-a 3.6s ease-in-out infinite;
        }
        .crazp-cue-b {
          animation: crazp-cue-b 4.2s ease-in-out infinite;
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[18px_18px] text-foreground opacity-[0.08]"
      />

      {size.w > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0 size-full text-foreground"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          {EDGES.map((edge) => {
            const fromNode = byId[edge.from];
            const toNode = byId[edge.to];
            if (!fromNode || !toNode) return null;
            const from = portPoint(fromNode, "bottom", size.w, size.h);
            const to = portPoint(toNode, "top", size.w, size.h);
            const d = curvePath(from, to);
            const mid = midpoint(from, to);
            return (
              <g key={edge.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={edge.active ? 1.6 : 1.2}
                  strokeOpacity={edge.active ? 0.7 : 0.22}
                  strokeDasharray={edge.active ? undefined : "5 6"}
                />
                {edge.label ? (
                  <foreignObject
                    x={mid.x - 22}
                    y={mid.y - 9}
                    width={44}
                    height={18}
                  >
                    <div
                      className={cn(
                        "grid h-full place-items-center bg-background/90 font-mono text-[8px] tracking-[0.08em]",
                        edge.active
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {edge.label}
                    </div>
                  </foreignObject>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      {nodes.map((node) => {
        const Icon = node.Icon;
        const dragging = interactive && dragId === node.id;
        return (
          <div
            key={node.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-grabbed={interactive ? dragging : undefined}
            aria-label={interactive ? `Drag ${node.title}` : undefined}
            onPointerDown={
              interactive ? (event) => startDrag(event, node) : undefined
            }
            className={cn(
              "absolute z-10 bg-foreground/[0.045] backdrop-blur-md",
              interactive && "cursor-grab touch-none active:cursor-grabbing",
              node.kind === "decision"
                ? "px-3 py-2 font-mono text-[10px] tracking-tight"
                : "px-3 py-2.5",
              node.active ? "opacity-100" : "opacity-70",
              dragging &&
                "z-30 bg-foreground/[0.08] shadow-[0_16px_48px_-20px_rgba(0,0,0,0.65)]"
            )}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.w,
              minHeight: node.h,
            }}
          >
            <span
              aria-hidden
              className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 bg-foreground/45"
            />
            <span
              aria-hidden
              className="absolute -bottom-[3px] left-1/2 size-1.5 -translate-x-1/2 bg-foreground/45"
            />

            {node.kind === "agent" ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {Icon ? (
                      <Icon className="size-3.5" strokeWidth={1.5} />
                    ) : null}
                    <span className="text-[12px] font-medium tracking-tight">
                      {node.title}
                    </span>
                  </div>
                  <span className="font-mono text-[8px] tracking-[0.12em] text-muted-foreground uppercase">
                    {node.meta}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-[72%] bg-foreground/12" />
                  <div className="h-1.5 w-[54%] bg-foreground/8" />
                  <div className="h-1.5 w-[63%] bg-foreground/8" />
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="crazp-pulse-dot size-1.5 bg-foreground" />
                  <span className="font-mono text-[8px] tracking-[0.1em] text-muted-foreground uppercase">
                    Routing
                  </span>
                </div>
              </>
            ) : node.kind === "decision" ? (
              node.title
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {Icon ? (
                    <Icon
                      className="size-3.5 shrink-0 text-foreground/70"
                      strokeWidth={1.5}
                    />
                  ) : null}
                  <p className="truncate text-[12px] font-medium tracking-tight">
                    {node.title}
                  </p>
                </div>
                {node.meta ? (
                  <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">
                    {node.meta}
                  </p>
                ) : null}
              </>
            )}
          </div>
        );
      })}

      {cursors.map((cue) => {
        const target = byId[cue.nodeId];
        if (!target) return null;
        const anchor = nodeAnchor(target);
        const label = NODE_CUES[cue.nodeId] ?? target.title;
        return (
          <div
            key={cue.id}
            aria-hidden
            className="pointer-events-none absolute z-40 transition-[left,top] duration-1000 ease-in-out"
            style={{
              left: anchor.left,
              top: anchor.top,
            }}
          >
            <StatusCue
              label={label}
              visible={cue.parked}
              variant={cue.variant}
            />
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowLandingPage() {
  return (
    <div className="relative h-svh overflow-hidden bg-background text-foreground">
      <MiniNav />

      {/* Mobile: same workflow as atmosphere behind copy */}
      <div
        className="pointer-events-none absolute inset-0 pt-16 lg:hidden"
        aria-hidden
      >
        <WorkflowCanvas interactive={false} />
        <div className="absolute inset-0 bg-background/75" />
      </div>

      <main className="relative grid h-full lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="relative z-10 flex items-center px-4 pt-16 sm:px-6 lg:px-8 lg:pr-4">
          <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-2xl lg:pl-[max(0px,calc((100vw-80rem)/2))]">
            <h1 className="text-5xl leading-[0.97] font-semibold tracking-tight sm:text-7xl">
              Shape an agent. Let it roam.
            </h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
              Tune how it thinks and what it can reach. Then set it loose on
              whatever you need done.
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>

        <div className="relative hidden h-full overflow-hidden pt-16 lg:block">
          <WorkflowCanvas interactive />
        </div>
      </main>
    </div>
  );
}
