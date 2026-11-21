export default async function handler(req, res) {
    // CORS Headers (Frontend team එකට localhost සහ live domain වලින් connect වෙන්න)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Browser Preflight Request (OPTIONS) handle කිරීම
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST requests වලට පමණක් ඉඩ දීම
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { mode, text, studentProfile, studyHistory, chatMessage } = body;

        if (!mode) {
            return res.status(400).json({ error: "Missing 'mode' parameter ('polish' or 'chat')." });
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // =========================================================================
        // 1. POLISHER ENDPOINT (mode === "polish")
        // Returns: { polished, motivation, nextStep }
        // =========================================================================
        if (mode === 'polish') {
            if (!text || !text.trim()) {
                return res.status(400).json({ error: "Missing 'text' field for polish mode." });
            }

            const prompt = `You are an academic study assistant. Analyze and polish the student's raw study note or entry below.
Return a strict JSON object with exactly these three string keys:
1. "polished": A clear, well-structured, grammatically refined version of the student's note.
2. "motivation": A short, genuine, and encouraging motivational message acknowledging their progress.
3. "nextStep": One concrete, actionable next step they should take in their studies.

Student Entry:
"""${text.trim()}"""`;

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
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
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Gemini API error in polish mode.');
            }

            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                throw new Error('Empty response received from Gemini.');
            }

            const cleanJson = rawText.replace(/```json|```/g, '').trim();
            const parsedResult = JSON.parse(cleanJson);

            return res.status(200).json({
                polished: parsedResult.polished || '',
                motivation: parsedResult.motivation || '',
                nextStep: parsedResult.nextStep || '',
            });
        }

        // =========================================================================
        // 2. MENTOR CHAT ENDPOINT (mode === "chat")
        // Uses: studentProfile, studyHistory, chatMessage -> Returns: { reply }
        // =========================================================================
        if (mode === 'chat') {
            if (!chatMessage || !chatMessage.trim()) {
                return res.status(400).json({ error: "Missing 'chatMessage' field for chat mode." });
            }

            const formattedProfile = typeof studentProfile === 'object' && studentProfile !== null ? JSON.stringify(studentProfile) : studentProfile || 'Not provided';

            const formattedHistory = typeof studyHistory === 'object' && studyHistory !== null ? JSON.stringify(studyHistory) : studyHistory || 'Not provided';

            const systemPrompt = `You are MasterMind AI, a supportive, insightful, and practical personal study mentor.
Tailor your guidance using the student's profile and study history below. Keep answers clear, encouraging, and directly helpful.

Student Profile: ${formattedProfile}
Study History: ${formattedHistory}`;

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: chatMessage.trim() }],
                        },
                    ],
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Gemini API error in chat mode.');
            }

            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
            return res.status(200).json({ reply: replyText });
        }

        return res.status(400).json({ error: `Invalid mode '${mode}'. Expected 'polish' or 'chat'.` });
    } catch (error) {
        console.error('Mentor API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
