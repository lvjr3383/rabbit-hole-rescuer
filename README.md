# Rabbit Hole Rescuer

Interrupt the drift with a tough-love tutor that turns YouTube binges into focused learning challenges.

## Quick Start

```bash
npm install
```

Create `.env.local`:

```
OPENAI_API_KEY=your_key_here
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Flow

1. Paste a YouTube link and click "I'm Drifting / Interrupt Me".
2. If auto-fetch fails (common on Vercel), paste a transcript in the fallback box.
3. The left pane locks and the agent presents the challenge on the right.

Tip: Use "Demo Mode" for a one-click walkthrough.

## API

`POST /api/challenge`

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "transcript": "optional manual transcript"
}
```

## Opik (Optional)

`OPIK_API_KEY` and `OPIK_WORKSPACE` are only needed if you run local evaluation scripts.
