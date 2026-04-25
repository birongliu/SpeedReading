export type GuestDocument = {
  title: string;
  text: string;
  wordCount: number;
  uploadedAt: string;
  savedDocumentId?: string;
  currentWordIndex?: number;
  currentWpm?: number;
  currentFocusMode?: GuestFocusMode;
  elapsedSeconds?: number;
  currentReadingScope?: string;
  currentSelectedText?: string;
  currentSelectedWordCount?: number;
};

export type GuestSavedDocument = GuestDocument & {
  id: string;
  currentWordIndex: number;
  currentWpm: number;
  currentFocusMode: GuestFocusMode;
  elapsedSeconds: number;
  currentReadingScope: string;
  currentSelectedText: string;
  currentSelectedWordCount: number;
  progressPercentage: number;
  progressPercent: number;
  lastReadAt?: string;
  completedAt?: string;
};

export type GuestFocusMode = "highlight" | "focal-point" | "line-focus";

export type GuestSession = {
  id: string;
  savedDocumentId?: string;
  documentTitle: string;
  originalWordCount: number;
  selectedText: string;
  selectedWordCount: number;
  targetWpm: number;
  focusMode: GuestFocusMode;
  readingScope: string;
  startWordIndex: number;
  startElapsedSeconds: number;
  startedAt: string;
};

export type GuestResult = {
  documentTitle: string;
  targetWpm: number;
  finalSelectedWpm: number;
  effectiveWpm: number;
  wordsRead: number;
  durationSeconds: number;
  completedAt: string;
};

// These keys are the contract between the guest pages.
// They keep guest data in browser sessionStorage instead of any backend.
const GUEST_DOCUMENT_TITLE_KEY = "guestDocumentTitle";
const GUEST_DOCUMENT_TEXT_KEY = "guestDocumentText";
const GUEST_DOCUMENT_WORD_COUNT_KEY = "guestDocumentWordCount";
const GUEST_DOCUMENT_UPLOADED_AT_KEY = "guestDocumentUploadedAt";
const GUEST_DOCUMENT_SAVED_DOCUMENT_ID_KEY = "guestDocumentSavedDocumentId";
const GUEST_DOCUMENT_CURRENT_WORD_INDEX_KEY = "guestDocumentCurrentWordIndex";
const GUEST_DOCUMENT_CURRENT_WPM_KEY = "guestDocumentCurrentWpm";
const GUEST_DOCUMENT_CURRENT_FOCUS_MODE_KEY = "guestDocumentCurrentFocusMode";
const GUEST_DOCUMENT_ELAPSED_SECONDS_KEY = "guestDocumentElapsedSeconds";
const GUEST_DOCUMENT_CURRENT_READING_SCOPE_KEY =
  "guestDocumentCurrentReadingScope";
const GUEST_DOCUMENT_CURRENT_SELECTED_TEXT_KEY =
  "guestDocumentCurrentSelectedText";
const GUEST_DOCUMENT_CURRENT_SELECTED_WORD_COUNT_KEY =
  "guestDocumentCurrentSelectedWordCount";
const GUEST_SAVED_DOCUMENTS_KEY = "guestSavedDocuments";
const GUEST_SESSION_ID_KEY = "guestSessionId";
const GUEST_SESSION_SAVED_DOCUMENT_ID_KEY = "guestSessionSavedDocumentId";
const GUEST_SESSION_DOCUMENT_TITLE_KEY = "guestSessionDocumentTitle";
const GUEST_SESSION_ORIGINAL_WORD_COUNT_KEY =
  "guestSessionOriginalWordCount";
const GUEST_SESSION_SELECTED_TEXT_KEY = "guestSessionSelectedText";
const GUEST_SESSION_SELECTED_WORD_COUNT_KEY = "guestSessionSelectedWordCount";
const GUEST_SESSION_TARGET_WPM_KEY = "guestSessionTargetWpm";
const GUEST_SESSION_FOCUS_MODE_KEY = "guestSessionFocusMode";
const GUEST_SESSION_READING_SCOPE_KEY = "guestSessionReadingScope";
const GUEST_SESSION_START_WORD_INDEX_KEY = "guestSessionStartWordIndex";
const GUEST_SESSION_START_ELAPSED_SECONDS_KEY =
  "guestSessionStartElapsedSeconds";
