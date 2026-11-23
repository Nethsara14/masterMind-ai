# Mastermind — AI Study To-Do & Personal Mentor

Mastermind is a static study workspace with task tracking, a focus timer, AI task polishing, and a short AI mentor chat.

## Architecture

- **Frontend:** `index.html`, with browser `localStorage` persistence.
- **Backend:** `backend/api/mentor.js`, deployed as a Vercel Serverless Function.
- **AI model:** `gemini-3.5-flash-lite`, selected for Gemini's free tier.

The frontend currently calls:

```text
https://mastermind-ai-backend.vercel.app/api/mentor
```

## Backend environment

Copy `backend/.env.example` to `backend/.env`, then add a Gemini API key created in Google AI Studio:

```env
GEMINI_API_KEY=your_real_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=18000
RATE_LIMIT_PER_MINUTE=5
ALLOWED_ORIGINS=http://localhost:5500
```

Never place `GEMINI_API_KEY` in `index.html` or commit `backend/.env`.

## Run locally

1. Start the backend from the `backend` directory:

   ```powershell
   npm run dev
   ```

   The first run uses `npx` to obtain the Vercel CLI if it is not installed.

2. In another terminal, serve the frontend from the repository root:

   ```powershell
   python -m http.server 5500
   ```

3. Open the frontend:

   ```text
   http://localhost:5500/
   ```

On localhost, the frontend calls the local backend at `http://localhost:3000/api/mentor`. On other hosts, it calls the deployed backend.

## Deploy the backend to Vercel

1. Import this repository in Vercel and set the backend project's root directory to `backend`.
2. Add these Production environment variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-3.5-flash-lite`
   - `GEMINI_TIMEOUT_MS=18000`
   - `RATE_LIMIT_PER_MINUTE=5`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.example`
3. Redeploy the backend.
4. Send one chat request and one task-polish request from the frontend.

If the existing backend project already uses the same Vercel URL, the frontend URL does not need to change.

## Free-tier behavior

The backend sends at most two Gemini requests only when the first request fails temporarily. It does not retry quota (`429`) errors. Exact free-tier limits vary by Google AI project; check Google AI Studio's **Dashboard → Rate limits** and **Usage** pages.

## Checks

```powershell
npm --prefix backend test
npm --prefix backend run check
```
