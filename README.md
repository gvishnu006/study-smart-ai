# Study Smart AI

An AI study companion that turns your own notes into quizzes, summaries,
flashcards and a personalized study timetable — so you always know exactly
what to study next.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**shadcn/ui**, **Framer Motion**, **MongoDB / Mongoose**, **NextAuth** and the
**Anthropic Claude API**.

## Features

- **Materials** — create subjects and chapters, then upload PDFs, Word docs,
  text files or images. Text is extracted server-side (PDF/DOCX/TXT) and via
  on-device OCR for photos of handwritten notes.
- **AI quizzes** — generate MCQ / true-false / fill-in-the-blank / short / long
  questions from your material, or have the AI predict the most likely exam
  questions. Objective answers are graded instantly; subjective answers are
  graded by the AI.
- **AI study tools** — structured summaries (simple or detailed), key points,
  mind maps, flashcard decks and a "chat with your notes" assistant.
- **Study tracker** — stopwatch and Pomodoro timers with a live daily goal,
  weekly/monthly charts, subject breakdown and streaks.
- **Planner** — track every exam with a countdown and syllabus checklist, then
  let the AI generate a balanced weekly timetable. Drag blocks between days to
  fine-tune.
- **Focus mode** — a distraction-free, full-screen timer that logs your session
  and celebrates completion.
- **Doubt solver** — ask any question and get a patient, step-by-step answer,
  optionally grounded in a subject's material.
- **Goals & to-dos** — plan each day with priorities and time targets.
- **Progress report** — study time, quiz performance, weak/strong topics, with
  a downloadable PDF summary.
- **PWA** — installable, with an offline-capable service worker.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `MONGODB_URI` | yes | MongoDB Atlas or local connection string |
   | `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | yes | `http://localhost:3000` in development |
   | `ANTHROPIC_API_KEY` | for AI | Enables all AI features |
   | `ANTHROPIC_MODEL` | no | Defaults to `claude-sonnet-4-5` |
   | `GOOGLE_CLIENT_ID` / `SECRET` | no | Enables Google sign-in |

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add all environment variables from `.env.example`.
4. Deploy. Point `NEXTAUTH_URL` at your production URL and add the Google
   OAuth redirect URI (`https://your-domain/api/auth/callback/google`) if you
   use Google sign-in.

> **Note:** Vercel's serverless functions have a request-body size limit
> (~4.5 MB). Very large uploads may need to be split; the client validates
> file size before upload.
