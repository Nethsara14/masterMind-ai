Member 3 (polisher.js) — Request & Response:

        // POST https://<your-project>.vercel.app/api/mentor
        {
        "mode": "polish",
        "text": "Fix MySQL connection error, feeling stuck today",
        "studentProfile": { "name": "Pasindu", "goal": "Java & APIs", "mood": "Stressed", "struggle": "Async bugs" }
        }
        // Returns: { "polished": "...", "motivation": "...", "nextStep": "..." }




Member 1 (mentor-chat.js) — Request & Response:
        // POST https://<your-project>.vercel.app/api/mentor
        {
        "mode": "chat",
        "studentProfile": { "name": "Pasindu", "goal": "Java & APIs", "mood": "Stressed", "struggle": "Async bugs" },
        "studyHistory": [ /* Today's To-Do tasks array */ ],
        "chatMessage": "What should I tackle first?"
        }
        // Returns: { "reply": "..." }