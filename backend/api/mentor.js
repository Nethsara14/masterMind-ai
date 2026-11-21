export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { mode, studentProfile, studyHistory } = body;

        // Frontend team එක වෙනස් key names පාවිච්චි කළත් support වෙන්න fallbacks
        const rawText = body.text || body.task || body.rawTask || '';
        const rawChatMessage = body.chatMessage || body.message || '';

        if (!mode) {
            return res.status(400).json({ error: "Missing 'mode' parameter ('polish' or 'chat')." });
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const formattedProfile = typeof studentProfile === 'object' && studentProfile !== null ? JSON.stringify(studentProfile) : studentProfile || 'Not provided';

        // =========================================================================
        // 1. POLISHER ENDPOINT (mode === "polish")
        // Returns: { polished, motivation, nextStep }
        // =========================================================================
        if (mode === 'polish') {
            if (!rawText.trim()) {
                return res.status(400).json({ error: "Missing 'text' field for polish mode." });
            }

            const prompt = `You are Mastermind, an encouraging AI study assistant. A student added a raw study task/note below.
Using their Student Context (especially their current mood, goal, and struggle if provided), return a strict JSON object with exactly three string fields:
1. "polished": Reframe the raw task into a clear, positive, actionable study goal (1-2 concise sentences).
2. "motivation": A short, empathetic mentor boost tailored directly to their current mood (e.g., calming if Stressed, energizing if Motivated, supportive if Okay).
3. "nextStep": One concrete 15-minute immediate micro-step they can do right now to start this task.

Student Context: ${formattedProfile}
Raw Study Task: """${rawText.trim()}"""`;

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

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                throw new Error('Empty response received from Gemini.');
            }

            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsedResult = JSON.parse(cleanJson);

            return res.status(200).json({
                polished: parsedResult.polished || '',
                motivation: parsedResult.motivation || '',
                nextStep: parsedResult.nextStep || '',
            });
        }

        // =========================================================================
        // 2. MENTOR CHAT ENDPOINT (mode === "chat")
        // Uses: studentProfile, studyHistory (To-Do list), chatMessage -> { reply }
        // =========================================================================
        if (mode === 'chat') {
            if (!rawChatMessage.trim()) {
                return res.status(400).json({ error: "Missing 'chatMessage' field for chat mode." });
            }

            const formattedHistory = typeof studyHistory === 'object' && studyHistory !== null ? JSON.stringify(studyHistory) : studyHistory || 'No tasks added yet';

            const systemPrompt = `You are Mastermind, a personal AI Study Mentor inside a student's To-Do & Study Workspace.
You have full visibility into the student's profile (name, goal, mood, struggle) and their current To-Do List / study history (including completed and pending tasks).
Give personalized, practical, and concise advice. Reference their actual tasks, mood, or struggles naturally so they feel understood.

Student Profile: ${formattedProfile}
Student To-Do List & Study History: ${formattedHistory}`;

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
                            parts: [{ text: rawChatMessage.trim() }],
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
