"use client";

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { AlertTriangle, Compass, Lock, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type SherpaResponse = {
  overview: string;
  stuck_analysis: string;
  recommendations: string[];
  next_steps: string[];
  flash_cards: {
    front: string;
    back: string;
  }[];
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
  const [transcript, setTranscript] = useState("");
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

  const requestSherpa = async () => {
    setError(null);
    if (!url.trim()) {
      setStatus("error");
      setError("Paste a YouTube link to begin.");
      return;
    }
    if (!transcript.trim()) {
      setStatus("error");
      setError("Paste the transcript so the Sherpa can guide you.");
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
        body: JSON.stringify({ url, transcript, timestamp }),
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
    setTranscript(
      "In this segment, the instructor introduces backpropagation as a way to update weights in a neural network. The chain rule is used to compute gradients step by step through the layers. The key idea is that you measure the error at the output and propagate it backward to adjust earlier layers.",
    );
    setTimestamp("10:30");
    await requestSherpa();
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
              Paste the transcript and (optionally) a timestamp. The Sherpa will
              summarize the video, clarify the stuck point, and map the next
              steps.
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
                      Transcript (required)
                    </label>
                    <textarea
                      value={transcript}
                      onChange={(event) => setTranscript(event.target.value)}
                      placeholder="Paste the full transcript here."
                      className="min-h-[180px] w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-200"
                    />
                    <p className="text-xs text-zinc-500">
                      If your transcript includes timestamps, the Sherpa can
                      focus on a specific moment.
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

                  <div className="mt-6">
                    <button
                      onClick={requestSherpa}
                      disabled={isLoading}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-200",
                        isLoading && "cursor-not-allowed opacity-70",
                      )}
                    >
                      <Compass className="h-4 w-4" />
                      Rescue Me
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
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Video Snapshot
                        </p>
                        <p className="mt-2 text-sm text-zinc-700">
                          {response.overview}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-purple-600">
                          What’s Happening at the Stuck Point
                        </p>
                        <p className="mt-2 text-sm text-purple-800">
                          {response.stuck_analysis}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
                          Rescue Map (Prerequisites)
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          {response.recommendations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Next Steps
                        </p>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
                          {response.next_steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Flash Cards
                        </p>
                        <ul className="mt-3 space-y-4 text-sm text-zinc-800">
                          {response.flash_cards.map((card, idx) => (
                            <li key={`${card.front}-${idx}`} className="space-y-2">
                              <p className="font-medium text-zinc-800">
                                {card.front}
                              </p>
                              <button
                                onClick={() => toggleAnswer(idx)}
                                className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-600 transition hover:text-purple-800"
                                type="button"
                              >
                                {revealedAnswers[idx] ? "Hide Card" : "Flip Card"}
                              </button>
                              {revealedAnswers[idx] && (
                                <div className="rounded-xl border border-purple-200 bg-white p-3 text-sm text-zinc-700">
                                  {card.back}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
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
