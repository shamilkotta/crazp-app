import { AuthForm } from "@/components/auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next: string | undefined }>;
}) {
  const callbackURL = (await searchParams).next;
  return <AuthForm mode="signin" callbackURL={callbackURL} />;
}
