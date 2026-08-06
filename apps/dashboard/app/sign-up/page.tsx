import { AuthForm } from "@/components/auth-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next: string | undefined }>;
}) {
  const callbackURL = (await searchParams).next;
  return <AuthForm mode="signup" callbackURL={callbackURL} />;
}
