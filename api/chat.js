export default async function handler(req, res) {

    /* =========================================================
       METHOD CHECK
    ========================================================= */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =========================================================
       GET USER MESSAGE
    ========================================================= */

    const { message } = req.body || {};


    if (
        !message ||
        typeof message !== "string"
    ) {

        return res.status(400).json({
            error: "Message is required"
        });

    }


    /* =========================================================
       AI PROVIDERS
       KLYDE keeps fallback support
    ========================================================= */

    const providers = [

        {
            name: "Groq",

            key:
                process.env.GROQ_API_KEY,

            call:
                () => callGroq(message)

        },

        {
            name: "Gemini",

            key:
                process.env.GEMINI_API_KEY,

            call:
                () => callGemini(message)

        }

    ];


    const failures = [];


    /* =========================================================
       TRY PROVIDERS ONE BY ONE
    ========================================================= */

    for (
        const provider of providers
    ) {

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


            const reply =
                await provider.call();


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

            console.error(
                `${provider.name} failed:`,
                error?.message || error
            );


            failures.push(

                `${provider.name}: ${
                    error?.message ||
                    "Unknown provider error"
                }`

            );

        }

    }


    /* =========================================================
       BOTH PROVIDERS FAILED
    ========================================================= */

    console.error(
        "KLYDE AI provider failures:",
        failures
    );


    /*
       IMPORTANT:
       We return the actual provider failure so we can see
       exactly what is wrong instead of the vague:
       "could not connect to any available AI provider."
    */

    return res.status(503).json({

        error:
            "KLYDE AI could not connect to any available AI provider.",

        details:
            failures

    });

}


/* =============================================================
   KLYDE AI IDENTITY
============================================================= */

const KLYDE_SYSTEM_PROMPT = `

You are KLYDE AI, the intelligent assistant
inside KLYDE AI HUB.

Your identity is KLYDE AI.

Be intelligent, helpful, clear, natural,
confident and practical.

Give useful answers instead of unnecessary
disclaimers.

Remember that you are the assistant inside
KLYDE AI HUB.

If the user asks who you are, say:

"I am KLYDE AI, the intelligent assistant inside KLYDE AI HUB."

Never introduce yourself as Groq or Gemini.

The underlying AI provider is an internal
implementation detail.

Only mention the provider if the user
specifically asks which AI technology or
provider is powering the response.

`;


/* =============================================================
   GROQ
============================================================= */

async function callGroq(message) {

    const model =
        process.env.GROQ_MODEL ||
        "groq/compound-mini";


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

                        model: model,

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

                        ]

                    })

            }

        );


    /* =========================================================
       READ GROQ RESPONSE SAFELY
    ========================================================= */

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
            `Groq returned a non-JSON response (HTTP ${response.status})`
        );

    }


    /* =========================================================
       GROQ ERROR
    ========================================================= */

    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            data?.message ||

            `Groq HTTP ${response.status}`

        );

    }


    /* =========================================================
       GROQ ANSWER
    ========================================================= */

    const answer =

        data
            ?.choices?.[0]
            ?.message?.content;


    if (
        !answer ||
        typeof answer !== "string"
    ) {

        throw new Error(
            "Groq returned no usable answer."
        );

    }


    return answer;

}


/* =============================================================
   GEMINI
============================================================= */

async function callGemini(message) {

    /*
       You can override this in Vercel with:

       GEMINI_MODEL=gemini-3.6-flash

       Otherwise KLYDE uses this default.
    */

    const model =

        process.env.GEMINI_MODEL ||

        "gemini-3.6-flash";


    const apiKey =
        process.env.GEMINI_API_KEY;


    if (!apiKey) {

        throw new Error(
            "GEMINI_API_KEY is not configured."
        );

    }


    /* =========================================================
       GEMINI URL
    ========================================================= */

    const url =

        "https://generativelanguage.googleapis.com/v1beta/models/" +

        encodeURIComponent(model) +

        ":generateContent?key=" +

        encodeURIComponent(apiKey);


    /* =========================================================
       GEMINI REQUEST
    ========================================================= */

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


    /* =========================================================
       READ GEMINI RESPONSE SAFELY
    ========================================================= */

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

            `Gemini returned a non-JSON response (HTTP ${response.status})`

        );

    }


    /* =========================================================
       GEMINI ERROR
    ========================================================= */

    if (!response.ok) {

        throw new Error(

            data?.error?.message ||

            data?.message ||

            `Gemini HTTP ${response.status}`

        );

    }


    /* =========================================================
       GEMINI ANSWER
    ========================================================= */

    const answer =

        data
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(
                part =>
                    part?.text || ""
            )
            ?.join("");


    if (
        !answer ||
        !answer.trim()
    ) {

        throw new Error(
            "Gemini returned no usable answer."
        );

    }


    return answer;

}
