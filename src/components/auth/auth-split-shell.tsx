import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthPageFooter } from "@/components/auth/auth-page-footer";

type Props = {
  variant: "login" | "signup";
  children: React.ReactNode;
};

export function AuthSplitShell({ variant, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex flex-1 flex-col md:flex-row">
        <AuthBrandPanel variant={variant} />
        <div className="flex flex-1 flex-col justify-center bg-white px-6 py-10 md:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
      <AuthPageFooter />
    </div>
  );
}
