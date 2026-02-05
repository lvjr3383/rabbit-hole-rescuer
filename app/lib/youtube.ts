import { YoutubeTranscript } from "youtube-transcript";

const YOUTUBE_ID_REGEX = /(?:v=|\/)([A-Za-z0-9_-]{11})(?:\?|&|$)/;

export async function fetchTranscript(videoId: string): Promise<string | null> {
  if (!videoId) {
    return null;
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return null;
    }
    return transcript.map((entry) => entry.text).join(" ");
  } catch {
    return null;
  }
}

export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  if (!videoId) {
    return null;
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const sources = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      videoUrl,
    )}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`,
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        continue;
      }
      const data = (await response.json()) as { title?: string };
      if (data?.title) {
        return data.title;
      }
    } catch {
      // Try next source.
    }
  }

  return null;
}

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const maybeUrl =
    trimmed.startsWith("http") || !trimmed.includes("youtu")
      ? trimmed
      : `https://${trimmed}`;

  if (maybeUrl.startsWith("http")) {
    try {
      const url = new URL(maybeUrl);
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id || null;
      }

      if (url.hostname.includes("youtube.com")) {
        if (url.pathname.startsWith("/watch")) {
          return url.searchParams.get("v");
        }

        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" || parts[0] === "shorts") {
          return parts[1] || null;
        }
      }
    } catch {
      // Fall back to regex parsing below.
    }
  }

  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}
