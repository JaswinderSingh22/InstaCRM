import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const p = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(p.next || "/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(262_45%_35%/0.12),transparent)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use email or continue with Google
          </p>
        </div>
        {p.error ? (
          <p className="text-sm text-destructive">Authentication failed. Try again.</p>
        ) : null}
        <LoginForm nextPath={p.next} />
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
