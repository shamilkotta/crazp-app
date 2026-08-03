"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate, cubicBezier, motion, useReducedMotion } from "motion/react";
import { Bot, Component, MousePointer2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  AgentThinkingCard,
  ApprovalGateCard,
  BrowserAgentCard,
  CalendarBookCard,
  ChatInterfaceCard,
  CiPipelineCard,
  CodeEditorCard,
  CrmUpdateCard,
  DatabaseQueryCard,
  DeliveryMapCard,
  DiffViewCard,
  EmailComposeCard,
  FileSearchCard,
  FlightBookCard,
  InboxTriageCard,
  KanbanBoardCard,
  LinearIssueCard,
  MeetingNotesCard,
  MetricsPulseCard,
  NotificationStackCard,
  NotionPageCard,
  OrderFlowCard,
  PullRequestCard,
  ResearchNotesCard,
  SlackChannelCard,
  SlackThreadCard,
  SpreadsheetCard,
  TerminalCard,
  VoiceTranscriptCard,
  WebhookEventCard,
} from "./cards";

const CANVAS_W = 2060;
const CANVAS_H = 1420;

type StageCard = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  node: ReactNode;
};

const CARDS: StageCard[] = [
  {
    id: "chat",
    title: "chat-interface.tsx",
    x: 16,
    y: 16,
    w: 320,
    h: 240,
    node: <ChatInterfaceCard />,
  },
  {
    id: "browser",
    title: "browser-agent.tsx",
    x: 16,
    y: 272,
    w: 330,
    h: 250,
    node: <BrowserAgentCard />,
  },
  {
    id: "inbox",
    title: "inbox-triage.tsx",
    x: 16,
    y: 538,
    w: 320,
    h: 230,
    node: <InboxTriageCard />,
  },
  {
    id: "crm",
    title: "crm-update.tsx",
    x: 16,
    y: 784,
    w: 320,
    h: 220,
    node: <CrmUpdateCard />,
  },
  {
    id: "route",
    title: "route-planner.tsx",
    x: 16,
    y: 1020,
    w: 330,
    h: 230,
    node: <DeliveryMapCard />,
  },
  {
    id: "code",
    title: "code-editor.tsx",
    x: 362,
    y: 48,
    w: 340,
    h: 230,
    node: <CodeEditorCard />,
  },
  {
    id: "pr",
    title: "pull-request.tsx",
    x: 362,
    y: 294,
    w: 330,
    h: 250,
    node: <PullRequestCard />,
  },
  {
    id: "diff",
    title: "diff-view.tsx",
    x: 362,
    y: 560,
    w: 330,
    h: 210,
    node: <DiffViewCard />,
  },
  {
    id: "terminal",
    title: "agent-shell.tsx",
    x: 362,
    y: 786,
    w: 330,
    h: 210,
    node: <TerminalCard />,
  },
  {
    id: "sheet",
    title: "order-sheet.tsx",
    x: 362,
    y: 1012,
    w: 330,
    h: 230,
    node: <SpreadsheetCard />,
  },
  {
    id: "email",
    title: "email-compose.tsx",
    x: 708,
    y: 16,
    w: 330,
    h: 250,
    node: <EmailComposeCard />,
  },
  {
    id: "slack",
    title: "slack-channel.tsx",
    x: 708,
    y: 282,
    w: 330,
    h: 260,
    node: <SlackChannelCard />,
  },
  {
    id: "calendar",
    title: "calendar-book.tsx",
    x: 708,
    y: 558,
    w: 320,
    h: 230,
    node: <CalendarBookCard />,
  },
  {
    id: "order",
    title: "order-flow.tsx",
    x: 708,
    y: 804,
    w: 330,
    h: 250,
    node: <OrderFlowCard />,
  },
  {
    id: "notify",
    title: "notifications.tsx",
    x: 708,
    y: 1070,
    w: 320,
    h: 210,
    node: <NotificationStackCard />,
  },
  {
    id: "research",
    title: "research-brief.tsx",
    x: 1054,
    y: 48,
    w: 330,
    h: 230,
    node: <ResearchNotesCard />,
  },
  {
    id: "thinking",
    title: "agent-loop.tsx",
    x: 1054,
    y: 294,
    w: 320,
    h: 230,
    node: <AgentThinkingCard />,
  },
  {
    id: "linear",
    title: "linear-issue.tsx",
    x: 1054,
    y: 540,
    w: 330,
    h: 230,
    node: <LinearIssueCard />,
  },
  {
    id: "notion",
    title: "notion-page.tsx",
    x: 1054,
    y: 786,
    w: 330,
    h: 240,
    node: <NotionPageCard />,
  },
  {
    id: "kanban",
    title: "kanban-board.tsx",
    x: 1054,
    y: 1042,
    w: 330,
    h: 240,
    node: <KanbanBoardCard />,
  },
  {
    id: "approval",
    title: "approval-gate.tsx",
    x: 1400,
    y: 16,
    w: 330,
    h: 240,
    node: <ApprovalGateCard />,
  },
  {
    id: "db",
    title: "db-query.sql",
    x: 1400,
    y: 272,
    w: 330,
    h: 240,
    node: <DatabaseQueryCard />,
  },
  {
    id: "meeting",
    title: "meeting-notes.tsx",
    x: 1400,
    y: 528,
    w: 330,
    h: 240,
    node: <MeetingNotesCard />,
  },
  {
    id: "ci",
    title: "ci-pipeline.tsx",
    x: 1400,
    y: 784,
    w: 330,
    h: 250,
    node: <CiPipelineCard />,
  },
  {
    id: "search",
    title: "file-search.tsx",
    x: 1400,
    y: 1050,
    w: 330,
    h: 230,
    node: <FileSearchCard />,
  },
  {
    id: "voice",
    title: "voice-call.tsx",
    x: 1746,
    y: 48,
    w: 300,
    h: 240,
    node: <VoiceTranscriptCard />,
  },
  {
    id: "flight",
    title: "flight-book.tsx",
    x: 1746,
    y: 304,
    w: 300,
    h: 230,
    node: <FlightBookCard />,
  },
  {
    id: "metrics",
    title: "metrics-pulse.tsx",
    x: 1746,
    y: 550,
    w: 300,
    h: 230,
    node: <MetricsPulseCard />,
  },
  {
    id: "webhook",
    title: "webhook-events.tsx",
    x: 1746,
    y: 796,
    w: 300,
    h: 230,
    node: <WebhookEventCard />,
  },
  {
    id: "slack-thread",
    title: "slack-thread.tsx",
    x: 1746,
    y: 1042,
    w: 300,
    h: 230,
    node: <SlackThreadCard />,
  },
];

