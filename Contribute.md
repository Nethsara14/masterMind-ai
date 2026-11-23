# Contributors & Team Guide — Mastermind AI

This document outlines the team structure, individual responsibilities, and the shared API contract between the frontend modules and the Vercel serverless backend (`https://mastermind-ai-backend.vercel.app/api/mentor`).

---

## Team Members & Responsibilities

### 1. Sasindu Nethsara Karanayaka (Project Lead & Backend / Core Mentor)
- **GitHub:** [@Nethsara14](https://github.com/Nethsara14)
- **Assigned Module:** `backend/api/mentor.js` & `mentor-chat.js`
- **Responsibilities:**
  - Designed and deployed the Vercel serverless backend (`mastermind-ai-backend`).
  - Integrated Google Gemini API (`gemini-3.5-flash-lite`) with rate limiting, CORS origin protection, and retry handling.
  - Built the context-aware AI mentor chat logic (`mode: "chat"`).
  - *Add additional tasks here...*

---

### 2. [Member 2 Name] ([Role — e.g., Frontend UI & Study Workspace])
- **GitHub:** [@username](https://github.com/username)
- **Assigned Module:** `fontend/index.html` / `storage.js` / `timer.js` *(Update file name)*
- **Responsibilities:**
  - *[Task 1 — e.g., Built the main study workspace dashboard, task list UI, and Pomodoro focus timer]*
  - *[Task 2 — e.g., Implemented browser `localStorage` persistence for daily study logs and student profile]*
  - *[Task 3]*

---

### 3. [Member 3 Name] ([Role — e.g., AI Task Polisher & UX Integration])
- **GitHub:** [@username](https://github.com/username)
- **Assigned Module:** `polisher.js`
- **Responsibilities:**
  - Built the task-polishing module (`mode: "polish"`) to convert rough study thoughts into structured goals, motivational notes, and actionable next steps.
  - *[Task 2 — e.g., Connected frontend form inputs to the `/api/mentor` endpoint and handled loading/error states]*
  - *[Task 3]*

---

## Shared API Contract (`/api/mentor`)

**Production Endpoint:**
```text
POST [https://mastermind-ai-backend.vercel.app/api/mentor](https://mastermind-ai-backend.vercel.app/api/mentor)
