"use client";

import { useState } from "react";
import { Question } from "@/lib/types";

interface Props {
  chunkTitle: string;
  wpm: number;
  questions: Question[];
  onSubmit: (answers: (number | null)[]) => void;
}

export function QuizScreen({ chunkTitle, wpm, questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const progressPercent =
    questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;

  function select(qi: number, oi: number) {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Retention
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Comprehension check
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            You just read &ldquo;{chunkTitle}&rdquo; at roughly{" "}
            <strong className="font-semibold text-amber-300">{wpm} wpm</strong>
            . Answer these questions to test your retention.
          </p>
        </div>
        <div className="w-fit rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-300">
          <span className="text-amber-300">{answeredCount}</span>
          <span className="text-zinc-500"> / {questions.length}</span>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <section
            key={qi}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5"
          >
            <p className="mb-3 text-sm font-semibold leading-6 text-white">
              <span className="mr-2 font-mono text-xs text-amber-300">
                {String(qi + 1).padStart(2, "0")}
              </span>
              {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm leading-5 transition-all ${
                    answers[qi] === oi
                      ? "border-amber-400/50 bg-amber-500/15 text-amber-100 shadow-lg shadow-amber-950/20"
                      : "border-white/10 bg-white/[0.025] text-zinc-300 hover:border-amber-400/25 hover:bg-amber-500/6 hover:text-amber-100"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() => select(qi, oi)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(answers)}
        className="h-12 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-xl shadow-amber-900/35 transition-all duration-200 hover:from-amber-400 hover:to-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
      >
        Submit answers
      </button>
    </div>
  );
}
