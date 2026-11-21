# Mastermind — AI Study To-Do & Personal Mentor

A full-stack AI-powered study workspace that reframes raw study tasks into actionable goals and provides a context-aware AI Study Mentor.

## Architecture
- **Frontend (`index.html`):** Tailwind CSS dark-mode UI with `localStorage` state persistence and a floating AI Mentor chat widget.
- **Backend (`backend/api/mentor.js`):** Vercel Serverless Function powered by Google Gemini API with automatic multi-model and multi-key failover.

## Live Endpoints
- **Backend API:** `https://mastermind-ai-backend.vercel.app/api/mentor`

## Environment Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here