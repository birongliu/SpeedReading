"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getGuestSession,
  saveGuestResult,
  updateGuestSavedDocumentProgress,
  type GuestFocusMode,
} from "@/lib/guestStorage";

const MIN_WPM = 100;
const MAX_WPM = 1000;
const WPM_STEP = 25;

const splitWords = (text: string) => text.trim().split(/\s+/).filter(Boolean);

const formatElapsedTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const clampWpm = (wpm: number) => Math.min(MAX_WPM, Math.max(MIN_WPM, wpm));

// useSyncExternalStore gives this client page a stable sessionStorage snapshot.
const subscribeToGuestSession = () => () => {};
const getGuestSessionSnapshot = () =>
  [
    sessionStorage.getItem("guestSessionId") ?? "",
    sessionStorage.getItem("guestSessionSavedDocumentId") ?? "",
    sessionStorage.getItem("guestSessionDocumentTitle") ?? "",
    sessionStorage.getItem("guestSessionSelectedText") ?? "",
    sessionStorage.getItem("guestSessionSelectedWordCount") ?? "",
    sessionStorage.getItem("guestSessionTargetWpm") ?? "",
    sessionStorage.getItem("guestSessionFocusMode") ?? "",
    sessionStorage.getItem("guestSessionReadingScope") ?? "",
    sessionStorage.getItem("guestSessionStartWordIndex") ?? "",
    sessionStorage.getItem("guestSessionStartElapsedSeconds") ?? "",
  ].join("\u001f");
const getServerGuestSessionSnapshot = () => "";

const getFocusModeLabel = (focusMode: GuestFocusMode) => {
  if (focusMode === "focal-point") return "Focal Point";
  if (focusMode === "line-focus") return "Line Focus";
  return "Highlight";
};

const focusModeOptions: Array<{ label: string; value: GuestFocusMode }> = [
  { label: "Highlight", value: "highlight" },
  { label: "Focal Point", value: "focal-point" },
  { label: "Line Focus", value: "line-focus" },
];

