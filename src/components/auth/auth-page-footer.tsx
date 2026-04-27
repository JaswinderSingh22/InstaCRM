import Link from "next/link";

export function AuthPageFooter() {
  return (
    <footer className="border-t border-neutral-200/80 bg-white px-6 py-4 text-xs text-[#777681] dark:border-border dark:bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p>© {new Date().getFullYear()} InstaCRM. Built for Creators.</p>
        <div className="flex gap-6">
          <Link
            className="hover:text-[#4F46E5]"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            Privacy
          </Link>
          <Link
            className="hover:text-[#4F46E5]"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            Terms
          </Link>
          <span className="text-neutral-400">API</span>
        </div>
      </div>
    </footer>
  );
}
