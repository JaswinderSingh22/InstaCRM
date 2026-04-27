import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";

export const metadata = { title: "Sign up" };

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/onboarding");
  }

  return (
    <AuthSplitShell variant="signup">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#777681]">
            Start tracking leads and deals in one place.
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-[#777681]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#4F46E5] hover:underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
