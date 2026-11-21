async function callGeminiWithFallback(payload, apiKeys) {
    let lastError = null;

    for (const key of apiKeys) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok) return data;

        lastError = data.error?.message || `HTTP ${response.status}`;

        // 429 (Rate Limit), 503 (High Demand), හෝ 500 error එකක් ආවොත් ඊළඟ Key එකට මාරු වෙයි
        if (![429, 503, 500].includes(response.status)) {
            throw new Error(lastError);
        }
    }

    throw new Error(lastError || 'All backup API keys failed.');
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);

    if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'Server error: No GEMINI_API_KEY configured.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { mode, studentProfile, studyHistory } = body;
        const rawText = (body.text || body.task || body.rawTask || '').trim();
        const rawChatMessage = (body.chatMessage || body.message || '').trim();

        if (!mode) return res.status(400).json({ error: "Missing 'mode'" });

        const profileStr = typeof studentProfile === 'object' && studentProfile !== null ? `${studentProfile.name || ''}|Goal:${studentProfile.goal || ''}|Mood:${studentProfile.mood || ''}|Struggle:${studentProfile.struggle || ''}` : String(studentProfile || 'None').slice(0, 150);

        // =========================================================================
        // 1. POLISHER ENDPOINT (mode === "polish")
        // =========================================================================
        if (mode === 'polish') {
            if (!rawText) return res.status(400).json({ error: "Missing 'text'" });

            const prompt = `Context(${profileStr}). Reframe task into JSON:
- polished: positive actionable goal (max 15 words)
- motivation: mood-matched boost (max 15 words)
- nextStep: 15-min micro-step (max 15 words)
Task: "${rawText.slice(0, 300)}"`;

            const data = await callGeminiWithFallback(
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 220,
                        thinkingConfig: { thinkingBudget: 0 },
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: 'OBJECT',
                            properties: {
                                polished: { type: 'STRING' },
                                motivation: { type: 'STRING' },
                                nextStep: { type: 'STRING' },
                            },
                            required: ['polished', 'motivation', 'nextStep'],
                        },
                    },
                },
                apiKeys,
            );

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim());

            return res.status(200).json({
                polished: parsed.polished || '',
                motivation: parsed.motivation || '',
                nextStep: parsed.nextStep || '',
            });
        }

        // =========================================================================
        // 2. MENTOR CHAT ENDPOINT (mode === "chat")
        // =========================================================================
        if (mode === 'chat') {
            if (!rawChatMessage) return res.status(400).json({ error: "Missing 'chatMessage'" });

            let historyStr = 'None';
            if (Array.isArray(studyHistory) && studyHistory.length > 0) {
                historyStr = studyHistory
                    .slice(-6)
                    .map((t) => `${t.done ? '[x]' : '[ ]'} ${t.polished || t.task || t.text || JSON.stringify(t)}`)
                    .join('; ');
            } else if (typeof studyHistory === 'string' && studyHistory.trim()) {
                historyStr = studyHistory.slice(0, 400);
            }

            const systemPrompt = `You are Mastermind, a concise AI study mentor. Use context to give direct, practical advice in 2-4 short sentences.
Profile: ${profileStr}
Tasks: ${historyStr}`;

            const data = await callGeminiWithFallback(
                {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: rawChatMessage.slice(0, 500) }] }],
                    generationConfig: {
                        maxOutputTokens: 250,
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                },
                apiKeys,
            );

            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
            return res.status(200).json({ reply: replyText });
        }

        return res.status(400).json({ error: `Invalid mode '${mode}'` });
    } catch (error) {
        console.error('Mentor API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