export default function GuestReadPage() {
  const router = useRouter();
  const hasEndedRef = useRef(false);
  const sessionSnapshot = useSyncExternalStore(
    subscribeToGuestSession,
    getGuestSessionSnapshot,
    getServerGuestSessionSnapshot,
  );
  const session = useMemo(
    () => (sessionSnapshot ? getGuestSession() : null),
    [sessionSnapshot],
  );
  const words = useMemo(
    () => (session ? splitWords(session.selectedText) : []),
    [session],
  );
  const [wordIndex, setWordIndex] = useState(session?.startWordIndex ?? 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    session?.startElapsedSeconds ?? 0,
  );
  const [isPaused, setIsPaused] = useState(true);
  const [selectedWpm, setSelectedWpm] = useState<number | null>(null);
  const [selectedFocusMode, setSelectedFocusMode] =
    useState<GuestFocusMode | null>(null);

  const currentWpm = selectedWpm ?? session?.targetWpm ?? 300;
  const currentFocusMode = selectedFocusMode ?? session?.focusMode ?? "highlight";
  const wordsRead =
    words.length === 0 ? 0 : Math.min(wordIndex + 1, words.length);
  const progress =
    words.length === 0 ? 0 : Math.round((wordsRead / words.length) * 100);

  const segmentStart = Math.max(0, wordIndex - 7);
  const segmentEnd = Math.min(words.length, wordIndex + 8);
  const segmentWords = words.slice(segmentStart, segmentEnd);

  const saveProgressAtIndex = useCallback(
    (nextWordIndex: number, completedAt?: string) => {
      if (!session?.savedDocumentId || words.length === 0) return;

      const nextWordsRead = Math.min(nextWordIndex + 1, words.length);
      const nextProgressPercent = Math.min(
        100,
        Math.round((nextWordsRead / words.length) * 100),
      );

      updateGuestSavedDocumentProgress(session.savedDocumentId, {
        currentWordIndex: nextWordIndex,
        currentWpm,
        currentFocusMode,
        elapsedSeconds,
        currentReadingScope: session.readingScope,
        currentSelectedText: session.selectedText,
        currentSelectedWordCount: session.selectedWordCount,
        progressPercent: nextProgressPercent,
        lastReadAt: new Date().toISOString(),
        completedAt,
      });
    },
    [
      currentWpm,
      currentFocusMode,
      elapsedSeconds,
      session,
      words.length,
    ],
  );

  const saveCurrentProgress = useCallback(
    (completedAt?: string) => {
      saveProgressAtIndex(wordIndex, completedAt);
    },
    [saveProgressAtIndex, wordIndex],
  );

  const lineFocusText = useMemo(() => {
    if (!session || words.length === 0) return "";

    // For line focus, use the current sentence when possible.
    const escapedWord = words[wordIndex]?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sentenceMatch = session.selectedText
      .split(/(?<=[.!?])\s+/)
      .find((sentence) => new RegExp(`\\b${escapedWord}\\b`).test(sentence));

    return sentenceMatch ?? segmentWords.join(" ");
  }, [segmentWords, session, wordIndex, words]);

  const completeSession = useCallback(() => {
    if (!session || hasEndedRef.current) return;

    hasEndedRef.current = true;
    const safeElapsedSeconds = Math.max(elapsedSeconds, 1);
    const finalWordsRead = Math.min(wordIndex + 1, words.length);
    const effectiveWpm = Math.round(finalWordsRead / (safeElapsedSeconds / 60));
    const completedAt = new Date().toISOString();

    // End Session creates a result and clears resumable progress for this document.
    saveGuestResult({
      documentTitle: session.documentTitle,
      targetWpm: session.targetWpm,
      finalSelectedWpm: currentWpm,
      effectiveWpm,
      wordsRead: finalWordsRead,
      durationSeconds: safeElapsedSeconds,
      completedAt,
    });

    if (session.savedDocumentId) {
      updateGuestSavedDocumentProgress(session.savedDocumentId, {
        currentWordIndex: 0,
        currentWpm,
        currentFocusMode,
        elapsedSeconds: 0,
        currentReadingScope: session.readingScope,
        currentSelectedText: session.selectedText,
        currentSelectedWordCount: session.selectedWordCount,
        progressPercent: 100,
        lastReadAt: completedAt,
        completedAt,
      });
    }

    router.push("/guest/results");
  }, [
    currentWpm,
    currentFocusMode,
    elapsedSeconds,
    router,
    session,
    wordIndex,
    words.length,
  ]);

  // Saves resume progress to the matching localStorage document.
  useEffect(() => {
    if (!session?.savedDocumentId || words.length === 0 || hasEndedRef.current) {
      return;
    }

    saveCurrentProgress(progress === 100 ? new Date().toISOString() : undefined);
  }, [isPaused, progress, saveCurrentProgress, session, words.length]);

  // Tracks elapsed reading time while the session is active.
  useEffect(() => {
    if (!session || isPaused || hasEndedRef.current) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPaused, session]);

  // Advances the current word according to the active WPM.
  useEffect(() => {
    if (!session || isPaused || hasEndedRef.current || words.length === 0) {
      return;
    }

    const wordDelayMs = 60000 / currentWpm;
    const timer = window.setInterval(() => {
      setWordIndex((index) => Math.min(index + 1, words.length - 1));
    }, wordDelayMs);

    return () => window.clearInterval(timer);
  }, [currentWpm, isPaused, session, words.length]);

// Pauses the session when the final word is reached.
// The user can manually end the session after reviewing the result.
useEffect(() => {
  if (!session || isPaused || words.length === 0) {
    return;
  }

  if (wordIndex >= words.length - 1) {
    setIsPaused(true);
  }
}, [isPaused, session, wordIndex, words.length]);

  const changeWpm = (delta: number) => {
    setSelectedWpm((current) => clampWpm((current ?? currentWpm) + delta));
  };

  const handleWpmSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedWpm(clampWpm(Number(event.target.value)));
  };

  const moveToWordIndex = (nextIndex: number) => {
    const boundedIndex = Math.min(Math.max(nextIndex, 0), words.length - 1);
    setIsPaused(true);
    setWordIndex(boundedIndex);
    saveProgressAtIndex(boundedIndex);
  };

  const handleProgressSliderChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    moveToWordIndex(Number(event.target.value));
  };

  const handleSaveAndExit = () => {
    hasEndedRef.current = true;
    saveCurrentProgress();
    router.push("/guest");
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-6 py-8 text-center shadow-2xl shadow-black/30">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            No active guest session.
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
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              Guest Reader
            </p>
            <h1 className="mt-1 max-w-xl truncate text-lg font-bold text-white">
              {session.documentTitle}
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[420px]">
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              <p className="text-[11px] text-zinc-500">WPM</p>
              <p className="text-sm font-bold text-amber-300">{currentWpm}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              <p className="text-[11px] text-zinc-500">Elapsed</p>
              <p className="text-sm font-bold text-white">
                {formatElapsedTime(elapsedSeconds)}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              <p className="text-[11px] text-zinc-500">Progress</p>
              <p className="text-sm font-bold text-white">{progress}%</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-4 py-8 shadow-2xl shadow-black/30 sm:px-8 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
          />

          <div className="relative mx-auto flex h-[320px] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-6 sm:h-[360px] sm:px-8 sm:py-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                {getFocusModeLabel(currentFocusMode)}
              </span>
              <span className="text-sm text-zinc-500">
                {wordsRead.toLocaleString()} / {words.length.toLocaleString()} words
              </span>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              {currentFocusMode === "line-focus" ? (
                <p className="max-h-full max-w-[680px] overflow-hidden text-center text-2xl font-semibold leading-relaxed text-white sm:text-4xl">
                  {lineFocusText}
                </p>
              ) : (
                <div className="flex max-h-full max-w-[680px] flex-wrap justify-center gap-x-3 gap-y-5 overflow-hidden text-center text-2xl font-semibold leading-relaxed text-zinc-500 sm:text-4xl">
                  {segmentWords.map((word, index) => {
                    const absoluteIndex = segmentStart + index;
                    const isCurrent = absoluteIndex === wordIndex;

                    return (
                      <span
                        key={`${word}-${absoluteIndex}`}
                        className="relative inline-flex min-h-[3rem] flex-col items-center justify-center sm:min-h-[4rem]"
                      >
                        <span
                          className={
                            isCurrent && currentFocusMode === "highlight"
                              ? "rounded-lg bg-amber-400 px-2 py-1 text-zinc-950"
                              : isCurrent
                                ? "text-white"
                                : "text-zinc-500"
                          }
                        >
                          {word}
                        </span>
                        {isCurrent && currentFocusMode === "focal-point" ? (
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.9)]" />
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
          <div className="mb-5 rounded-xl border border-white/6 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">Current WPM</p>
                <p className="mt-1 text-3xl font-bold text-amber-300">
                  {currentWpm}
                </p>
              </div>
              <p className="text-right text-xs leading-relaxed text-zinc-500">
                Adjusting speed updates the timer immediately.
                <br />
                Pause stays paused until you resume.
              </p>
            </div>
            <input
              type="range"
              min={MIN_WPM}
              max={MAX_WPM}
              step={WPM_STEP}
              value={currentWpm}
              onChange={handleWpmSliderChange}
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-400"
              aria-label="Current words per minute"
            />
            <div className="mt-2 flex justify-between text-[11px] text-zinc-600">
              <span>{MIN_WPM}</span>
              <span>550</span>
              <span>{MAX_WPM}</span>
            </div>
          </div>

          <label className="mb-5 flex flex-col gap-2 rounded-xl border border-white/6 bg-black/20 p-4">
            <span className="text-xs text-zinc-500">Focus Mode</span>
            <select
              value={currentFocusMode}
              onChange={(event) =>
                setSelectedFocusMode(event.target.value as GuestFocusMode)
              }
              className="h-11 rounded-xl border border-white/10 bg-[#111116] px-4 text-sm font-medium text-white outline-none transition-all focus:border-amber-400/50 focus:bg-[#15151c]"
            >
              {focusModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => changeWpm(-WPM_STEP)}
              className="h-12 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Slower
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((paused) => !paused)}
              className="h-12 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all hover:from-amber-400 hover:to-orange-500"
            >
              {isPaused && elapsedSeconds === (session?.startElapsedSeconds ?? 0)
                ? "Start"
                : isPaused
                  ? "Resume"
                  : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => changeWpm(WPM_STEP)}
              className="h-12 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Faster
            </button>
            <button
              type="button"
              onClick={completeSession}
              className="h-12 rounded-xl border border-green-400/20 bg-green-500/10 px-4 text-sm font-semibold text-green-200 transition-all hover:border-green-300/30 hover:bg-green-500/15"
            >
              Complete Session
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="h-12 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              Save &amp; Exit
            </button>
          </div>

          <p className="mt-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-zinc-400">
            Pause the session to manually change your reading position with the
            progress slider or the 50-word jump controls.
          </p>

          <div
            className={`mt-5 rounded-xl border border-white/6 bg-black/20 p-4 transition-opacity ${
              isPaused ? "opacity-100" : "opacity-55"
            }`}
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-zinc-500">Manual progress</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Word {wordIndex + 1} / {words.length.toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-bold text-amber-300">
                {progress}% complete
              </p>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(words.length - 1, 0)}
              step={1}
              value={wordIndex}
              onChange={handleProgressSliderChange}
              disabled={!isPaused}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-400 disabled:cursor-not-allowed"
              aria-label="Current word position"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => moveToWordIndex(wordIndex - 50)}
                disabled={!isPaused}
                className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back 50 words
              </button>
              <button
                type="button"
                onClick={() => moveToWordIndex(wordIndex + 50)}
                disabled={!isPaused}
                className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Forward 50 words
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
