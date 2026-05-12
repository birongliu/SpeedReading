"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/lib/toast-store";
import { useSessionStore } from "@/lib/store/session-store";

interface SampleReading {
  id: string;
  title: string;
  author: string;
  wordCount: number;
}

interface SampleReadingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWpm: number;
}

export default function SampleReadingsModal({
  isOpen,
  onClose,
  defaultWpm,
}: SampleReadingsModalProps) {
  const router = useRouter();
  const [readings, setReadings] = useState<SampleReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchReadings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sample-readings");
        if (!response.ok) {
          throw new Error("Failed to fetch sample readings");
        }

        const data = await response.json();
        setReadings(data);

        if (data.length > 0) {
          setSelectedReadingId(data[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sample readings",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, [isOpen]);

  const handleStartReading = useCallback(async () => {
    if (!selectedReadingId) return;

    setSelectedReadingId(null);

    try {
      const response = await fetch(
        `/api/sample-readings?id=${selectedReadingId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load sample reading");
      }

      const reading = await response.json();

      // Split text into words for the reading session
      const words = reading.text
        .split(/\s+/)
        .filter((w: string) => w.length > 0);

      // Store session data in the session store
      useSessionStore.getState().setSessionData({
        sessionId: `sample-${reading.id}`,
        fileId: "", // Not used for sample readings
        targetWpm: defaultWpm,
        words,
        quizQuestions: reading.questions || [],
      });

      showToast({
        message: `Starting "${reading.title}" by ${reading.author}`,
        variant: "success",
      });

      onClose();
      router.push(`/session/sample-${reading.id}`);
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to start reading",
        variant: "error",
      });
      setSelectedReadingId(null);
    }
  }, [selectedReadingId, defaultWpm, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/8 bg-[rgba(13,13,18,0.96)] p-px shadow-2xl shadow-black/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl"
        />
        <div className="relative rounded-[15px] bg-[rgba(9,9,11,0.9)] px-6 py-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                Sample readings
              </p>
              <h2
                id="sample-modal-title"
                className="mt-2 text-xl font-bold text-white"
              >
                Try a passage
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5"
              aria-label="Close modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-zinc-400">
            Choose a sample reading to practice with. Perfect for testing your
            settings before uploading your own PDFs.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-white/8 bg-white/3"
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {readings.map((reading) => (
                <button
                  key={reading.id}
                  type="button"
                  onClick={() => setSelectedReadingId(reading.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedReadingId === reading.id
                      ? "border-amber-400/50 bg-amber-500/10"
                      : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <p className="font-semibold text-white">{reading.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {reading.author} • {reading.wordCount.toLocaleString()}{" "}
                    words
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 font-medium text-zinc-400 transition-all hover:border-white/20 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartReading}
              disabled={!selectedReadingId || selectedReadingId === null}
              className="flex-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2 font-medium text-amber-100 transition-all hover:border-amber-300/50 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
