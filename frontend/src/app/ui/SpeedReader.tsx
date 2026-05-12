"use client";

import { useCallback, useMemo, useState } from "react";
import { Chunk, Screen } from "@/lib/types";
import { UploadScreen } from "./UploadScreen";
import { ChunkScreen } from "./ChunkScreen";
import { ReadScreen } from "./ReadScreen";
import { QuizScreen } from "./QuizScreen";
import { ResultsScreen } from "./ResultsScreen";

const DEFAULT_WPM = 250;
const MAX_WPM = 800;
const WPM_RETRY_INCREMENT = 50;

export function SpeedReader() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  // --- Derived state ---

  // Memoized so child components see a stable reference when chunks/index haven't changed
  const chunk = useMemo(() => chunks[chunkIdx], [chunks, chunkIdx]);

  // Computed once and reused for both partLabel and the words prop — avoids two identical splits
  const wordList = useMemo(
    () => chunk?.text.split(/\s+/).filter(Boolean) ?? [],
    [chunk],
  );

  // --- Handlers ---

  // useCallback gives each handler a stable reference so child components
  // that receive them as props won't re-render just because SpeedReader re-renders

  const handleAnalyzed = useCallback((c: Chunk[]) => {
    setChunks(c);
    setChunkIdx(0);
    setScreen("chunks");
  }, []);

  const handleStart = useCallback((idx: number, w: number) => {
    setChunkIdx(idx);
    setWpm(w);
    setScreen("read");
  }, []);

  const handleReadFinish = useCallback((_elapsed: number, actualWpm: number) => {
    setWpm(actualWpm);
    setScreen("quiz");
  }, []);

  const handleSubmit = useCallback((a: (number | null)[]) => {
    setAnswers(a);
    setScreen("results");
  }, []);

  const handleRetryFaster = useCallback(() => {
    setWpm((prev) => Math.min(prev + WPM_RETRY_INCREMENT, MAX_WPM));
    setScreen("read");
  }, []);

  // --- Render ---

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {screen === "upload" && (
        <UploadScreen onAnalyzed={handleAnalyzed} />
      )}

      {screen === "chunks" && chunk && (
        <ChunkScreen
          chunks={chunks}
          onStart={handleStart}
          onBack={() => setScreen("upload")}
        />
      )}

      {screen === "read" && chunk && (
        <ReadScreen
          title={chunk.title}
          partLabel={`Part ${chunkIdx + 1} of ${chunks.length} · ${wordList.length} words`}
          words={wordList}
          initialWpm={wpm}
          onFinish={handleReadFinish}
          onQuit={() => setScreen("chunks")}
        />
      )}

      {screen === "quiz" && chunk && (
        <QuizScreen
          chunkTitle={chunk.title}
          wpm={wpm}
          questions={chunk.questions}
          onSubmit={handleSubmit}
        />
      )}

      {screen === "results" && chunk && (
        <ResultsScreen
          questions={chunk.questions}
          answers={answers}
          wpm={wpm}
          onRetryFaster={handleRetryFaster}
          onAnotherChunk={() => setScreen("chunks")}
          onNewText={() => setScreen("upload")}
        />
      )}
    </div>
  );
}
