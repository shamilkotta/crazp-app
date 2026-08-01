"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message ?? "Could not send reset email.");
        return;
      }

      setMessage("If that email exists, a reset link has been sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to sign in
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>

        <form className="mt-8" onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error || undefined}
                required
              />
            </Field>

            {error ? <FieldError>{error}</FieldError> : null}
            {message ? (
              <p className="text-sm text-muted-foreground" role="status">
                {message}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
