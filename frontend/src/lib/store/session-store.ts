import { create } from "zustand";
import type { Question } from "@/lib/types";

interface SessionData {
  sessionId: string;
  fileId: string;
  targetWpm: number;
  words: string[];
  quizQuestions: Question[];
}

interface SessionStore {
  sessionData: SessionData | null;
  setSessionData: (data: SessionData) => void;
  clearSessionData: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  sessionData: null,
  setSessionData: (data: SessionData) => set({ sessionData: data }),
  clearSessionData: () => set({ sessionData: null }),
}));