const GUEST_SESSION_STARTED_AT_KEY = "guestSessionStartedAt";
const GUEST_RESULT_DOCUMENT_TITLE_KEY = "guestResultDocumentTitle";
const GUEST_RESULT_TARGET_WPM_KEY = "guestResultTargetWpm";
const GUEST_RESULT_FINAL_SELECTED_WPM_KEY = "guestResultFinalSelectedWpm";
const GUEST_RESULT_EFFECTIVE_WPM_KEY = "guestResultEffectiveWpm";
const GUEST_RESULT_WORDS_READ_KEY = "guestResultWordsRead";
const GUEST_RESULT_DURATION_SECONDS_KEY = "guestResultDurationSeconds";
const GUEST_RESULT_COMPLETED_AT_KEY = "guestResultCompletedAt";

const createGuestDocumentId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest-doc-${Date.now()}`;
};

// Saves the selected guest document locally so /guest/configure can load it.
export function saveGuestDocument(document: GuestDocument) {
  sessionStorage.setItem(GUEST_DOCUMENT_TITLE_KEY, document.title);
  sessionStorage.setItem(GUEST_DOCUMENT_TEXT_KEY, document.text);
  sessionStorage.setItem(
    GUEST_DOCUMENT_WORD_COUNT_KEY,
    String(document.wordCount),
  );
  sessionStorage.setItem(GUEST_DOCUMENT_UPLOADED_AT_KEY, document.uploadedAt);

  if (document.savedDocumentId) {
    sessionStorage.setItem(
      GUEST_DOCUMENT_SAVED_DOCUMENT_ID_KEY,
      document.savedDocumentId,
    );
  } else {
    sessionStorage.removeItem(GUEST_DOCUMENT_SAVED_DOCUMENT_ID_KEY);
  }

  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_WORD_INDEX_KEY,
    String(document.currentWordIndex ?? 0),
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_WPM_KEY,
    String(document.currentWpm ?? 300),
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_FOCUS_MODE_KEY,
    document.currentFocusMode ?? "highlight",
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_ELAPSED_SECONDS_KEY,
    String(document.elapsedSeconds ?? 0),
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_READING_SCOPE_KEY,
    document.currentReadingScope ?? "Entire document",
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_SELECTED_TEXT_KEY,
    document.currentSelectedText ?? document.text,
  );
  sessionStorage.setItem(
    GUEST_DOCUMENT_CURRENT_SELECTED_WORD_COUNT_KEY,
    String(document.currentSelectedWordCount ?? document.wordCount),
  );
}

// Reads the selected document back from sessionStorage and validates the shape.
export function getGuestDocument(): GuestDocument | null {
  const title = sessionStorage.getItem(GUEST_DOCUMENT_TITLE_KEY);
  const text = sessionStorage.getItem(GUEST_DOCUMENT_TEXT_KEY);
  const wordCountValue = sessionStorage.getItem(GUEST_DOCUMENT_WORD_COUNT_KEY);
  const uploadedAt = sessionStorage.getItem(GUEST_DOCUMENT_UPLOADED_AT_KEY);
  const savedDocumentId =
    sessionStorage.getItem(GUEST_DOCUMENT_SAVED_DOCUMENT_ID_KEY) ?? undefined;
  const currentWordIndexValue =
    sessionStorage.getItem(GUEST_DOCUMENT_CURRENT_WORD_INDEX_KEY) ?? "0";
  const currentWpmValue =
    sessionStorage.getItem(GUEST_DOCUMENT_CURRENT_WPM_KEY) ?? "300";
  const currentFocusMode =
    (sessionStorage.getItem(
      GUEST_DOCUMENT_CURRENT_FOCUS_MODE_KEY,
    ) as GuestFocusMode | null) ?? "highlight";
  const elapsedSecondsValue =
    sessionStorage.getItem(GUEST_DOCUMENT_ELAPSED_SECONDS_KEY) ?? "0";
  const currentReadingScope =
    sessionStorage.getItem(GUEST_DOCUMENT_CURRENT_READING_SCOPE_KEY) ??
    "Entire document";
  const currentSelectedText =
    sessionStorage.getItem(GUEST_DOCUMENT_CURRENT_SELECTED_TEXT_KEY) ??
    text ??
    "";
  const currentSelectedWordCountValue =
    sessionStorage.getItem(GUEST_DOCUMENT_CURRENT_SELECTED_WORD_COUNT_KEY) ??
    wordCountValue;

  if (!title || !text || !wordCountValue || !uploadedAt) return null;

  const wordCount = Number(wordCountValue);
  const currentWordIndex = Number(currentWordIndexValue);
  const currentWpm = Number(currentWpmValue);
  const elapsedSeconds = Number(elapsedSecondsValue);
  const currentSelectedWordCount = Number(currentSelectedWordCountValue);

  if (
    !Number.isFinite(wordCount) ||
    !Number.isFinite(currentWordIndex) ||
    !Number.isFinite(currentWpm) ||
    !Number.isFinite(elapsedSeconds) ||
    !Number.isFinite(currentSelectedWordCount)
  ) {
    return null;
  }

  return {
    title,
    text,
    wordCount,
    uploadedAt,
    savedDocumentId,
    currentWordIndex,
    currentWpm,
    currentFocusMode,
    elapsedSeconds,
    currentReadingScope,
    currentSelectedText,
    currentSelectedWordCount,
  };
}

// Reads all locally saved guest documents from localStorage.
export function getGuestSavedDocuments(): GuestSavedDocument[] {
  const rawDocuments = localStorage.getItem(GUEST_SAVED_DOCUMENTS_KEY);
  if (!rawDocuments) return [];

  try {
    const parsedDocuments = JSON.parse(rawDocuments) as GuestSavedDocument[];
    if (!Array.isArray(parsedDocuments)) return [];

    return parsedDocuments
      .filter(
        (document) =>
          typeof document.id === "string" &&
          typeof document.title === "string" &&
          typeof document.text === "string" &&
          Number.isFinite(document.wordCount) &&
          typeof document.uploadedAt === "string",
      )
      .map((document) => ({
        ...document,
        currentWordIndex: Number.isFinite(document.currentWordIndex)
          ? document.currentWordIndex
          : 0,
        currentWpm: Number.isFinite(document.currentWpm)
          ? document.currentWpm
          : 300,
        currentFocusMode: document.currentFocusMode ?? "highlight",
        elapsedSeconds: Number.isFinite(document.elapsedSeconds)
          ? document.elapsedSeconds
          : 0,
        currentReadingScope: document.currentReadingScope ?? "Entire document",
        currentSelectedText: document.currentSelectedText ?? document.text,
        currentSelectedWordCount: Number.isFinite(
          document.currentSelectedWordCount,
        )
          ? document.currentSelectedWordCount
          : document.wordCount,
        progressPercentage: Number.isFinite(document.progressPercentage)
          ? document.progressPercentage
          : document.progressPercent || 0,
        progressPercent: Number.isFinite(document.progressPercent)
          ? document.progressPercent
          : document.progressPercentage || 0,
      }));
  } catch {
    return [];
  }
}

// Saves or replaces one uploaded PDF in localStorage under guestSavedDocuments.
export function saveGuestSavedDocument(
  document: GuestDocument,
): GuestSavedDocument {
  const savedDocuments = getGuestSavedDocuments();
  const existingDocument = savedDocuments.find(
    (savedDocument) => savedDocument.title === document.title,
  );
  const savedDocument: GuestSavedDocument = {
    ...document,
    id: existingDocument?.id ?? createGuestDocumentId(),
    currentWordIndex: existingDocument?.currentWordIndex ?? 0,
    currentWpm: existingDocument?.currentWpm ?? 300,
    currentFocusMode: existingDocument?.currentFocusMode ?? "highlight",
    elapsedSeconds: existingDocument?.elapsedSeconds ?? 0,
    currentReadingScope:
      existingDocument?.currentReadingScope ?? "Entire document",
    currentSelectedText: existingDocument?.currentSelectedText ?? document.text,
    currentSelectedWordCount:
      existingDocument?.currentSelectedWordCount ?? document.wordCount,
    progressPercentage: existingDocument?.progressPercentage ?? 0,
    progressPercent: existingDocument?.progressPercent ?? 0,
    lastReadAt: existingDocument?.lastReadAt,
    completedAt: existingDocument?.completedAt,
    savedDocumentId: existingDocument?.id,
  };
  savedDocument.savedDocumentId = savedDocument.id;
  const nextDocuments = [
    savedDocument,
    ...savedDocuments.filter(
      (existingDocument) => existingDocument.title !== document.title,
    ),
  ];

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );

  return savedDocument;
}

// Removes one saved guest document from localStorage.
export function deleteGuestSavedDocument(documentId: string) {
  const nextDocuments = getGuestSavedDocuments().filter(
    (document) => document.id !== documentId,
  );

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );
}

export function updateGuestSavedDocumentProgress(
  documentId: string,
  progress: {
    currentWordIndex: number;
    currentWpm: number;
    currentFocusMode?: GuestFocusMode;
    elapsedSeconds: number;
    currentReadingScope?: string;
    currentSelectedText?: string;
    currentSelectedWordCount?: number;
    progressPercent: number;
    lastReadAt: string;
    completedAt?: string;
  },
) {
  const nextDocuments = getGuestSavedDocuments().map((document) => {
    if (document.id !== documentId) return document;

    return {
      ...document,
      currentWordIndex: progress.currentWordIndex,
      currentWpm: progress.currentWpm,
      currentFocusMode: progress.currentFocusMode ?? document.currentFocusMode,
      elapsedSeconds: progress.elapsedSeconds,
      currentReadingScope:
        progress.currentReadingScope ?? document.currentReadingScope,
      currentSelectedText:
        progress.currentSelectedText ?? document.currentSelectedText,
      currentSelectedWordCount:
        progress.currentSelectedWordCount ?? document.currentSelectedWordCount,
      progressPercentage: progress.progressPercent,
      progressPercent: progress.progressPercent,
      lastReadAt: progress.lastReadAt,
      completedAt:
        progress.completedAt ??
        (progress.progressPercent >= 100 ? document.completedAt : undefined),
    };
  });

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );
}

export function clearGuestSavedDocumentProgress(documentId: string) {
  const clearedAt = new Date().toISOString();
  const nextDocuments = getGuestSavedDocuments().map((document) => {
    if (document.id !== documentId) return document;

    return {
      ...document,
      currentWordIndex: 0,
      elapsedSeconds: 0,
      currentReadingScope: "Entire document",
      currentSelectedText: document.text,
      currentSelectedWordCount: document.wordCount,
      progressPercentage: 0,
      progressPercent: 0,
      lastReadAt: clearedAt,
      completedAt: undefined,
    };
  });

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );
}

export function clearAllGuestSavedDocumentProgress() {
  const clearedAt = new Date().toISOString();
  const nextDocuments = getGuestSavedDocuments().map((document) => ({
    ...document,
    currentWordIndex: 0,
    elapsedSeconds: 0,
    currentReadingScope: "Entire document",
    currentSelectedText: document.text,
    currentSelectedWordCount: document.wordCount,
    progressPercentage: 0,
    progressPercent: 0,
    lastReadAt: clearedAt,
    completedAt: undefined,
  }));

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );
}

// Saves the configured reading session for the future /guest/read page.
export function saveGuestSession(session: GuestSession) {
  sessionStorage.setItem(GUEST_SESSION_ID_KEY, session.id);
  if (session.savedDocumentId) {
    sessionStorage.setItem(
      GUEST_SESSION_SAVED_DOCUMENT_ID_KEY,
      session.savedDocumentId,
    );
  } else {
    sessionStorage.removeItem(GUEST_SESSION_SAVED_DOCUMENT_ID_KEY);
  }
  sessionStorage.setItem(
    GUEST_SESSION_DOCUMENT_TITLE_KEY,
    session.documentTitle,
  );
  sessionStorage.setItem(
    GUEST_SESSION_ORIGINAL_WORD_COUNT_KEY,
    String(session.originalWordCount),
  );
  sessionStorage.setItem(GUEST_SESSION_SELECTED_TEXT_KEY, session.selectedText);
  sessionStorage.setItem(
    GUEST_SESSION_SELECTED_WORD_COUNT_KEY,
    String(session.selectedWordCount),
  );
  sessionStorage.setItem(
    GUEST_SESSION_TARGET_WPM_KEY,
    String(session.targetWpm),
  );
  sessionStorage.setItem(GUEST_SESSION_FOCUS_MODE_KEY, session.focusMode);
  sessionStorage.setItem(GUEST_SESSION_READING_SCOPE_KEY, session.readingScope);
  sessionStorage.setItem(
    GUEST_SESSION_START_WORD_INDEX_KEY,
    String(session.startWordIndex),
  );
  sessionStorage.setItem(
    GUEST_SESSION_START_ELAPSED_SECONDS_KEY,
    String(session.startElapsedSeconds),
  );
  sessionStorage.setItem(GUEST_SESSION_STARTED_AT_KEY, session.startedAt);
}

// Reads the active guest session created by /guest/configure.
export function getGuestSession(): GuestSession | null {
  const id = sessionStorage.getItem(GUEST_SESSION_ID_KEY);
  const savedDocumentId =
    sessionStorage.getItem(GUEST_SESSION_SAVED_DOCUMENT_ID_KEY) ?? undefined;
  const documentTitle = sessionStorage.getItem(GUEST_SESSION_DOCUMENT_TITLE_KEY);
  const originalWordCountValue = sessionStorage.getItem(
    GUEST_SESSION_ORIGINAL_WORD_COUNT_KEY,
  );
  const selectedText = sessionStorage.getItem(GUEST_SESSION_SELECTED_TEXT_KEY);
  const selectedWordCountValue = sessionStorage.getItem(
    GUEST_SESSION_SELECTED_WORD_COUNT_KEY,
  );
  const targetWpmValue = sessionStorage.getItem(GUEST_SESSION_TARGET_WPM_KEY);
  const focusMode = sessionStorage.getItem(
    GUEST_SESSION_FOCUS_MODE_KEY,
  ) as GuestFocusMode | null;
  const readingScope =
    sessionStorage.getItem(GUEST_SESSION_READING_SCOPE_KEY) ??
    "Entire document";
  const startWordIndexValue =
    sessionStorage.getItem(GUEST_SESSION_START_WORD_INDEX_KEY) ?? "0";
  const startElapsedSecondsValue =
    sessionStorage.getItem(GUEST_SESSION_START_ELAPSED_SECONDS_KEY) ?? "0";
  const startedAt = sessionStorage.getItem(GUEST_SESSION_STARTED_AT_KEY);

  if (
    !id ||
    !documentTitle ||
    !originalWordCountValue ||
    !selectedText ||
    !selectedWordCountValue ||
    !targetWpmValue ||
    !focusMode ||
    !startedAt
  ) {
    return null;
  }

  const originalWordCount = Number(originalWordCountValue);
  const selectedWordCount = Number(selectedWordCountValue);
  const targetWpm = Number(targetWpmValue);
  const startWordIndex = Number(startWordIndexValue);
  const startElapsedSeconds = Number(startElapsedSecondsValue);

  if (
    !Number.isFinite(originalWordCount) ||
    !Number.isFinite(selectedWordCount) ||
    !Number.isFinite(targetWpm) ||
    !Number.isFinite(startWordIndex) ||
    !Number.isFinite(startElapsedSeconds)
  ) {
    return null;
  }

  return {
    id,
    savedDocumentId,
    documentTitle,
    originalWordCount,
    selectedText,
    selectedWordCount,
    targetWpm,
    focusMode,
    readingScope,
    startWordIndex,
    startElapsedSeconds,
    startedAt,
  };
}

// Saves the local result that /guest/results can display later.
export function saveGuestResult(result: GuestResult) {
  sessionStorage.setItem(
    GUEST_RESULT_DOCUMENT_TITLE_KEY,
    result.documentTitle,
  );
  sessionStorage.setItem(GUEST_RESULT_TARGET_WPM_KEY, String(result.targetWpm));
  sessionStorage.setItem(
    GUEST_RESULT_FINAL_SELECTED_WPM_KEY,
    String(result.finalSelectedWpm),
  );
  sessionStorage.setItem(
    GUEST_RESULT_EFFECTIVE_WPM_KEY,
    String(result.effectiveWpm),
  );
  sessionStorage.setItem(GUEST_RESULT_WORDS_READ_KEY, String(result.wordsRead));
  sessionStorage.setItem(
    GUEST_RESULT_DURATION_SECONDS_KEY,
    String(result.durationSeconds),
  );
  sessionStorage.setItem(GUEST_RESULT_COMPLETED_AT_KEY, result.completedAt);

  const nextDocuments = getGuestSavedDocuments().map((document) => {
    if (document.title !== result.documentTitle) return document;

    return {
      ...document,
      progressPercentage: Math.min(
        100,
        Math.round((result.wordsRead / document.wordCount) * 100),
      ),
      progressPercent: Math.min(
        100,
        Math.round((result.wordsRead / document.wordCount) * 100),
      ),
      lastReadAt: result.completedAt,
    };
  });

  localStorage.setItem(
    GUEST_SAVED_DOCUMENTS_KEY,
    JSON.stringify(nextDocuments),
  );
}

// Reads the completed result that /guest/read saved after ending the session.
export function getGuestResult(): GuestResult | null {
  const documentTitle = sessionStorage.getItem(GUEST_RESULT_DOCUMENT_TITLE_KEY);
  const targetWpmValue = sessionStorage.getItem(GUEST_RESULT_TARGET_WPM_KEY);
  const finalSelectedWpmValue =
    sessionStorage.getItem(GUEST_RESULT_FINAL_SELECTED_WPM_KEY) ??
    targetWpmValue;
  const effectiveWpmValue = sessionStorage.getItem(
    GUEST_RESULT_EFFECTIVE_WPM_KEY,
  );
  const wordsReadValue = sessionStorage.getItem(GUEST_RESULT_WORDS_READ_KEY);
  const durationSecondsValue = sessionStorage.getItem(
    GUEST_RESULT_DURATION_SECONDS_KEY,
  );
  const completedAt = sessionStorage.getItem(GUEST_RESULT_COMPLETED_AT_KEY);

  if (
    !documentTitle ||
    !targetWpmValue ||
    !finalSelectedWpmValue ||
    !effectiveWpmValue ||
    !wordsReadValue ||
    !durationSecondsValue ||
    !completedAt
  ) {
    return null;
  }

  const targetWpm = Number(targetWpmValue);
  const finalSelectedWpm = Number(finalSelectedWpmValue);
  const effectiveWpm = Number(effectiveWpmValue);
  const wordsRead = Number(wordsReadValue);
  const durationSeconds = Number(durationSecondsValue);

  if (
    !Number.isFinite(targetWpm) ||
    !Number.isFinite(finalSelectedWpm) ||
    !Number.isFinite(effectiveWpm) ||
    !Number.isFinite(wordsRead) ||
    !Number.isFinite(durationSeconds)
  ) {
    return null;
  }

  return {
    documentTitle,
    targetWpm,
    finalSelectedWpm,
    effectiveWpm,
    wordsRead,
    durationSeconds,
    completedAt,
  };
}

// Clears the configured session and completed result while keeping the document.
export function clearGuestSessionAndResult() {
  [
    GUEST_SESSION_ID_KEY,
    GUEST_SESSION_SAVED_DOCUMENT_ID_KEY,
    GUEST_SESSION_DOCUMENT_TITLE_KEY,
    GUEST_SESSION_ORIGINAL_WORD_COUNT_KEY,
    GUEST_SESSION_SELECTED_TEXT_KEY,
    GUEST_SESSION_SELECTED_WORD_COUNT_KEY,
    GUEST_SESSION_TARGET_WPM_KEY,
    GUEST_SESSION_FOCUS_MODE_KEY,
    GUEST_SESSION_READING_SCOPE_KEY,
    GUEST_SESSION_START_WORD_INDEX_KEY,
    GUEST_SESSION_START_ELAPSED_SECONDS_KEY,
    GUEST_SESSION_STARTED_AT_KEY,
    GUEST_RESULT_DOCUMENT_TITLE_KEY,
    GUEST_RESULT_TARGET_WPM_KEY,
    GUEST_RESULT_FINAL_SELECTED_WPM_KEY,
    GUEST_RESULT_EFFECTIVE_WPM_KEY,
    GUEST_RESULT_WORDS_READ_KEY,
    GUEST_RESULT_DURATION_SECONDS_KEY,
    GUEST_RESULT_COMPLETED_AT_KEY,
  ].forEach((key) => sessionStorage.removeItem(key));
}

// Shared word counter used for PDFs, sample texts, and selected ranges.
export function countDocumentWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
