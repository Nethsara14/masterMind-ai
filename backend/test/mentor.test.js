import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/mentor.js';

const originalFetch = globalThis.fetch;

function createResponseRecorder() {
    return {
        statusCode: 200,
        headers: {},
        payload: undefined,
        ended: false,
        setHeader(name, value) {
            this.headers[name.toLowerCase()] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        },
        end() {
            this.ended = true;
            return this;
        },
    };
}

async function invoke(body, ip) {
    const req = {
        method: 'POST',
        body,
        headers: { 'x-forwarded-for': ip },
        socket: { remoteAddress: ip },
    };
    const res = createResponseRecorder();
    await handler(req, res);
    return res;
}

test.beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
    process.env.RATE_LIMIT_PER_MINUTE = '60';
    delete process.env.ALLOWED_ORIGINS;
});

test.afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('chat uses the free-tier model and API-key header', async () => {
    let outbound;
    globalThis.fetch = async (url, options) => {
        outbound = { url, options, body: JSON.parse(options.body) };
        return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Start with the smallest pending task.' }] } }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res = await invoke({ mode: 'chat', chatMessage: 'What should I do first?' }, '10.0.0.1');

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.reply, 'Start with the smallest pending task.');
    assert.match(outbound.url, /gemini-3\.5-flash-lite:generateContent$/);
    assert.doesNotMatch(outbound.url, /[?&]key=/);
    assert.equal(outbound.options.headers['x-goog-api-key'], 'test-api-key');
    assert.equal(outbound.body.generationConfig.maxOutputTokens, 320);
    assert.equal(outbound.body.generationConfig.thinkingConfig, undefined);
});

test('polish requests structured JSON and validates the response', async () => {
    let outboundBody;
    globalThis.fetch = async (_url, options) => {
        outboundBody = JSON.parse(options.body);
        return new Response(JSON.stringify({
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            polished: 'Read chapter one and capture three key ideas.',
                            motivation: 'A focused start builds momentum.',
                            nextStep: 'Read for fifteen minutes.',
                        }),
                    }],
                },
            }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res = await invoke({ mode: 'polish', text: 'read chapter one' }, '10.0.0.2');

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.polished, 'Read chapter one and capture three key ideas.');
    assert.equal(outboundBody.generationConfig.responseMimeType, 'application/json');
    assert.deepEqual(outboundBody.generationConfig.responseJsonSchema.required, [
        'polished',
        'motivation',
        'nextStep',
    ]);
});

test('quota errors return 429 without spending another request', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        return new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    const res = await invoke({ mode: 'chat', chatMessage: 'Hello' }, '10.0.0.3');

    assert.equal(res.statusCode, 429);
    assert.equal(calls, 1);
    assert.match(res.payload.error, /quota/i);
});

test('a temporary provider failure is retried once', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        if (calls === 1) {
            return new Response(JSON.stringify({ error: { message: 'High demand' } }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Try one small step now.' }] } }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res = await invoke({ mode: 'chat', chatMessage: 'I am stuck' }, '10.0.0.4');

    assert.equal(res.statusCode, 200);
    assert.equal(calls, 2);
    assert.equal(res.payload.reply, 'Try one small step now.');
});

test('missing credentials produce a clear configuration error', async () => {
    delete process.env.GEMINI_API_KEY;
    globalThis.fetch = async () => {
        throw new Error('fetch should not be called');
    };

    const res = await invoke({ mode: 'chat', chatMessage: 'Hello' }, '10.0.0.5');

    assert.equal(res.statusCode, 500);
    assert.equal(res.payload.code, 'MISSING_API_KEY');
});
