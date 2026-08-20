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
                    reply: reply,
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

            // Continue automatically to the next provider.
        }
    }

    console.error(
        "All KLYDE AI providers failed:",
        failures
    );

    return res.status(503).json({
        error:
            "KLYDE AI is temporarily unable to answer. " +
            "All available AI providers are currently unavailable."
    });
}


/* =========================================================
   GEMINI
========================================================= */

async function callGemini(message) {

    const response = await fetch(
        "https://generativelanguage.googleapis.com/" +
        "v1beta/models/gemini-3.6-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                contents: [
                    {
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
            data.error?.message ||
            `Gemini HTTP ${response.status}`
        );
    }

    return (
        data
            .candidates?.[0]
            ?.content?.parts?.[0]
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
                "Content-Type": "application/json",

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
                            "You are KLYDE AI, a helpful, intelligent, " +
                            "clear and practical AI assistant inside " +
                            "KLYDE AI HUB."
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
            data.error?.message ||
            `Groq HTTP ${response.status}`
        );
    }

    return (
        data
            .choices?.[0]
            ?.message?.content || null
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
                    "https://klyde-ai-9z7g0pgla-klydexszn.vercel.app",

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
                            "You are KLYDE AI, the intelligent assistant " +
                            "inside KLYDE AI HUB. Be helpful, clear, " +
                            "friendly, intelligent and practical."
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
            data.error?.message ||
            `OpenRouter HTTP ${response.status}`
        );
    }

    return (
        data
            .choices?.[0]
            ?.message?.content || null
    );
}
