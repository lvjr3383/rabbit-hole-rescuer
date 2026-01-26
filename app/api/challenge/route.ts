import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { extractVideoId, fetchTranscript } from "@/app/lib/youtube";

const challengeSchema = z.object({
  analysis: z.object({
    content_type: z.enum(["educational", "entertainment"]),
    topic: z.string(),
  }),
  challenge: z.object({
    title: z.string(),
    instructions: z.string(),
    questions: z.array(z.string()).min(3).max(3),
  }),
});

const systemPrompt = [
  "You are a Tough Love Tutor.",
  "Analyze the transcript and decide if it is educational or entertainment.",
  "If educational: set analysis.content_type to 'educational' and provide exactly 3 Socratic questions that require deep understanding.",
  "If entertainment: set analysis.content_type to 'entertainment', gently roast the user in the instructions, and still provide 3 reflective questions.",
  "Keep the tone firm but helpful. Keep the output concise.",
].join(" ");

const MAX_TRANSCRIPT_CHARS = 5000;

function normalizeTranscript(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function trimTranscript(text: string) {
  if (text.length <= MAX_TRANSCRIPT_CHARS) {
    return { text, trimmed: false };
  }
  return { text: text.slice(0, MAX_TRANSCRIPT_CHARS), trimmed: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url : "";
    const manualTranscript =
      typeof body?.transcript === "string" ? body.transcript.trim() : "";

    let transcriptText = manualTranscript;

    if (!transcriptText) {
      const videoId = url ? extractVideoId(url) : null;
      if (!videoId) {
        return NextResponse.json(
          { error: "Provide a valid YouTube link or paste the transcript." },
          { status: 400 },
        );
      }

      transcriptText = (await fetchTranscript(videoId)) ?? "";
    }

    if (!transcriptText) {
      return NextResponse.json(
        {
          error:
            "Transcript fetch failed or is unavailable for this video. Paste the transcript manually or use Demo Mode.",
        },
        { status: 400 },
      );
    }

    const normalized = normalizeTranscript(transcriptText);
    const { text: trimmedTranscript, trimmed } = trimTranscript(normalized);

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: challengeSchema,
      system: systemPrompt,
      prompt: `Transcript (may be truncated):\n${trimmedTranscript}\n\n${
        trimmed
          ? "Note: Transcript was trimmed for speed. Prioritize the core ideas."
          : ""
      }`,
      maxTokens: 600,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("challenge route failed", error);
    return NextResponse.json(
      { error: "Unable to generate a challenge right now." },
      { status: 500 },
    );
  }
}
