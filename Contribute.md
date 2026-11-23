# Contributors & Team Guide — Mastermind AI

This document outlines the team structure, individual responsibilities, and the shared API contract between the frontend modules and the Vercel serverless backend (`https://mastermind-ai-backend.vercel.app/api/mentor`).

---

## Team Members & Responsibilities

### 1. Sasindu Nethsara Karanayaka ( )
- **GitHub:** [@Nethsara14](https://github.com/Nethsara14)
- **Assigned Module:** `backend/api/mentor.js` & `mentor-chat.js`
- **Responsibilities:**
  - Designed and deployed the Vercel serverless backend (`mastermind-ai-backend`).
  - Integrated Google Gemini API (`gemini-3.5-flash-lite`) with rate limiting, CORS origin protection, and retry handling.
  - Built the context-aware AI mentor chat logic (`mode: "chat"`).
  - *Add additional tasks here...*

---

### 2. K.M. Pasindu Hirushan( )
- **GitHub:** [@Hirushan450](https://github.com/Hirushan450)
- **Assigned Module:** `fontend/index.html`, `backend/api/mentor.js`
- **Responsibilities:**
  - *Built the responsive dark-mode study workspace dashboard and interactive To-Do list using HTML5 and Tailwind CSS.*
  - *Implemented browser localStorage state persistence for student context profiles (mm_profile) and study logs (mm_tasks).*
  - *Designed the separate task addition flow with auto-detected date badges, study time scheduling, and on-demand "✨ Polish" AI triggers.*
  - *Connected the frontend with the backend API and ensured seamless integration of all project features.*

---

### 3. [Member 3 Name] ( )
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
