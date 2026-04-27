"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "");
          setLoading(true);
          const supabase = createClient();
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
          });
          setLoading(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Check your email for the reset link.");
        }}
      >
        <div className="space-y-2">
          <label htmlFor="fp-email" className="text-sm font-medium text-neutral-800">
            Email address
          </label>
          <input
            id="fp-email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-neutral-200 bg-[#F3F4F6] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F46E5] focus:bg-white focus:ring-2 focus:ring-[#4F46E5]/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#6366f1] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link className="font-medium text-[#4F46E5] hover:underline" href="/login">
          Back to log in
        </Link>
      </p>
    </>
  );
}
