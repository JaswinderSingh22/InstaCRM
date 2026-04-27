import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthSplitShell variant="login">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reset password</h1>
          <p className="mt-2 text-sm text-[#777681]">
            We&apos;ll email you a link to choose a new password.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </AuthSplitShell>
  );
}
