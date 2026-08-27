"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { AgentStage } from "@/components/agent-stage/agent-stage";

function WaitlistForm() {
  return (
    <form className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        placeholder="Enter your email"
        aria-label="Email address"
        className="h-9 rounded-none border-border bg-background/85 text-sm shadow-none backdrop-blur"
      />
      <Button
        type="submit"
        size="sm"
        className="h-9 rounded-none px-4 has-data-[icon=inline-end]:pe-4"
      >
        Join waitlist
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}

export function LandingPage() {
  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <section className="relative z-10 flex shrink-0 flex-col justify-center px-5 pt-16 pb-6 sm:px-6 sm:pt-20 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[42%] lg:items-center lg:px-12 lg:pt-0 lg:pb-0">
        <div className="flex w-full max-w-md flex-col gap-5 lg:gap-6">
          <h1 className="text-3xl leading-[1.05] font-semibold tracking-tight sm:text-4xl">
            Build agents that work across your stack.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Most real work crosses more than one tool. Build agents that own
            those workflows, you set the role, they handle what comes next.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <div className="relative min-h-0 w-full flex-1 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[58%]">
        <AgentStage className="absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-linear-to-b from-background to-transparent lg:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-1/5 bg-linear-to-r from-background to-transparent lg:block"
        />
      </div>
    </div>
  );
}
