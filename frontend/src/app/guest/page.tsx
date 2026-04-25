"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAllGuestSavedDocumentProgress,
  countDocumentWords,
  clearGuestSavedDocumentProgress,
  deleteGuestSavedDocument,
  getGuestSavedDocuments,
  saveGuestDocument,
  saveGuestSavedDocument,
  saveGuestSession,
  type GuestDocument,
  type GuestSavedDocument,
} from "@/lib/guestStorage";
import GuestUpgradePrompt from "./ui/guest-upgrade-prompt";
import { useAuthSession } from "@/lib/supabase/use-auth-session";

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const formatSavedDate = (date?: string) => {
  if (!date) return "Not read yet";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

// Creates a local session id when Continue skips the configure page.
const createGuestSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}`;
};

// Extracts text with PDF.js entirely in the browser.
// The file is read from the user's device and is never sent to an API.
async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const pdfData = await file.arrayBuffer();
  const documentTask = pdfjs.getDocument({ data: pdfData });
  const pdfDocument = await documentTask.promise;
  const pageTexts: string[] = [];

  // Text extraction stays inside this browser event flow and never calls an API.
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n").replace(/\s+/g, " ").trim();
}

export default function GuestPage() {
  const router = useRouter();
  const [savedDocuments, setSavedDocuments] = useState<GuestSavedDocument[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const {isAuthenticated,isLoading} = useAuthSession();

// The guest page is only for unauthenticated users. If the session check is still loading, show a loading state.
    useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }
    //when the guest page loads, get any saved documents from localStorage to show in the My Documents list.
    setSavedDocuments(getGuestSavedDocuments());
  }, [isLoading, isAuthenticated, router]);
  // Handles both browse uploads and drag-and-drop uploads.
  // It validates the file, extracts text locally, then saves the document.
  const handleFile = async (file?: File) => {
    setError("");

    if (!file) return;

    if (!isPdfFile(file)) {
      setError("Please select a PDF file.");
      return;
    }

    setIsExtracting(true);

    try {
      const text = await extractPdfText(file);

      if (!text) {
        setError("No readable text was found in this PDF.");
        return;
      }

      // This is the data shape the configure page expects to find later.
      const nextDocument: GuestDocument = {
        title: file.name,
        text,
        wordCount: countDocumentWords(text),
        uploadedAt: new Date().toISOString(),
      };

      // Uploaded PDFs are also saved in localStorage for the My Documents list.
      const savedDocument = saveGuestSavedDocument(nextDocument);
      // The selected document goes in sessionStorage for the active flow.
      saveGuestDocument(savedDocument);
      setSavedDocuments(getGuestSavedDocuments());
    } catch (extractError) {
      console.error("Guest PDF parsing failed:", extractError);
      setError("Unable to read this PDF. Please try another file.");
    } finally {
      setIsExtracting(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  };

  const handleSavedDocumentDelete = (documentId: string) => {
    deleteGuestSavedDocument(documentId);
    setSavedDocuments(getGuestSavedDocuments());
  };

  const handleSavedDocumentClearProgress = (documentId: string) => {
    const shouldClear = window.confirm(
      "Clear reading progress for this document?",
    );

    if (!shouldClear) return;

    clearGuestSavedDocumentProgress(documentId);
    setSavedDocuments(getGuestSavedDocuments());
  };

  const handleClearAllProgress = () => {
    const shouldClear = window.confirm(
      "Clear progress for all local documents?",
    );

    if (!shouldClear) return;

    clearAllGuestSavedDocumentProgress();
    setSavedDocuments(getGuestSavedDocuments());
  };

  const handleContinueReading = (savedDocument: GuestSavedDocument) => {
    // Continue uses the saved local progress and previous settings directly.
    saveGuestSession({
      id: createGuestSessionId(),
      savedDocumentId: savedDocument.id,
      documentTitle: savedDocument.title,
      originalWordCount: savedDocument.wordCount,
      selectedText: savedDocument.currentSelectedText,
      selectedWordCount: savedDocument.currentSelectedWordCount,
      targetWpm: savedDocument.currentWpm,
      focusMode: savedDocument.currentFocusMode ?? "highlight",
      readingScope: savedDocument.currentReadingScope,
      startWordIndex: savedDocument.currentWordIndex,
      startElapsedSeconds: savedDocument.elapsedSeconds,
      startedAt: new Date().toISOString(),
    });

    router.push("/guest/read");
  };

  const handleReadDocument = (savedDocument: GuestSavedDocument) => {
    // Read starts a new setup flow, keeping the saved document but not resume state.
    saveGuestDocument(savedDocument);
    router.push("/guest/configure");
  };

  const hasSavedProgress = (savedDocument: GuestSavedDocument) =>
    !savedDocument.completedAt &&
    (savedDocument.currentWordIndex > 0 ||
      savedDocument.elapsedSeconds > 0 ||
      savedDocument.progressPercent > 0);

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
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/8 bg-[rgba(13,13,18,0.9)] px-4 py-6 shadow-2xl shadow-black/30 sm:px-8 sm:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div className="relative">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              Guest Mode
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Select a Document
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Choose a local PDF from this browser. Guest documents stay in
              this browser session.
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Quick actions
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Add a local document for this guest session.
                </p>
              </div>
            </div>

            {/* Click and drop uploads are local-only; no backend or Supabase calls are made. */}
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-all ${
                isDragging
                  ? "border-amber-400/50 bg-amber-500/[0.08]"
                  : "border-white/12 bg-white/[0.03] hover:border-amber-400/35 hover:bg-amber-500/[0.06]"
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-300 transition-all group-hover:border-amber-400/40 group-hover:bg-amber-500/15">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M20 16.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5" />
                </svg>
              </span>
              <span className="mt-5 text-base font-semibold text-white">
                Drag &amp; drop a PDF here
              </span>
              <span className="mt-2 text-sm text-zinc-500">
                or click to browse
              </span>
              <span className="mt-6 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all group-hover:from-amber-400 group-hover:to-orange-500">
                {isExtracting ? "Extracting text..." : "Upload PDF"}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={isExtracting}
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Guest mode: your PDF stays in your browser and is not uploaded to
              the server.
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[rgba(13,13,18,0.86)] p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  My Documents
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Local guest documents available in this browser tab.
                </p>
              </div>
              {savedDocuments.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllProgress}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  Clear All Progress
                </button>
              ) : null}
            </div>

            {savedDocuments.length > 0 ? (
              <div className="grid gap-3">
                {savedDocuments.map((savedDocument) => (
                  <div
                    key={savedDocument.id}
                    className="rounded-xl border border-white/6 bg-white/3 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.7"
                            >
                              <path d="M6 2h8l4 4v16H6z" />
                              <path d="M14 2v5h5" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {savedDocument.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {savedDocument.wordCount.toLocaleString()} words
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Last read:{" "}
                              {formatSavedDate(savedDocument.lastReadAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            hasSavedProgress(savedDocument)
                              ? handleContinueReading(savedDocument)
                              : handleReadDocument(savedDocument)
                          }
                          className="h-9 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 transition-all hover:border-amber-300/40 hover:bg-amber-500/15"
                        >
                          {hasSavedProgress(savedDocument)
                            ? "Continue"
                            : "Read"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSavedDocumentClearProgress(savedDocument.id)
                          }
                          className="h-9 rounded-lg border border-white/10 bg-white/3 px-3 text-xs font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
                        >
                          Clear Progress
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSavedDocumentDelete(savedDocument.id)
                          }
                          className="h-9 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition-all hover:border-rose-300/30 hover:bg-rose-500/15"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Progress</span>
                        <span className="font-semibold text-amber-300">
                          {savedDocument.progressPercentage}%
                        </span>
                      </div>
                      <p className="mb-3 text-xs text-zinc-500">
                        Current setup: {savedDocument.currentReadingScope}.{" "}
                        Progress shown for{" "}
                        {savedDocument.currentSelectedWordCount.toLocaleString()}{" "}
                        selected words.
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{
                            width: `${savedDocument.progressPercentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Saved PDF persistence is localStorage only; nothing is uploaded. */
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-zinc-500">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    >
                      <path d="M6 2h8l4 4v16H6z" />
                      <path d="M14 2v5h5" />
                      <path d="M9 13h6" />
                      <path d="M9 17h4" />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm font-medium text-zinc-300">
                    No local documents yet.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>

        <GuestUpgradePrompt />
      </main>
    </div>
  );
}