const FOCUS_INTERVAL_MS = 4200;
const START_INDEX = Math.max(
  0,
  CARDS.findIndex((card) => card.id === "slack")
);
const MIN_HOP_DISTANCE = 520;

const CARD_CUES: Record<string, string> = {
  chat: "Drafting a reply…",
  browser: "Browsing sources",
  inbox: "Triaging inbox",
  crm: "Updating the deal",
  route: "Planning the route",
  code: "Writing code",
  pr: "Opening a PR",
  diff: "Reviewing the diff",
  terminal: "Running deploy",
  sheet: "Filling the sheet",
  email: "Composing email",
  slack: "Typing in Slack",
  calendar: "Booking a slot",
  order: "Placing an order",
  notify: "Sending updates",
  research: "Synthesizing notes",
  thinking: "Planning next step",
  linear: "Updating Linear",
  notion: "Writing Notion page",
  kanban: "Moving the card",
  approval: "Waiting on you",
  db: "Running a query",
  meeting: "Taking live notes",
  ci: "Watching CI",
  search: "Searching files",
  voice: "On a voice call",
  flight: "Booking travel",
  metrics: "Checking metrics",
  webhook: "Receiving events",
  "slack-thread": "Replying in thread",
};

function cardAnchor(card: StageCard) {
  return {
    left: card.x + card.w * 0.58,
    top: card.y + card.h * 0.38,
  };
}

