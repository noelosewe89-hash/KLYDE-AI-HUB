/* =========================================================
   KLYDE AI HUB — MULTI-PROVIDER AI ENGINE

   PROVIDER ORDER:
   1. Groq
   2. Gemini
   3. OpenRouter FREE MODEL
   4. Hugging Face
   5. Cerebras
   6. Mistral

   Existing KLYDE frontend expects:
   { reply: "..." }
========================================================= */


export default async function handler(req, res) {

    /* =====================================================
       METHOD CHECK
    ===================================================== */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =====================================================
       READ REQUEST
    ===================================================== */

    const { message } =
        req.body || {};


    if (
        !message ||
        typeof message !== "string"
    ) {

        return res.status(400).json({
            error: "Message is required"
        });

    }


    /* =====================================================
       PROVIDERS
    ===================================================== */

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
            name: "Hugging Face",
            key: process.env.HUGGINGFACE_API_KEY,
            call: () => callHuggingFace(message)
        },

        {
            name: "Cerebras",
            key: process.env.CEREBRAS_API_KEY,
            call: () => callCerebras(message)
        },

        {
            name: "Mistral",
            key: process.env.MISTRAL_API_KEY,
            call: () => callMistral(message)
        }

    ];


    const failures = [];


 /* =====================================================
   PROVIDER FALLBACK LOOP
===================================================== */

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

        /*
         * Give every provider a maximum amount
         * of time before moving to the next one.
         */

        const timeout =
            provider.name === "Groq"
                ? 8000
                : provider.name === "Gemini"
                    ? 8000
                    : 10000;


        const timeoutPromise =
            new Promise((_, reject) => {

                setTimeout(() => {

                    reject(
                        new Error(
                            `${provider.name} timeout`
                        )
                    );

                }, timeout);

            });


        const reply =
            await Promise.race([

                provider.call(),

                timeoutPromise

            ]);


        if (
            reply &&
            typeof reply === "string" &&
            reply.trim()
        ) {

            console.log(
                `KLYDE AI answered using ${provider.name}`
            );

            return res.status(200).json({

                reply:
                    reply.trim()

            });

        }


        failures.push(
            `${provider.name}: empty response`
        );

    }

    catch (error) {

        const providerError =
            error?.message ||
            "Unknown provider error";


        console.error(
            `KLYDE ${provider.name} failed:`,
            providerError
        );


        failures.push(
            `${provider.name}: ${providerError}`
        );

    }

}
    /* =====================================================
       ALL PROVIDERS FAILED
    ===================================================== */

    console.error(
        "KLYDE AI provider failures:",
        failures
    );


    return res.status(503).json({

        error:
            "KLYDE AI could not connect to any available AI provider.",

        details:
            failures

    });

}


/* =========================================================
   KLYDE AI IDENTITY
========================================================= */

const KLYDE_SYSTEM_PROMPT = `

You are KLYDE AI, the intelligent assistant
inside KLYDE AI HUB.

Your identity is KLYDE AI.

Be intelligent, helpful, clear, natural,
confident, friendly and practical.

Answer the user's actual question.

Use simple explanations when appropriate.

If the user asks a follow-up question,
use the conversation information supplied
by the user.

Never introduce yourself as Groq, Gemini,
OpenRouter, Hugging Face, Cerebras or Mistral.

Those are internal providers.

If the user asks who you are, say:

"I am KLYDE AI, the intelligent assistant
inside KLYDE AI HUB."

Do not reveal internal provider details
unless the user specifically asks.

`;


/* =========================================================
   GENERIC SAFE JSON READER
========================================================= */

async function readJSON(response, providerName) {

    const rawText =
        await response.text();


    let data = {};


    try {

        data =
            rawText
                ? JSON.parse(rawText)
                : {};

    }

    catch {

        throw new Error(

            `${providerName} returned invalid JSON ` +
            `(HTTP ${response.status})`

        );

    }


    return data;

}


/* =========================================================
   GROQ
========================================================= */

