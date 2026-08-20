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

    const providers = [
        {
            name: "Groq",
            key: process.env.GROQ_API_KEY,
            call: () => callGroq(message)
        },
        {
            name: "Gemini",
            key: process.env.GEMINI_API_KEY,
            call: () => callGemini(message)
        },
        {
            name: "OpenRouter",
            key: process.env.OPENROUTER_API_KEY,
            call: () => callOpenRouter(message)
        },
        {
            name: "OpenAI",
            key: process.env.OPENAI_API_KEY,
            call: () => callOpenAI(message)
        }
    ];

    const failures = [];

    for (const provider of providers) {

        if (!provider.key) {
            failures.push(
                `${provider.name}: key not configured`
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
                error?.message || error
            );

            failures.push(
                `${provider.name}: ${
                    error?.message || "Unknown error"
                }`
            );
        }
    }

    return res.status(503).json({
        error:
            "KLYDE AI could not connect to an available AI provider.",
        provider_errors: failures
    });
}


/* =========================================================
   KLYDE IDENTITY
========================================================= */

const KLYDE_SYSTEM_PROMPT = `
You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB.

Your identity is KLYDE AI.

Be helpful, intelligent, clear, friendly, confident and practical.

When the user asks who you are, say:

"I am KLYDE AI, the intelligent assistant inside KLYDE AI HUB."

Never introduce yourself as Groq, Gemini, OpenAI or OpenRouter.

The underlying AI provider is an internal implementation detail.

Only mention the provider if the user specifically asks
which AI technology or provider is powering the response.
`;


/* =========================================================
   GROQ
========================================================= */

async function callGroq(message) {

    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.GROQ_API_KEY}`
            },

            body: JSON.stringify({
                model:
                    process.env.GROQ_MODEL ||
                    "groq/compound-mini",

                messages: [
                    {
                        role: "system",
                        content: KLYDE_SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            `Groq HTTP ${response.status}`
        );
    }

    return (
        data?.choices?.[0]?.message?.content ||
        null
    );
}


/* =========================================================
   GEMINI
========================================================= */

async function callGemini(message) {

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-3.7-flash";

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent?key=" +
        encodeURIComponent(process.env.GEMINI_API_KEY);

    const response = await fetch(
        url,
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
                ]
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            `Gemini HTTP ${response.status}`
        );
    }

    return (
        data?.candidates?.[0]
            ?.content?.parts
            ?.map(part => part.text || "")
            .join("") ||
        null
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
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${process.env.OPENROUTER_API_KEY}`,

                "HTTP-Referer":
                    "https://klyde-ai-hi4wy4tz7-klydexszn.vercel.app",

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
                        content: KLYDE_SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            `OpenRouter HTTP ${response.status}`
        );
    }

    return (
        data?.choices?.[0]
            ?.message
            ?.content ||
        null
    );
}


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
                ]
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            `OpenAI HTTP ${response.status}`
        );
    }

    return (
        data?.choices?.[0]
            ?.message
            ?.content ||
        null
    );
}
