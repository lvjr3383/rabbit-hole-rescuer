"use client";

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { AlertTriangle, Compass, Lock, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type SherpaResponse = {
  analysis: {
    topic: string;
    difficulty_level: "Beginner" | "Intermediate" | "Advanced";
  };
  sherpa: {
    explanation: string;
    analogy: string;
    prerequisite_recommendation: string[];
    difficulty_warning: boolean;
  };
  quiz: {
    questions: {
      question: string;
      answer: string;
      explanation: string;
    }[];
  };
};

const DEMO_URL = "https://www.youtube.com/watch?v=aircAruvnKk";

function extractVideoIdLocal(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:\?|&|$)/);
  return match ? match[1] : "";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SherpaResponse | null>(null);
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoId = useMemo(() => extractVideoIdLocal(url), [url]);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  const isLoading = status === "loading";
  const statusLabel =
    status === "ready"
      ? "Engaged"
      : status === "loading"
        ? "Analyzing..."
        : status === "error"
          ? "Needs Input"
          : "Monitoring...";

  const requestSherpa = async (mode: "lost" | "quiz") => {
    setError(null);
    if (!url.trim()) {
      setStatus("error");
      setError("Paste a YouTube link to begin.");
      return;
    }

    setStatus("loading");
    setLocked(false);
    setResponse(null);
    setRevealedAnswers({});

    try {
      const result = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode, note, timestamp }),
      });
      const data = await result.json();
      if (!result.ok) {
        throw new Error(data?.error || "Unable to generate a guide.");
      }
      setResponse(data);
      setStatus("ready");
      setLocked(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  };

  const handleDemo = async () => {
    if (isLoading) {
      return;
    }
    setUrl(DEMO_URL);
    setNote("Backpropagation is confusing. What should I learn first?");
    setTimestamp("10:30");
    await requestSherpa("lost");
  };

  const handleResume = () => {
    setLocked(false);
  };

  const toggleAnswer = (index: number) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-[-6rem] h-96 w-96 rounded-full bg-purple-300/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-[60%] h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/40 blur-3xl" />

        <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 font-sans lg:px-10">
          <header
            className={cn(
              "space-y-4 transition-all duration-700 ease-out",
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-600">
              Rabbit Hole Rescuer
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 md:text-5xl">
              A Sherpa for your learning rabbit holes.
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 md:text-lg">
              Drop a video link, tell us where you’re stuck, and the Sherpa
              guides you back with explanations, analogies, and prerequisites.
            </p>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              className={cn(
                "transition-all duration-700 ease-out delay-100",
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-2xl backdrop-blur",
                    locked && "pointer-events-none opacity-60 blur-sm",
                  )}
                >
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span className="uppercase tracking-[0.3em]">
                      Signal Feed
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isLoading ? "bg-amber-500" : "bg-emerald-500",
                        )}
                      />
                      {isLoading ? "Analyzing..." : "Live"}
                    </span>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                    <div className="aspect-video w-full">
                      {embedUrl ? (
                        <iframe
                          title="YouTube preview"
                          src={embedUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-zinc-500">
                          <Play className="h-8 w-8" />
                          <p className="text-sm">
                            Paste a YouTube link to load the video.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="block text-xs uppercase tracking-[0.3em] text-zinc-600">
                      YouTube Link
                    </label>
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    <label className="block text-xs uppercase tracking-[0.3em] text-zinc-600">
                      Specific confusion (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="E.g. Backpropagation math is confusing."
                      className="min-h-[120px] w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-zinc-500">
                      No transcript needed. A short note helps the Sherpa guide
                      you faster.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="block text-xs uppercase tracking-[0.3em] text-zinc-600">
                      Timestamp (optional)
                    </label>
                    <input
                      value={timestamp}
                      onChange={(event) => setTimestamp(event.target.value)}
                      type="text"
                      placeholder="e.g. 10:30"
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-zinc-500">
                      Helps the Sherpa frame guidance around the moment you got
                      stuck.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => requestSherpa("lost")}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-200",
                        isLoading && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <Compass className="h-4 w-4" />
                      I’m Lost
                    </button>
                    <button
                      onClick={() => requestSherpa("quiz")}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-100 px-4 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-200",
                        isLoading && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      Quiz Me
                    </button>
                  </div>

                  <button
                    onClick={handleDemo}
                    disabled={isLoading}
                    className={cn(
                      "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 transition hover:border-purple-300 hover:text-purple-700",
                      isLoading && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Demo Mode
                  </button>
                </div>

                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-purple-300 bg-white/70 text-purple-700">
                    <div className="flex items-center gap-3 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm">
                      <Lock className="h-4 w-4" />
                      Sherpa is guiding you now.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "transition-all duration-700 ease-out delay-200",
                mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
            >
              <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-white via-purple-50 to-white p-6 shadow-[0_30px_80px_-40px_rgba(168,85,247,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 ring-1 ring-purple-200">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-purple-600">
                      Sherpa Interface
                    </p>
                    <p className="text-xs text-zinc-500">{statusLabel}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {status === "idle" && (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                      Paste a video link and choose “I’m Lost” or “Quiz Me” to
                      start.
                    </div>
                  )}

                  {status === "loading" && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700">
                      Thinking through the topic and building your guide.
                    </div>
                  )}

                  {status === "error" && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {status === "ready" && response && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-purple-700">
                        <span className="rounded-full border border-purple-200 bg-purple-100 px-3 py-1">
                          {response.analysis.topic}
                        </span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                          {response.analysis.difficulty_level}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Explanation
                        </p>
                        <p className="mt-2 text-sm text-zinc-700">
                          {response.sherpa.explanation}
                        </p>
                        <p className="mt-3 text-sm text-zinc-600">
                          <span className="font-semibold">Analogy:</span>{" "}
                          {response.sherpa.analogy}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
                          Prerequisites to Review
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          {response.sherpa.prerequisite_recommendation.map(
                            (item) => (
                              <li key={item}>{item}</li>
                            ),
                          )}
                        </ul>
                        {response.sherpa.difficulty_warning && (
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                            Advanced topic detected
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Test Yourself
                        </p>
                        <ol className="mt-3 list-decimal space-y-4 pl-5 text-sm text-zinc-800">
                          {response.quiz.questions.map((item, idx) => (
                            <li
                              key={`${item.question}-${idx}`}
                              className="space-y-2"
                            >
                              <p className="font-medium text-zinc-800">
                                {item.question}
                              </p>
                              <button
                                onClick={() => toggleAnswer(idx)}
                                className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600 transition hover:text-purple-800"
                                type="button"
                              >
                                {revealedAnswers[idx]
                                  ? "Hide Answer"
                                  : "Show Answer"}
                              </button>
                              {revealedAnswers[idx] && (
                                <div className="rounded-xl border border-purple-200 bg-white p-3 text-sm text-zinc-700">
                                  <p className="font-semibold text-zinc-800">
                                    {item.answer}
                                  </p>
                                  <p className="mt-2 text-zinc-600">
                                    {item.explanation}
                                  </p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <button
                        onClick={handleResume}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-purple-300 hover:text-purple-700"
                        type="button"
                      >
                        Resume Video / Unlock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
