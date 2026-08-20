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

    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY is not configured."
        });
    }

    try {
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
                            content:
                                "You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB. Be helpful, clear, friendly and practical. If asked who you are, say you are KLYDE AI."
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

        console.log(
            "OpenRouter status:",
            response.status
        );

        if (!response.ok) {
            console.error(
                "OpenRouter error:",
                data
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    `OpenRouter HTTP ${response.status}`
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(502).json({
                error:
                    "OpenRouter returned an empty response."
            });
        }

        return res.status(200).json({
            reply: reply.trim(),
            provider: "OpenRouter"
        });

    } catch (error) {

        console.error(
            "KLYDE OPENROUTER ERROR:",
            error
        );

        return res.status(500).json({
            error:
                error?.message ||
                "OpenRouter connection failed."
        });
    }
}