async function callGroq(message) {

    const model =
        process.env.GROQ_MODEL ||
        "llama-3.3-70b-versatile";


    const response =
        await fetch(

            "https://api.groq.com/openai/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`

                },

                body:
                    JSON.stringify({

                        model,

                        messages: [

                            {
                                role:
                                    "system",

                                content:
                                    KLYDE_SYSTEM_PROMPT
                            },

                            {
                                role:
                                    "user",

                                content:
                                    message
                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "Groq"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            `Groq HTTP ${response.status}`

        );

    }


    return (

        data
            ?.choices?.[0]
            ?.message?.content ||

        null

    );

}


/* =========================================================
   GEMINI
========================================================= */

async function callGemini(message) {

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-3.6-flash";


    const url =

        "https://generativelanguage.googleapis.com/" +

        "v1beta/models/" +

        encodeURIComponent(model) +

        ":generateContent?key=" +

        encodeURIComponent(
            process.env.GEMINI_API_KEY
        );


    const response =
        await fetch(

            url,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        systemInstruction: {

                            parts: [

                                {
                                    text:
                                        KLYDE_SYSTEM_PROMPT
                                }

                            ]

                        },

                        contents: [

                            {

                                role:
                                    "user",

                                parts: [

                                    {
                                        text:
                                            message
                                    }

                                ]

                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "Gemini"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            `Gemini HTTP ${response.status}`

        );

    }


    return (

        data
            ?.candidates?.[0]
            ?.content
            ?.parts
            ?.map(
                part =>
                    part?.text || ""
            )
            ?.join("") ||

        null

    );

}


/* =========================================================
   OPENROUTER
   FREE MODEL
========================================================= */

async function callOpenRouter(message) {

    const model =
        process.env.OPENROUTER_MODEL ||
        "openrouter/free";


    const response =
        await fetch(

            "https://openrouter.ai/api/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "HTTP-Referer":
                        "https://klyde-ai-hub.vercel.app",

                    "X-Title":
                        "KLYDE AI HUB"

                },

                body:
                    JSON.stringify({

                        model,

                        messages: [

                            {
                                role:
                                    "system",

                                content:
                                    KLYDE_SYSTEM_PROMPT
                            },

                            {
                                role:
                                    "user",

                                content:
                                    message
                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "OpenRouter"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            `OpenRouter HTTP ${response.status}`

        );

    }


    return (

        data
            ?.choices?.[0]
            ?.message?.content ||

        null

    );

}


/* =========================================================
   HUGGING FACE
========================================================= */

async function callHuggingFace(message) {

    const model =
        process.env.HUGGINGFACE_MODEL ||

        "HuggingFaceH4/zephyr-7b-beta";


    const response =
        await fetch(

            "https://router.huggingface.co/" +
            "hf-inference/models/" +
            encodeURIComponent(model) +
            "/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.HUGGINGFACE_API_KEY}`

                },

                body:
                    JSON.stringify({

                        model,

                        messages: [

                            {
                                role:
                                    "system",

                                content:
                                    KLYDE_SYSTEM_PROMPT
                            },

                            {
                                role:
                                    "user",

                                content:
                                    message
                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "Hugging Face"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            data?.error ||

            `Hugging Face HTTP ${response.status}`

        );

    }


    return (

        data
            ?.choices?.[0]
            ?.message?.content ||

        null

    );

}


/* =========================================================
   CEREBRAS
========================================================= */

async function callCerebras(message) {

    const model =
        process.env.CEREBRAS_MODEL ||

        "llama-3.3-70b";


    const response =
        await fetch(

            "https://api.cerebras.ai/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.CEREBRAS_API_KEY}`

                },

                body:
                    JSON.stringify({

                        model,

                        messages: [

                            {
                                role:
                                    "system",

                                content:
                                    KLYDE_SYSTEM_PROMPT
                            },

                            {
                                role:
                                    "user",

                                content:
                                    message
                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "Cerebras"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            `Cerebras HTTP ${response.status}`

        );

    }


    return (

        data
            ?.choices?.[0]
            ?.message?.content ||

        null

    );

}


/* =========================================================
   MISTRAL
========================================================= */

async function callMistral(message) {

    const model =
        process.env.MISTRAL_MODEL ||

        "mistral-small-latest";


    const response =
        await fetch(

            "https://api.mistral.ai/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.MISTRAL_API_KEY}`

                },

                body:
                    JSON.stringify({

                        model,

                        messages: [

                            {
                                role:
                                    "system",

                                content:
                                    KLYDE_SYSTEM_PROMPT
                            },

                            {
                                role:
                                    "user",

                                content:
                                    message
                            }

                        ]

                    })

            }

        );


    const data =
        await readJSON(
            response,
            "Mistral"
        );


    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            `Mistral HTTP ${response.status}`

        );

    }


    return (

        data
            ?.choices?.[0]
            ?.message?.content ||

        null

    );

}
