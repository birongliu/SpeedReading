"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import {
  clearGuestSessionAndResult,
  getGuestDocument,
  getGuestResult,
} from "@/lib/guestStorage";
import GuestUpgradePrompt from "../ui/guest-upgrade-prompt";

// Converts raw seconds into the classroom-friendly "Xm Ys" display format.
const formatDuration = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}m ${seconds}s`;
};

// The result page reads local sessionStorage, never a backend or Supabase table.
const subscribeToGuestResult = () => () => {};
const getGuestResultSnapshot = () =>
  [
    sessionStorage.getItem("guestResultDocumentTitle") ?? "",
    sessionStorage.getItem("guestResultTargetWpm") ?? "",
    sessionStorage.getItem("guestResultFinalSelectedWpm") ?? "",
    sessionStorage.getItem("guestResultEffectiveWpm") ?? "",
    sessionStorage.getItem("guestResultWordsRead") ?? "",
    sessionStorage.getItem("guestResultDurationSeconds") ?? "",
    sessionStorage.getItem("guestResultCompletedAt") ?? "",
  ].join("\u001f");
const getServerGuestResultSnapshot = () => "";

export default function GuestResultsPage() {
  const router = useRouter();
  const resultSnapshot = useSyncExternalStore(
    subscribeToGuestResult,
    getGuestResultSnapshot,
    getServerGuestResultSnapshot,
  );
  const result = useMemo(
    () => (resultSnapshot ? getGuestResult() : null),
    [resultSnapshot],
  );

  const handleReadAgain = () => {
    const document = getGuestDocument();

    if (!document) {
      router.push("/guest");
      return;
    }

    router.push("/guest/configure");
  };

  const handleNewDocument = () => {
    clearGuestSessionAndResult();
    router.push("/guest");
  };

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-6 py-8 text-center shadow-2xl shadow-black/30">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            No guest result found.
          </h1>
          <Link
            href="/guest"
            className="mt-6 inline-flex rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
          >
            Back to Guest
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute right-[8%] top-[8%] h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-[8%] left-[4%] h-[420px] w-[420px] rounded-full bg-orange-600/6 blur-[110px]" />
      </div>

      <header className="border-b border-white/6 bg-[rgba(9,9,11,0.82)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-900/50">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M1.5 6.5h3.5m3 0h3M1.5 3.5h2m6 0h-3M1.5 9.5h5m3 0h-2"
                  stroke="white"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              SpeedRead
            </span>
          </Link>

          <Link
            href="/guest"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white sm:px-4"
          >
            Guest Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-4 py-8 shadow-2xl shadow-black/30 sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                Guest Result
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Session Complete!
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                {result.documentTitle}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                Effective speed
              </p>
              <p className="mt-4 text-4xl font-extrabold text-amber-300">
                {result.effectiveWpm}
              </p>
              <p className="text-sm font-semibold text-zinc-400">WPM</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Effective WPM", `${result.effectiveWpm}`],
            ["Target WPM", `${result.targetWpm}`],
            ["Final Selected WPM", `${result.finalSelectedWpm}`],
            ["Words Read", result.wordsRead.toLocaleString()],
            ["Duration", formatDuration(result.durationSeconds)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-5"
            >
              <p className="text-xs text-zinc-500 sm:text-sm">{label}</p>
              <p className="mt-3 text-2xl font-bold text-white sm:mt-4 sm:text-3xl">
                {value}
              </p>
            </div>
          ))}
        </section>

        <GuestUpgradePrompt compact />

        <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-3">
            <button
              type="button"
              onClick={handleReadAgain}
              className="h-12 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
            >
              Read Again
            </button>
            <button
              type="button"
              onClick={handleNewDocument}
              className="h-12 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Back to Home
            </button>
            <button
              type="button"
              disabled
              className="h-12 cursor-not-allowed rounded-xl border border-white/8 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-500"
              title="AI comprehension check will be added later."
            >
              Take Comprehension Check
            </button>
          </div>

          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            AI comprehension check will be added later.
          </p>
        </section>
      </main>
    </div>
  );
}
