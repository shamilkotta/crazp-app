import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@workspace/ui/components/button";

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link. Open it to activate your account, then
          sign in.
        </p>
        <Button
          className="mt-8 w-full"
          render={<Link href="/sign-in" />}
          nativeButton={false}
        >
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
