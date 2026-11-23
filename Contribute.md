# Contributors & Team Guide — Mastermind AI

This document outlines the team structure, individual responsibilities, and the shared API contract between the frontend modules and the Vercel serverless backend (`https://mastermind-ai-backend.vercel.app/api/mentor`).

---

## Team Members & Responsibilities

### 1. Sasindu Nethsara Karanayaka (Member-01)
- **GitHub:** [@Nethsara14](https://github.com/Nethsara14)
- **Assigned Module:** `backend/api/mentor.js` & `mentor-chat.js`
- **Responsibilities:**
  - Designed and deployed the Vercel serverless backend (`mastermind-ai-backend`).
  - Integrated Google Gemini API (`gemini-3.5-flash-lite`) with rate limiting, CORS origin protection, and retry handling.
  - Built the context-aware AI mentor chat logic (`mode: "chat"`).
  - *Add additional tasks here...*

---

### 2. K.M. Pasindu Hirushan (Member-02)
- **GitHub:** [@Hirushan450](https://github.com/Hirushan450)
- **Assigned Module:** `index.html`, `backend/api/mentor.js`
- **Responsibilities:**
  - *Built the responsive dark-mode study workspace dashboard and interactive To-Do list using HTML5 and Tailwind CSS.*
  - *Implemented browser localStorage state persistence for student context profiles (mm_profile) and study logs (mm_tasks).*
  - *Designed the separate task addition flow with auto-detected date badges, study time scheduling, and on-demand "✨ Polish" AI triggers.*
  - *Connected the frontend with the backend API and ensured seamless integration of all project features.*

---

### 3. Kaveesha Hirushan (Member-03)
- **GitHub:** [@kaveesha-dev](https://github.com/kaveesha-dev)
- **Assigned Module:** `index.html`
- **Responsibilities:**
  -  *Stopwatch and Pomodoro timer ui part and develop logic according to the ui.*
  -  *Support other contributors in polishing their code.*

---

## Shared API Contract (`/api/mentor`)

**Production Endpoint:**
```text
POST [https://mastermind-ai-backend.vercel.app/api/mentor](https://mastermind-ai-backend.vercel.app/api/mentor)
