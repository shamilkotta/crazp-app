"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAgent } from "@/lib/actions/agents";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import { Textarea } from "@workspace/ui/components/textarea";

type Step = "name" | "instructions";

export function CreateAgentForm({ teamSlug }: { teamSlug: string }) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const instructionsInputRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const agentsPath = `/${teamSlug}`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (step === "name") {
        nameInputRef.current?.focus();
      } else {
        instructionsInputRef.current?.focus();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [step]);

  function continueToInstructions() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your agent a name to continue.");
      return;
    }
    setError(null);
    setStep("instructions");
  }

  async function handleCreate() {
    const trimmedInstructions = instructions.trim();
    if (!trimmedInstructions) {
      setError("Add instructions so your agent knows what to do.");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const result = await createAgent({
        teamSlug,
        name,
        instructions,
      });

      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }

      router.push(agentsPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 mb-6"
        render={<Link href={agentsPath} />}
        nativeButton={false}
        disabled={pending}
      >
        <ArrowLeft data-icon="inline-start" />
        All agents
      </Button>

      {step === "name" ? (
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create agent
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a name. You can refine everything after it&apos;s
              created.
            </p>
          </div>

          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              continueToInstructions();
            }}
          >
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="agent-name">Name</FieldLabel>
                <Input
                  ref={nameInputRef}
                  id="agent-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Customer support"
                  maxLength={80}
                  aria-invalid={error ? true : undefined}
                  autoComplete="off"
                />
                  <FieldDescription>
                    This is who the agent is.
                  </FieldDescription>
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                render={<Link href={agentsPath} />}
                nativeButton={false}
              >
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Instructions for {name.trim()}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell the agent who it is, what it should do, and how it should
              respond.
            </p>
          </div>

          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
          >
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="agent-instructions">
                  Instructions
                </FieldLabel>
                <Textarea
                  ref={instructionsInputRef}
                  id="agent-instructions"
                  value={instructions}
                  onChange={(event) => {
                    setInstructions(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="You are a helpful support agent. Answer questions using the knowledge base, stay concise, and escalate billing issues."
                  className="min-h-72 resize-y text-base md:text-base"
                  aria-invalid={error ? true : undefined}
                  disabled={pending}
                />
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStep("name");
                }}
                disabled={pending}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Creating…" : "Create agent"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
