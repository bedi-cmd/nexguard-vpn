import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/lib/auth-actions";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailAction(token);

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-bold">
        {result.ok ? "Email verified" : "Verification failed"}
      </h1>
      <p className="text-slate-400">
        {result.ok ? result.message : result.error}
      </p>
      <Button render={<Link href={result.ok ? "/sign-in" : "/forgot-password"} />}>
        {result.ok ? "Go to sign in" : "Try again"}
      </Button>
    </div>
  );
}
