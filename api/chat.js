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

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            error: "GEMINI_API_KEY is not configured."
        });
    }

    try {
        const model =
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash";

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text:
                                    "You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB. Be helpful, clear, friendly and practical. If asked who you are, say you are KLYDE AI."
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

        console.log(
            "Gemini status:",
            response.status
        );

        if (!response.ok) {
            console.error(
                "Gemini error:",
                data
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    `Gemini HTTP ${response.status}`
            });
        }

        const reply =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part.text || "")
                ?.join("") ||
            null;

        if (!reply) {
            return res.status(502).json({
                error:
                    "Gemini returned an empty response."
            });
        }

        return res.status(200).json({
            reply: reply.trim(),
            provider: "Gemini"
        });

    } catch (error) {

        console.error(
            "KLYDE GEMINI ERROR:",
            error
        );

        return res.status(500).json({
            error:
                error?.message ||
                "Gemini connection failed."
        });
    }
}
