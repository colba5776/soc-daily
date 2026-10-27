# SOC Daily

One blue-team challenge a day. Read the scenario, analyze the artifact (an email, a slice of logs, or an alert), make the call, and learn the MITRE ATT&CK technique behind it.

Built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase.

## 1. Run it locally (demo mode, about 2 minutes)

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys the app runs in **demo mode**:

- Challenges rotate daily through `content/challenges.json` (12 included)
- Streaks and history are saved in the browser
- Sign-in is hidden

## 2. Turn on accounts and scheduled challenges (Supabase)

1. Create a free project at https://supabase.com.
2. In **SQL Editor**, paste and run `supabase/schema.sql`.
3. Generate the seed file with your start date, then run `supabase/seed.sql` in the SQL Editor:
   ```bash
   node scripts/generate-seed.mjs 2026-11-01
   ```
   Each challenge gets one day, starting on that date.
4. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings > API**.
5. In **Authentication > URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. (Add your production URL too once deployed.)
6. Restart `npm run dev`. A **Sign in** button appears, and the app reads challenges from the database.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import it at https://vercel.com/new.
3. Add the same four environment variables in the Vercel project settings.
4. Add `https://your-app.vercel.app/auth/callback` to Supabase Redirect URLs and set the Site URL to your Vercel URL.

## Security design (good interview material)

- **Answers never reach the browser before you commit.** Correct answers live in `challenge_answers`, a table with Row Level Security turned on and no policies, so the public API key cannot read it. Answers are checked in a server action (`src/app/actions.ts`) using the service role key, which only exists on the server.
- **Future challenges stay hidden.** The RLS policy on `challenges` only returns rows where `publish_date` is today or earlier, and the server refuses to grade unpublished challenges.
- **Streaks cannot be edited by users.** Users can only update their `username`. Attempts and streaks are written by the `record_attempt` Postgres function, which only the service role can execute, in a single transaction.
- **One attempt per challenge.** A unique constraint on `(user_id, challenge_id)` means the first answer counts.
- **All content is synthetic.** IPs come from documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), domains use `.example`, and URLs are defanged (`hxxp`).

## Adding challenges

Add objects to `content/challenges.json`:

| Field | Notes |
|---|---|
| `slug` | Unique id, lowercase with dashes |
| `title` | Short and catchy |
| `category` | `phishing`, `windows_logs`, `network`, `cloud`, `web`, `linux`, `malware` |
| `difficulty` | 1, 2, or 3 (shown as Tier 1 to 3) |
| `scenario` | Markdown, one or two sentences of setup |
| `artifact_type` | `email`, `log`, or `alert` |
| `artifact` | The evidence. Use `\n` for new lines |
| `question`, `choices` | Two to six choices |
| `correct_index` | Zero based (0 = A) |
| `explanation` | Why, plus what an analyst should do next |
| `attack_technique` | e.g. `T1566.002` |

Then regenerate and run the seed (`node scripts/generate-seed.mjs <start-date>`). Re-running is safe: existing slugs are updated. Two challenges cannot share a date, so pick a start date after your last scheduled one when adding new batches.

Tip: write 30 challenges before launch so you are never scrambling.

## Project map

```
content/challenges.json      Challenge content (source of truth for demo and seed)
supabase/schema.sql          Tables, RLS policies, streak function
supabase/seed.sql            Generated from challenges.json
scripts/generate-seed.mjs    Builds seed.sql
src/app/page.tsx             Today's challenge (server component)
src/app/actions.ts           submitAnswer server action
src/app/profile/page.tsx     Stats (database for members, browser for guests)
src/app/login/page.tsx       Magic link sign-in
src/app/auth/                Callback and sign-out routes
src/components/AnswerPanel   Choices, verdict, streak, share (client component)
src/components/ArtifactViewer  Terminal-style evidence viewer
src/lib/challenges.ts        Data access (Supabase or demo)
src/lib/guest-stats.ts       Guest streaks in localStorage
src/proxy.ts                 Keeps the login session fresh (Next 16 name for middleware)
```

## Next ideas (v2)

- Archive of past challenges
- Leaderboard
- Move guest history into the account on first sign-in
- Multi-step challenges (triage, contain, report)
- Community-submitted challenges with review
- Open Graph share image per challenge
