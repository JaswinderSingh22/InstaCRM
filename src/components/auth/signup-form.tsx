"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/auth/google-icon";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="space-y-6">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
              queryParams: { prompt: "select_account", access_type: "offline" },
            },
          });
          if (error) {
            setLoading(false);
            toast.error(error.message);
            return;
          }
          if (data?.url) window.location.assign(data.url);
        }}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition-colors",
          "hover:bg-neutral-50 disabled:opacity-60",
        )}
      >
        <GoogleIcon className="size-5" />
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white px-3 text-[#777681]">or with email</span>
        </div>
      </div>

      <form
        className="space-y-5"
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
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-neutral-800">
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="creator@brand.com"
            className="w-full rounded-lg border border-neutral-200 bg-[#F3F4F6] px-3.5 py-2.5 text-sm text-neutral-900 outline-none ring-[#4F46E5]/30 transition placeholder:text-neutral-400 focus:border-[#4F46E5] focus:bg-white focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-neutral-800">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-neutral-200 bg-[#F3F4F6] py-2.5 pr-11 pl-3.5 text-sm text-neutral-900 outline-none ring-[#4F46E5]/30 transition focus:border-[#4F46E5] focus:bg-white focus:ring-2"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-[#777681] hover:bg-neutral-200/80"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-[#777681]">At least 6 characters.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#6366f1] py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-[#4338ca] hover:to-[#4F46E5] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Create your account"}
        </button>
      </form>

    </div>
  );
}
