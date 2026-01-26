"use client";

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { AlertTriangle, Lock, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type Challenge = {
  analysis: {
    content_type: string;
    topic: string;
  };
  challenge: {
    title: string;
    instructions: string;
    questions: string[];
  };
};

const YOUTUBE_ID_REGEX = /(?:v=|\/)([A-Za-z0-9_-]{11})(?:\?|&|$)/;
const DEMO_URL = "https://www.youtube.com/watch?v=aircAruvnKk";
const DEMO_TRANSCRIPT =
  "The speaker explains how attention gets shaped by feedback loops. When a system learns what you click, it optimizes for more of the same. Curiosity is powerful, but it needs a question to anchor it. Define the question, collect evidence, then summarize the takeaway in your own words. Intentional learning beats endless scrolling.";

function extractVideoIdLocal(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : "";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoId = useMemo(() => extractVideoIdLocal(url), [url]);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  const statusLabel =
    status === "ready"
      ? "Engaged"
      : status === "loading"
        ? "Analyzing..."
        : status === "error"
          ? "Needs Input"
          : "Monitoring...";
  const isLoading = status === "loading";

  const requestChallenge = async (payload?: {
    url?: string;
    transcript?: string;
  }) => {
    setError(null);
    const requestUrl = (payload?.url ?? url).trim();
    const requestTranscript = (payload?.transcript ?? manualTranscript).trim();

    if (!requestUrl && !requestTranscript) {
      setStatus("error");
      setError("Paste a YouTube link or provide a transcript.");
      return;
    }

    setStatus("loading");
    setLocked(false);
    setChallenge(null);

    try {
      const response = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: requestUrl,
          transcript: requestTranscript,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to generate a challenge.");
      }

      setChallenge(data);
      setStatus("ready");
      setLocked(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  };

  const handleInterrupt = async () => {
    if (isLoading) {
      return;
    }
    await requestChallenge();
  };

  const handleDemo = async () => {
    if (isLoading) {
      return;
    }
    setUrl(DEMO_URL);
    setManualTranscript(DEMO_TRANSCRIPT);
    await requestChallenge({ url: DEMO_URL, transcript: DEMO_TRANSCRIPT });
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
              Stop the drift. Challenge the rabbit hole.
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 md:text-lg">
              Drop a YouTube link, hit interrupt, and let the agent pull you
              back into focus with a sharp, no-excuses challenge.
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
                      Manual Transcript (Fallback)
                    </label>
                    <textarea
                      value={manualTranscript}
                      onChange={(event) =>
                        setManualTranscript(event.target.value)
                      }
                      placeholder="Paste transcript if auto-fetch fails."
                      className="min-h-[140px] w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-zinc-500">
                      Auto-fetch may fail on Vercel. Manual paste always works.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleInterrupt}
                      disabled={isLoading}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-3 rounded-2xl border border-purple-200 bg-purple-100 px-5 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-200",
                        isLoading && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <Play className="h-4 w-4" />
                      {isLoading
                        ? "Interrupting..."
                        : "I'm Drifting / Interrupt Me"}
                    </button>
                    <button
                      onClick={handleDemo}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 transition hover:border-purple-300 hover:text-purple-700",
                        isLoading && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      Demo Mode
                    </button>
                  </div>
                </div>

                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-purple-300 bg-white/70 text-purple-700">
                    <div className="flex items-center gap-3 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm">
                      <Lock className="h-4 w-4" />
                      Left pane locked. Focus on the challenge.
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
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-purple-600">
                      Agent Interface
                    </p>
                    <p className="text-xs text-zinc-500">{statusLabel}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {status === "idle" && (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                      Monitoring... ready to interrupt the drift.
                    </div>
                  )}

                  {status === "loading" && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700">
                      Analyzing transcript. Stand by for the challenge.
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

                  {status === "ready" && challenge && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-purple-700">
                        <span className="rounded-full border border-purple-200 bg-purple-100 px-3 py-1">
                          {challenge.analysis.content_type}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-zinc-600">
                          {challenge.analysis.topic}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                          {challenge.challenge.title}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600">
                          {challenge.challenge.instructions}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Socratic Questions
                        </p>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-800">
                          {challenge.challenge.questions.map((question, idx) => (
                            <li key={`${question}-${idx}`}>{question}</li>
                          ))}
                        </ol>
                      </div>
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
