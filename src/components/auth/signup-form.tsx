"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "");
          const password = String(fd.get("password") ?? "");
          setLoading(true);
          const supabase = createClient();
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
          setLoading(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Check your email to confirm, or try Google.");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign up"}
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
          });
          setLoading(false);
          if (error) toast.error(error.message);
        }}
      >
        Continue with Google
      </Button>
    </div>
  );
}
