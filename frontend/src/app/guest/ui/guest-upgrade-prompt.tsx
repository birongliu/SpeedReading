"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type GuestUpgradePromptProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

const defaultTitle = "Want to track your progress?";
const defaultDescription =
  "Create an account to save your reading sessions, track WPM improvement over time, access comprehension checks, view dashboard statistics, and continue reading across devices.";

export default function GuestUpgradePrompt({
  title = defaultTitle,
  description = defaultDescription,
  compact = false,
}: GuestUpgradePromptProps) {
  const pathname = usePathname();
  const query = `?from=${encodeURIComponent(pathname)}&redirect=${encodeURIComponent("/dashboard")}`;
  return (
    <section
      className={`rounded-2xl border border-amber-400/20 bg-amber-500/10 ${
        compact ? "p-4 sm:p-5" : "p-4 sm:p-6"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
            Optional upgrade
          </p>
          <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-100/85">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Link
            href={`/login${query}`}
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-zinc-100 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href={`/register${query}`}
            className="rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
