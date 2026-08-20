export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    /*
    =========================================================
    KLYDE AI PROVIDER SYSTEM

    Priority:
    1. OpenAI
    2. Gemini
    3. Groq
    4. OpenRouter

    If one provider fails, KLYDE automatically tries the next.
    =========================================================
    */

    const providers = [
        {
            name: "OpenAI",
            key: process.env.OPENAI_API_KEY,
            call: () => callOpenAI(message)
        },

        {
            name: "Gemini",
            key: process.env.GEMINI_API_KEY,
            call: () => callGemini(message)
        },

        {
            name: "Groq",
            key: process.env.GROQ_API_KEY,
            call: () => callGroq(message)
        },

        {
            name: "OpenRouter",
            key: process.env.OPENROUTER_API_KEY,
            call: () => callOpenRouter(message)
        }
    ];

    const failures = [];

    for (const provider of providers) {

        if (!provider.key) {

            failures.push(
                `${provider.name}: API key not configured`
            );

            continue;
        }

        try {

            console.log(
                `KLYDE AI trying ${provider.name}`
            );

            const reply = await provider.call();

            if (reply && reply.trim()) {

                console.log(
                    `KLYDE AI answered using ${provider.name}`
                );

                return res.status(200).json({
                    reply: reply.trim(),
                    provider: provider.name
                });
            }

            failures.push(
                `${provider.name}: empty response`
            );

        } catch (error) {

            console.error(
                `${provider.name} failed:`,
                error.message
            );

            failures.push(
                `${provider.name}: ${error.message}`
            );

            /*
            Do NOT stop here.

            KLYDE automatically moves to
            the next available provider.
            */
        }
    }

    console.error(
        "All KLYDE AI providers failed:",
        failures
    );

   return res.status(503).json({
    error: "No AI provider produced a response.",
    configured: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY
    },
    failures
});


/* =========================================================
   SHARED KLYDE AI INSTRUCTIONS
========================================================= */

const KLYDE_SYSTEM_PROMPT = `
You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB.

Your identity is KLYDE AI.

Be:
- Helpful
- Intelligent
- Clear
- Friendly
- Confident
- Practical

Answer naturally and directly.

Do not introduce yourself as OpenAI, Gemini, Groq,
OpenRouter, or any other provider.

If the user asks who you are, say that you are
KLYDE AI, the AI assistant inside KLYDE AI HUB.

If the user specifically asks what technology or
provider is answering, you may explain honestly.

Use the conversation provided by the user when
it contains previous context.
`;


/* =========================================================
   OPENAI
========================================================= */

async function callOpenAI(message) {

    const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${process.env.OPENAI_API_KEY}`
            },

            body: JSON.stringify({

                model:
                    process.env.OPENAI_MODEL ||
                    "gpt-4o-mini",

                messages: [

                    {
                        role: "system",
                        content: KLYDE_SYSTEM_PROMPT
                    },

                    {
                        role: "user",
                        content: message
                    }

                ],

                temperature: 0.7
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            `OpenAI HTTP ${response.status}`
        );
    }

    return (
        data
            .choices?.[0]
            ?.message
            ?.content || null
    );
}


/* =========================================================
   GEMINI
========================================================= */

async function callGemini(message) {

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                systemInstruction: {
                    parts: [
                        {
                            text: KLYDE_SYSTEM_PROMPT
                        }
                    ]
                },

                contents: [

                    {
                        role: "user",

                        parts: [
                            {
                                text: message
                            }
                        ]
                    }

                ],

                generationConfig: {
                    temperature: 0.7
                }

            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            `Gemini HTTP ${response.status}`
        );
    }

    return (
        data
            .candidates?.[0]
            ?.content
            ?.parts?.[0]
            ?.text || null
    );
}


/* =========================================================
   GROQ
========================================================= */

async function callGroq(message) {

    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Authorization":
                    `Bearer ${process.env.GROQ_API_KEY}`
            },

            body: JSON.stringify({

                model:
                    process.env.GROQ_MODEL ||
                    "llama-3.3-70b-versatile",

                messages: [

                    {
                        role: "system",

                        content:
                            KLYDE_SYSTEM_PROMPT
                    },

                    {
                        role: "user",

                        content:
                            message
                    }

                ],

                temperature: 0.7
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            `Groq HTTP ${response.status}`
        );
    }

    return (
        data
            .choices?.[0]
            ?.message
            ?.content || null
    );
}


/* =========================================================
   OPENROUTER
========================================================= */

async function callOpenRouter(message) {

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Authorization":
                    `Bearer ${process.env.OPENROUTER_API_KEY}`,

                "HTTP-Referer":
                    "https://klyde-ai-jh39hlmkq-klydexszn.vercel.app",

                "X-Title":
                    "KLYDE AI HUB"
            },

            body: JSON.stringify({

                model:
                    process.env.OPENROUTER_MODEL ||
                    "openai/gpt-oss-20b:free",

                messages: [

                    {
                        role: "system",

                        content:
                            KLYDE_SYSTEM_PROMPT
                    },

                    {
                        role: "user",

                        content:
                            message
                    }

                ],

                temperature: 0.7
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            `OpenRouter HTTP ${response.status}`
        );
    }

    return (
        data
            .choices?.[0]
            ?.message
            ?.content || null
    );
}
