async function askGemini(systemPrompt, userMessage, apiKeys) {
    // 1st try: Primary key + gemini-3.8-flash | 2nd try (503 spike awoth): Backup key + flash-lite
    const attempts = [
        { key: apiKeys[0], model: 'gemini-3.8-flash' },
        { key: apiKeys[1] || apiKeys[0], model: 'gemini-3.8-flash-lite' },
        { key: apiKeys[2] || apiKeys[0], model: 'gemini-3.8-flash' },
    ];

    let lastError = 'API Error';

    for (const { key, model } of attempts) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: {
                    maxOutputTokens: 180,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            }),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }

        lastError = data.error?.message || `HTTP ${response.status}`;

        // 503 (High demand) ho 429 nam podi welawak indala ilanga key/model ekata yanawa
        if ([503, 429, 500].includes(response.status)) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
        }

        throw new Error(lastError);
    }

    throw new Error(lastError);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);

    if (apiKeys.length === 0) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { mode, studentProfile, studyHistory } = body;
        const rawText = (body.text || body.task || '').trim();
        const rawChatMessage = (body.chatMessage || body.message || '').trim();

        const profileStr = typeof studentProfile === 'object' && studentProfile !== null ? `Name: ${studentProfile.name || 'Student'}, Goal: ${studentProfile.goal || 'Coding'}, Mood: ${studentProfile.mood || 'Okay'}, Struggle: ${studentProfile.struggle || 'None'}` : String(studentProfile || 'Student');

        // =====================================================================
        // 1. TASK POLISHER MODE
        // =====================================================================
        if (mode === 'polish') {
            if (!rawText) return res.status(400).json({ error: 'Missing task text' });

            const systemPrompt = `You are Mastermind AI Task Polisher.
Student Context: ${profileStr}
RULES:
- Reply ONLY with valid raw JSON (no markdown).
- Format: {"polished":"...","motivation":"...","nextStep":"..."}
- Keep each value under 14 words, practical, and encouraging.`;

            const reply = await askGemini(systemPrompt, `Task: ${rawText.slice(0, 250)}`, apiKeys);
            const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());

            return res.status(200).json({
                polished: parsed.polished || rawText,
                motivation: parsed.motivation || 'You got this! One step at a time.',
                nextStep: parsed.nextStep || 'Break this task into a 15-minute test.',
            });
        }

        // =====================================================================
        // 2. MENTOR CHAT MODE (With your Singlish/English/Sinhala Rules)
        // =====================================================================
        if (mode === 'chat') {
            if (!rawChatMessage) return res.status(400).json({ error: 'Missing chat message' });

            const tasksStr =
                Array.isArray(studyHistory) && studyHistory.length > 0
                    ? studyHistory
                          .slice(-5)
                          .map((t) => `${t.done ? '[Done]' : '[Todo]'} ${t.polished || t.task || ''}`)
                          .join(' | ')
                    : 'No tasks yet';

            const systemPrompt = `You are Mastermind, a friendly AI Study & Coding Mentor.
Student Profile: ${profileStr}
Current To-Do List: ${tasksStr}

CRITICAL LANGUAGE & LENGTH RULES:
1. DO NOT MIX ALPHABETS.
2. If the user types in SINGLISH (Sinhala in English letters, e.g. "mk", "kohomada"): Reply PURELY IN friendly SINGLISH using English letters.
3. If the user types in ENGLISH: Reply purely in English.
4. If the user types in SINHALA SCRIPT: Reply purely in Sinhala script.
5. Keep replies SHORT & COMPACT (2 to 3 short sentences max) because the chat widget is small.`;

            const reply = await askGemini(systemPrompt, rawChatMessage.slice(0, 400), apiKeys);
            return res.status(200).json({ reply });
        }

        return res.status(400).json({ error: 'Invalid mode' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