function StatusCue({ label, visible }: { label: string; visible: boolean }) {
  return (
    <div className="agent-cue relative inline-flex flex-col items-start">
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

const hopDistance = (a: number, b: number) => {
  const ca = CARDS[a]!;
  const cb = CARDS[b]!;
  return Math.hypot(
    ca.x + ca.w / 2 - cb.x - cb.w / 2,
    ca.y + ca.h / 2 - cb.y - cb.h / 2
  );
};

const clamp = (min: number, value: number, max: number) =>
  Math.min(max, Math.max(min, value));

const flightPanEase = cubicBezier(0.65, 0, 0.35, 1);
const flightDurationFor = (distance: number) =>
  clamp(1.2, 0.9 + distance / 1100, 2.4);
const flightZoomOutFor = (distance: number) =>
  clamp(0.7, 0.88 - distance * 0.00007, 0.88);

function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

function CardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border/60 bg-muted p-1 shadow-sm">
      <div className="flex h-7 shrink-0 items-center gap-1.5 px-2">
        <Component className="size-3 text-muted-foreground" strokeWidth={1.5} />
        <span className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-background">
        {children}
      </div>
    </div>
  );
}

export function AgentStage({ className }: { className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(START_INDEX);
  const [prevActive, setPrevActive] = useState(START_INDEX);
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [cueParked, setCueParked] = useState(true);
  const queueRef = useRef<number[]>([]);
  const lastPickRef = useRef(START_INDEX);
  const shownRef = useRef(START_INDEX);
  const flightRef = useRef<ReturnType<typeof animate> | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setViewport({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = window.setInterval(() => {
      if (queueRef.current.length === 0) {
        queueRef.current = shuffled(CARDS.length);
      }
      const current = lastPickRef.current;
      let pickAt = queueRef.current.findIndex(
        (i) => hopDistance(i, current) >= MIN_HOP_DISTANCE
      );
      if (pickAt === -1) {
        pickAt = queueRef.current.reduce(
          (best, i, k, queue) =>
            hopDistance(i, current) > hopDistance(queue[best]!, current)
              ? k
              : best,
          0
        );
      }
      const next = queueRef.current.splice(pickAt, 1)[0]!;
      setPrevActive(current);
      lastPickRef.current = next;
      setEngaged(true);
      setActive(next);
    }, FOCUS_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused]);

  const measured = viewport.w > 0 && viewport.h > 0;
  const scale = measured
    ? clamp(0.48, Math.min(viewport.w / 1100, viewport.h / 980), 0.85)
    : 0.65;
  const focus = CARDS[active]!;
  const prevFocus = CARDS[prevActive]!;
  const estimatedDistance = Math.hypot(
    (focus.x + focus.w / 2 - prevFocus.x - prevFocus.w / 2) * scale,
    (focus.y + focus.h / 2 - prevFocus.y - prevFocus.h / 2) * scale
  );
  const focusDelay =
    !reducedMotion && engaged ? flightDurationFor(estimatedDistance) * 0.65 : 0;
  const cueAnchor = cardAnchor(focus);
  const cueTravelMs = Math.round(
    (!reducedMotion && engaged ? flightDurationFor(estimatedDistance) : 0.9) *
      1000
  );
  const cueLabel = CARD_CUES[focus.id] ?? focus.title;

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el || !measured) return;
    const setCamera = (lookX: number, lookY: number, s: number) => {
      el.style.transform = `translate(${viewport.w / 2 - lookX * s}px, ${viewport.h / 2 - lookY * s}px) scale(${s})`;
    };
    const targetX = focus.x + focus.w / 2;
    const targetY = focus.y + focus.h / 2;

    flightRef.current?.stop();
    if (cueTimerRef.current !== null) {
      window.clearTimeout(cueTimerRef.current);
      cueTimerRef.current = null;
    }

    if (!engaged || reducedMotion || shownRef.current === active) {
      setCamera(targetX, targetY, scale);
      setCueParked(true);
    } else {
      const computed = getComputedStyle(el).transform;
      const matrix = computed !== "none" ? new DOMMatrix(computed) : null;
      const fromScale = matrix ? matrix.a : scale;
      const fromX = matrix ? (viewport.w / 2 - matrix.e) / fromScale : targetX;
      const fromY = matrix ? (viewport.h / 2 - matrix.f) / fromScale : targetY;

      const distance = Math.hypot(
        (targetX - fromX) * scale,
        (targetY - fromY) * scale
      );
      const duration = flightDurationFor(distance);
      const zoomDepth = scale * (1 - flightZoomOutFor(distance));

      setCueParked(false);
      cueTimerRef.current = window.setTimeout(() => {
        setCueParked(true);
        cueTimerRef.current = null;
      }, duration * 1000);

      flightRef.current = animate(0, 1, {
        duration,
        ease: "linear",
        onUpdate: (t) => {
          const pan = flightPanEase(t);
          const dip = Math.sin(Math.PI * t) ** 2;
          setCamera(
            fromX + (targetX - fromX) * pan,
            fromY + (targetY - fromY) * pan,
            fromScale + (scale - fromScale) * pan - zoomDepth * dip
          );
        },
      });
    }
    shownRef.current = active;

    return () => {
      if (cueTimerRef.current !== null) {
        window.clearTimeout(cueTimerRef.current);
        cueTimerRef.current = null;
      }
    };
  }, [
    active,
    focus,
    measured,
    scale,
    viewport.w,
    viewport.h,
    engaged,
    reducedMotion,
  ]);

  return (
    <div
      ref={viewportRef}
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false);
        setHovered(null);
      }}
      aria-label="Animated agent capability gallery"
    >
      <style>{`
        @keyframes agent-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes agent-grow {
          0%, 100% { width: 55%; }
          50% { width: 78%; }
        }
        @keyframes agent-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes agent-slide-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes agent-cue {
          0%, 100% { transform: translate(0, 0); opacity: 0.9; }
          45% { transform: translate(-8px, -12px); opacity: 1; }
        }
        .agent-cue {
          animation: agent-cue 3.6s ease-in-out infinite;
        }
      `}</style>

      {measured ? (
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 will-change-transform"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: "0 0",
          }}
        >
          <div
            aria-hidden
            className="absolute -inset-[1200px] bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-size-[24px_24px] text-foreground opacity-[0.08] will-change-transform"
          />

          {CARDS.map((card, index) => {
            const isFocused = index === active;
            const isLifted = isFocused || (!reducedMotion && hovered === index);
            return (
              <motion.div
                key={card.id}
                className={cn(
                  "absolute rounded-lg transition-shadow duration-500",
                  isFocused
                    ? "shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] ring-1 ring-foreground/20"
                    : "shadow-[0_10px_28px_-18px_rgba(0,0,0,0.35)]"
                )}
                style={{
                  left: card.x,
                  top: card.y,
                  width: card.w,
                  height: card.h,
                  zIndex: isFocused ? 10 : hovered === index ? 5 : 1,
                }}
                initial={false}
                animate={{
                  opacity: reducedMotion || isLifted ? 1 : 0.55,
                  scale: !reducedMotion && isFocused ? 1.05 : 1,
                }}
                transition={{
                  opacity: {
                    duration: 0.85,
                    ease: "easeInOut",
                    delay: isFocused ? focusDelay : 0,
                  },
                  scale: {
                    type: "spring",
                    stiffness: 170,
                    damping: 26,
                    delay: isFocused ? focusDelay : 0,
                  },
                }}
                onPointerEnter={() => setHovered(index)}
                onPointerLeave={() =>
                  setHovered((prev) => (prev === index ? null : prev))
                }
              >
                <CardShell title={card.title}>{card.node}</CardShell>
              </motion.div>
            );
          })}

          <div
            aria-hidden
            className="pointer-events-none absolute z-40"
            style={{
              left: cueAnchor.left,
              top: cueAnchor.top,
              transition: reducedMotion
                ? undefined
                : `left ${cueTravelMs}ms cubic-bezier(0.65, 0, 0.35, 1), top ${cueTravelMs}ms cubic-bezier(0.65, 0, 0.35, 1)`,
            }}
          >
            <StatusCue label={cueLabel} visible={cueParked} />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <Bot className="size-5 animate-pulse" />
        </div>
      )}
    </div>
  );
}
