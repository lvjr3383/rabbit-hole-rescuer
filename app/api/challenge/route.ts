import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { extractVideoId, fetchVideoTitle } from "@/app/lib/youtube";

const requestSchema = z.object({
  url: z.string().optional(),
  mode: z.enum(["lost", "quiz"]),
  note: z.string().optional(),
});

const responseSchema = z.object({
  analysis: z.object({
    topic: z.string(),
    difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  }),
  sherpa: z.object({
    explanation: z.string(),
    analogy: z.string(),
    prerequisite_recommendation: z.array(z.string()).min(2).max(4),
    difficulty_warning: z.boolean(),
  }),
  quiz: z.object({
    questions: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          explanation: z.string(),
        }),
      )
      .min(3)
      .max(3),
  }),
});

const systemPrompt = [
  "You are a friendly Sherpa tutor.",
  "The user is watching a video with a given title and needs guidance.",
  "Always provide a concise explanation and a simple analogy.",
  "Always provide 2-4 prerequisite topics to learn first, even if the topic is beginner.",
  "If the topic is advanced, set difficulty_warning=true.",
  "If mode is 'lost', focus on explanation, analogy, and prerequisite guidance.",
  "If mode is 'quiz', still give a short explanation but focus on 3 foundational questions.",
  "Keep answers short, practical, and confidence-boosting.",
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

    const { url, mode, note } = parsed.data;
    const videoId = url ? extractVideoId(url) : null;
    const title =
      (videoId ? await fetchVideoTitle(videoId) : null) ||
      "a topic you are learning right now";

    const prompt = [
      `Video title: "${title}".`,
      note ? `User note: "${note}".` : "User note: (none).",
      `Mode: ${mode}.`,
      "Provide guidance based on the title and note; do not reference timestamps.",
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
        analysis: { topic: "General Topic", difficulty_level: "Beginner" },
        sherpa: {
          explanation:
            "I can still help even without the transcript. Tell me what part feels confusing.",
          analogy:
            "Learning a new topic is like hiking a trail — sometimes you just need a clearer map.",
          prerequisite_recommendation: [
            "Core definitions and vocabulary",
            "A simple example problem",
            "Why the topic matters in real life",
          ],
          difficulty_warning: false,
        },
        quiz: {
          questions: [
            {
              question: "What is the core idea you are trying to learn?",
              answer: "Define the main concept in one sentence.",
              explanation: "Start with the simplest possible summary.",
            },
            {
              question: "What is one term you do not understand?",
              answer: "Pick a term and look up a quick definition.",
              explanation: "Naming the gap makes it easier to fill.",
            },
            {
              question: "How would you explain this to a friend?",
              answer: "Use a real-world analogy or example.",
              explanation: "If you can teach it, you understand it.",
            },
          ],
        },
      },
      { status: 200 },
    );
  }
}
