"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@workspace/auth/client";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";

type AuthMode = "signin" | "signup";

export function AuthForm({
  mode,
  callbackURL = "/",
}: {
  mode: AuthMode;
  callbackURL?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      if (isSignup) {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: `${window.location.origin}/`,
        });

        if (signUpError) {
          setError(signUpError.message ?? "Could not create account.");
          return;
        }

        setMessage(
          "Account created. Check your email to verify before signing in."
        );
        router.push("/verify-email");
        return;
      }

      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: `${window.location.origin}${callbackURL}`,
      });

      if (signInError) {
        setError(signInError.message ?? "Invalid email or password.");
        return;
      }

      router.push(callbackURL);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <Link
            href={process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to crazp
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? "Start building agents with crazp."
            : "Welcome back to your agent workspace."}
        </p>

        <form className="mt-8" onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            {isSignup ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
            ) : null}
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error || undefined}
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                {!isSignup ? (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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
              {pending
                ? isSignup
                  ? "Creating account…"
                  : "Signing in…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={isSignup ? "/sign-in" : "/sign-up"}
            className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}
