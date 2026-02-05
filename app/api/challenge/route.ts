import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { extractVideoId, fetchVideoTitle } from "@/app/lib/youtube";

const requestSchema = z.object({
  url: z.string().optional(),
  transcript: z.string().min(1),
  timestamp: z.string().optional(),
});

const responseSchema = z.object({
  overview: z.string(),
  stuck_analysis: z.string(),
  recommendations: z.array(z.string()).min(2).max(5),
  next_steps: z.array(z.string()).min(2).max(5),
  flash_cards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
      }),
    )
    .min(2)
    .max(5),
});

const systemPrompt = [
  "You are a Sherpa tutor helping someone who got lost mid-video.",
  "You have the full transcript and optional timestamp context.",
  "Return a concise overview of the entire video.",
  "Explain what is happening at the stuck point in plain English.",
  "Provide 2-5 prerequisite recommendations so the user won't get lost again.",
  "Provide a short 2-5 step micro-plan for what to do next.",
  "Create 2-5 flash cards with short front/back prompts for quick recall.",
  "If a timestamp is provided and the transcript includes timestamps, focus on the segment around that time.",
  "If no timestamp or transcript timestamps exist, infer the likely confusing segment based on the transcript.",
].join(" ");

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 },
      );
    }

    const { url, transcript, timestamp } = parsed.data;
    const videoId = url ? extractVideoId(url) : null;
    const title =
      (videoId ? await fetchVideoTitle(videoId) : null) ||
      "a topic you are learning right now";

    const prompt = [
      `Video title: "${title}".`,
      timestamp ? `Timestamp: ${timestamp}.` : "Timestamp: (not provided).",
      "Transcript (may be long):",
      transcript,
      "Provide guidance based on the title, transcript, and timestamp context.",
      "Do not claim you watched the video; use the transcript only.",
    ].join("\n");

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: responseSchema,
      system: systemPrompt,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("challenge route failed", error);
    return NextResponse.json(
      {
        overview:
          "I couldn't process the transcript just now. Please try again with a complete transcript.",
        stuck_analysis:
          "I need the transcript to pinpoint the moment you got stuck.",
        recommendations: [
          "Provide the transcript from the video",
          "Include a timestamp if you have one",
        ],
        next_steps: ["Paste the transcript", "Submit again"],
        flash_cards: [
          {
            front: "What is the topic?",
            back: "Summarize the video in one sentence.",
          },
          {
            front: "Where are you stuck?",
            back: "Note the exact concept or timestamp.",
          },
        ],
      },
      { status: 200 },
    );
  }
}
