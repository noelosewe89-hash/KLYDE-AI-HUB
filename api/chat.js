export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { message } = req.body || {};

    if (!message) {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    /*
     * KLYDE AI PROVIDER FALLBACK
     *
     * Priority:
     * 1. Gemini
     * 2. Groq
     * 3. OpenAI
     *
     * A provider is skipped automatically if its API key
     * is not configured.
     */

    const providers = [
        {
            name: "Gemini",
            key: process.env.GEMINI_API_KEY,
            run: () => callGemini(message)
        },

        {
            name: "Groq",
            key: process.env.GROQ_API_KEY,
            run: () =>
                callOpenAICompatible(
                    "https://api.groq.com/openai/v1/chat/completions",
                    process.env.GROQ_API_KEY,
                    process.env.GROQ_MODEL ||
                        "llama-3.3-70b-versatile",
                    message
                )
        },

        {
            name: "OpenAI",
            key: process.env.OPENAI_API_KEY,
            run: () =>
                callOpenAICompatible(
                    "https://api.openai.com/v1/chat/completions",
                    process.env.OPENAI_API_KEY,
                    process.env.OPENAI_MODEL ||
                        "gpt-5-mini",
                    message
                )
        }
    ];


    const errors = [];


    /*
     * TRY EACH PROVIDER
     */

    for (const provider of providers) {

        if (!provider.key) {
            continue;
        }


        try {

            const reply = await provider.run();


            if (reply) {

                return res.status(200).json({
                    reply: reply,
                    provider: provider.name
                });

            }


            errors.push(
                `${provider.name}: empty response`
            );

        }


        catch (error) {

            /*
             * DO NOT STOP HERE.
             *
             * If Gemini fails because of quota,
             * rate limits, downtime, etc.,
             * KLYDE moves to the next provider.
             */

            errors.push(
                `${provider.name}: ${error.message}`
            );

        }

    }


    /*
     * NO PROVIDERS CONFIGURED
     */

    if (errors.length === 0) {

        return res.status(503).json({

            error:
                "KLYDE AI has no configured AI providers. " +
                "Add GEMINI_API_KEY, GROQ_API_KEY, " +
                "or OPENAI_API_KEY in Vercel."

        });

    }


    /*
     * EVERYTHING FAILED
     */

    return res.status(503).json({

        error:
            "KLYDE AI could not connect to any available " +
            "AI provider. Please try again shortly."

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

                "Content-Type":
                    "application/json"

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


    const data =
        await response.json();


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
            ?.text ||

        null

    );

}



/* =========================================================
   OPENAI-COMPATIBLE PROVIDERS
   Used for Groq and OpenAI
========================================================= */

async function callOpenAICompatible(
    url,
    apiKey,
    model,
    message
) {

    const response = await fetch(

        url,

        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                "Authorization":
                    `Bearer ${apiKey}`

            },

            body: JSON.stringify({

                model: model,

                messages: [

                    {

                        role: "user",

                        content: message

                    }

                ]

            })

        }

    );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(

            data.error?.message ||
            `Provider HTTP ${response.status}`

        );

    }


    return (

        data
            .choices?.[0]
            ?.message?.content ||

        null

    );

}
