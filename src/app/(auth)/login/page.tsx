import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";

export const metadata = { title: "Log in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const p = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(p.next || "/onboarding");
  }

  return (
    <AuthSplitShell variant="login">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-[#777681]">
            Log in to manage your campaigns and leads.
          </p>
        </div>
        {p.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {p.error}
          </p>
        ) : null}
        <LoginForm nextPath={p.next} />
        <p className="text-center text-sm text-[#777681]">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-[#4F46E5] hover:underline"
            href="/signup"
          >
            Sign Up for Free
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
