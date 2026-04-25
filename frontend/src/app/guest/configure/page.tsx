"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  countDocumentWords,
  getGuestDocument,
  saveGuestSession,
  type GuestFocusMode,
} from "@/lib/guestStorage";

type ReadAmountMode = "entire" | "first" | "range";

const focusModeOptions: Array<{ label: string; value: GuestFocusMode }> = [
  { label: "Highlight", value: "highlight" },
  { label: "Focal Point", value: "focal-point" },
  { label: "Line Focus", value: "line-focus" },
];

const splitWords = (text: string) => text.trim().split(/\s+/).filter(Boolean);

// Creates a local-only id for the guest session.
// crypto.randomUUID is preferred, with a timestamp fallback for older browsers.
const createGuestSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}`;
};

// useSyncExternalStore needs a subscribe function even though sessionStorage
// is only read once here. This keeps the client/server render snapshots stable.
const subscribeToGuestDocument = () => () => {};

// Combines the stored document keys into one stable string snapshot.
// When this string exists, the page can safely read the full document object.
const getGuestDocumentSnapshot = () =>
  [
    sessionStorage.getItem("guestDocumentTitle") ?? "",
    sessionStorage.getItem("guestDocumentText") ?? "",
    sessionStorage.getItem("guestDocumentWordCount") ?? "",
    sessionStorage.getItem("guestDocumentUploadedAt") ?? "",
    sessionStorage.getItem("guestDocumentSavedDocumentId") ?? "",
    sessionStorage.getItem("guestDocumentCurrentWordIndex") ?? "",
    sessionStorage.getItem("guestDocumentCurrentWpm") ?? "",
    sessionStorage.getItem("guestDocumentCurrentFocusMode") ?? "",
    sessionStorage.getItem("guestDocumentElapsedSeconds") ?? "",
  ].join("\u001f");

// During server rendering, there is no sessionStorage, so the snapshot is empty.
const getServerGuestDocumentSnapshot = () => "";

export default function GuestConfigurePage() {
  const router = useRouter();
  // Loads the selected guest document from browser storage without using backend state.
  const documentSnapshot = useSyncExternalStore(
    subscribeToGuestDocument,
    getGuestDocumentSnapshot,
    getServerGuestDocumentSnapshot,
  );
  const document = useMemo(
    () => (documentSnapshot ? getGuestDocument() : null),
    [documentSnapshot],
  );
  const [targetWpm, setTargetWpm] = useState<number | null>(null);
  const [amountMode, setAmountMode] = useState<ReadAmountMode>("entire");
  const [firstWords, setFirstWords] = useState(500);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(500);
  const [focusMode, setFocusMode] = useState<GuestFocusMode | null>(null);
  const [error, setError] = useState("");
  const configuredWpm = targetWpm ?? document?.currentWpm ?? 300;
  const configuredFocusMode =
    focusMode ?? document?.currentFocusMode ?? "highlight";

  // Shows the user how many words their current "How much to read" choice uses.
  const selectedWordPreview = useMemo(() => {
    if (!document) return 0;
    if (amountMode === "entire") return document.wordCount;
    if (amountMode === "first") return Math.min(firstWords, document.wordCount);

    return Math.max(0, Math.min(rangeEnd, document.wordCount) - rangeStart + 1);
  }, [amountMode, document, firstWords, rangeEnd, rangeStart]);

  const readingScope = useMemo(() => {
    if (!document) return "Entire document";
    if (amountMode === "entire") return "Entire document";
    if (amountMode === "first") {
      return `First ${Math.min(firstWords, document.wordCount).toLocaleString()} words`;
    }

    return `Words ${rangeStart.toLocaleString()}-${Math.min(
      rangeEnd,
      document.wordCount,
    ).toLocaleString()}`;
  }, [amountMode, document, firstWords, rangeEnd, rangeStart]);

  // Builds the exact text that the reader page should display.
  // It supports the three options: entire document, first N words, or a range.
  const buildSelectedText = () => {
    if (!document) return "";
    const words = splitWords(document.text);

    if (amountMode === "entire") return document.text;

    if (amountMode === "first") {
      const safeCount = Math.min(Math.max(firstWords, 1), words.length);
      return words.slice(0, safeCount).join(" ");
    }

    const startIndex = Math.max(rangeStart - 1, 0);
    const endIndex = Math.min(rangeEnd, words.length);
    return words.slice(startIndex, endIndex).join(" ");
  };

  // Validates the configuration, saves the local guest session, then moves forward.
  const handleStartReading = () => {
    setError("");

    if (!document) return;

    if (amountMode === "first" && firstWords < 1) {
      setError("First N words must be at least 1.");
      return;
    }

    if (amountMode === "range") {
      if (rangeStart < 1 || rangeEnd < 1 || rangeStart > rangeEnd) {
        setError("Enter a valid word range.");
        return;
      }

      if (rangeStart > document.wordCount) {
        setError("Range start must be within the document word count.");
        return;
      }
    }

    const selectedText = buildSelectedText();
    const selectedWordCount = countDocumentWords(selectedText);

    if (!selectedText || selectedWordCount === 0) {
      setError("Your selection does not contain readable words.");
      return;
    }

    // The configured guest session is stored locally for the future reader page.
    saveGuestSession({
      id: createGuestSessionId(),
      savedDocumentId: document.savedDocumentId,
      documentTitle: document.title,
      originalWordCount: document.wordCount,
      selectedText,
      selectedWordCount,
      targetWpm: configuredWpm,
      focusMode: configuredFocusMode,
      readingScope,
      startWordIndex:
        amountMode === "entire" ? document.currentWordIndex ?? 0 : 0,
      startElapsedSeconds:
        amountMode === "entire" ? document.elapsedSeconds ?? 0 : 0,
      startedAt: new Date().toISOString(),
    });

    router.push("/guest/read");
  };

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
            HomePage
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
        {!document ? (
          <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-4 py-8 text-center shadow-2xl shadow-black/30 sm:px-8 sm:py-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              No guest document selected.
            </h1>
            <Link
              href="/guest"
              className="mt-6 inline-flex rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
            >
              HomePage
            </Link>
          </section>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-4 py-6 shadow-2xl shadow-black/30 sm:px-8 sm:py-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
              />
              <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                    Guest Session
                  </span>
                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Configure Session
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                    Choose your pace, reading amount, and focus style before
                    starting.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Document
                  </p>
                  <p className="mt-4 truncate text-lg font-bold text-white">
                    {document.title}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {document.wordCount.toLocaleString()} total words
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:gap-4 lg:grid-cols-[360px_1fr]">
              <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Reading pace
                </h2>
                <div className="mt-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      Target speed
                    </span>
                    <span className="text-sm font-bold text-amber-300">
                      {configuredWpm} WPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={25}
                    value={configuredWpm}
                    onChange={(event) => setTargetWpm(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-400"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-600">
                    <span>100</span>
                    <span>550</span>
                    <span>1000</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  How much to read
                </h2>
                <div className="mt-5 grid gap-3">
                  {[
                    ["entire", "Entire document"],
                    ["first", "First N words"],
                    ["range", "Word range from X to Y"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`rounded-xl border px-4 py-3 transition-all ${
                        amountMode === value
                          ? "border-amber-400/50 bg-amber-500/15"
                          : "border-white/10 bg-white/3"
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold text-white">
                        <input
                          type="radio"
                          name="amountMode"
                          value={value}
                          checked={amountMode === value}
                          onChange={() => setAmountMode(value as ReadAmountMode)}
                          className="accent-amber-400"
                        />
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {amountMode === "first" ? (
                  <label className="mt-4 flex flex-col gap-2">
                    <span className="text-sm font-medium text-zinc-300">
                      Number of words
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={document.wordCount}
                      value={Math.min(firstWords, document.wordCount)}
                      onChange={(event) =>
                        setFirstWords(Number(event.target.value))
                      }
                      className="h-12 rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition-all focus:border-amber-400/50 focus:bg-white/6"
                    />
                  </label>
                ) : null}

                {amountMode === "range" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-zinc-300">
                        From word
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={document.wordCount}
                        value={rangeStart}
                        onChange={(event) =>
                          setRangeStart(Number(event.target.value))
                        }
                        className="h-12 rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition-all focus:border-amber-400/50 focus:bg-white/6"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-zinc-300">
                        To word
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={document.wordCount}
                        value={Math.min(rangeEnd, document.wordCount)}
                        onChange={(event) =>
                          setRangeEnd(Number(event.target.value))
                        }
                        className="h-12 rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition-all focus:border-amber-400/50 focus:bg-white/6"
                      />
                    </label>
                  </div>
                ) : null}

                <div className="mt-5 rounded-xl border border-white/6 bg-black/20 p-4">
                  <p className="text-xs text-zinc-500">Selected length</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {selectedWordPreview.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-amber-300">words</p>
                </div>
              </section>
            </section>

            <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <label className="flex flex-col gap-2">
                  <span className="text-lg font-bold text-white sm:text-xl">
                    Focus Mode
                  </span>
                  <select
                    value={configuredFocusMode}
                    onChange={(event) =>
                      setFocusMode(event.target.value as GuestFocusMode)
                    }
                    className="h-12 rounded-xl border border-white/10 bg-[#111116] px-4 text-sm font-medium text-white outline-none transition-all focus:border-amber-400/50 focus:bg-[#15151c]"
                  >
                    {focusModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                  <Link
                    href="/guest"
                    className="flex h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
                  >
                    HomePage
                  </Link>
                  <button
                    type="button"
                    onClick={handleStartReading}
                    className="h-12 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
                  >
                    Start Reading
                  </button>
                </div>
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
