import type { AgentListItem } from "@/lib/agents";
import { agentInitials, markHue, statusLabel } from "@/lib/display";
import { cn } from "@workspace/ui/lib/utils";

export const statusDot: Record<AgentListItem["status"], string> = {
  active: "bg-emerald-500",
  deploying: "bg-sky-500 animate-pulse",
  paused: "bg-amber-500",
  error: "bg-red-500",
  draft: "bg-zinc-400",
  archived: "bg-zinc-500",
};

export function StatusDot({
  status,
  className,
}: {
  status: AgentListItem["status"];
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        statusDot[status],
        className
      )}
    />
  );
}

export function StatusLabel({
  status,
  className,
}: {
  status: AgentListItem["status"];
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[13px]", className)}
    >
      <StatusDot status={status} />
      {statusLabel[status]}
    </span>
  );
}

export function AgentMark({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const hue = markHue(name);
  const font = size <= 20 ? 9 : size <= 28 ? 10 : 12;
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: font,
        background: `linear-gradient(145deg, oklch(0.58 0.13 ${hue}), oklch(0.4 0.1 ${hue + 28}))`,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
    >
      {agentInitials(name)}
    </span>
  );
}

export function TeamMark({ name, size = 22 }: { name: string; size?: number }) {
  const hue = markHue(name);
  const font = size <= 20 ? 9 : 11;
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: font,
        background: `oklch(0.28 0.04 ${hue})`,
      }}
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] font-semibold tracking-tight text-white"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ background: `oklch(0.55 0.14 ${hue})` }}
      />
      <span className="relative">{agentInitials(name)}</span>
    </span>
  );
}

export function UserAvatar({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  const hue = markHue(name);
  const font = size <= 24 ? 10 : 11;
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: font,
        background: `conic-gradient(from 200deg, oklch(0.78 0.12 ${hue}), oklch(0.48 0.16 ${hue + 55}), oklch(0.7 0.1 ${hue + 18}), oklch(0.78 0.12 ${hue}))`,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-full p-[1.5px]"
    >
      <span className="flex size-full items-center justify-center rounded-full bg-background/75 font-medium text-foreground backdrop-blur-[2px]">
        {agentInitials(name)}
      </span>
    </span>
  );
}

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? (
        <span className="mt-1.5 block text-[12px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export const textareaClass =
  "min-h-24 w-full resize-y rounded-lg border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
      <p className="text-[14px] font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
