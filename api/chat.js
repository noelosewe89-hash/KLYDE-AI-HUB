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

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            error: "OPENAI_API_KEY is not configured."
        });
    }

    try {
        const response = await fetch(
            "https://api.openai.com/v1/responses",
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

                    instructions:
                        "You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB. Be helpful, clear, friendly and practical. If asked who you are, say you are KLYDE AI.",

                    input: message
                })
            }
        );

        const data = await response.json();

        console.log(
            "OpenAI status:",
            response.status
        );

        if (!response.ok) {
            console.error(
                "OpenAI error:",
                data
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    `OpenAI HTTP ${response.status}`
            });
        }

        const reply =
            data?.output_text ||
            data?.output
                ?.flatMap(item => item.content || [])
                ?.map(item => item.text || "")
                ?.join("") ||
            null;

        if (!reply) {
            return res.status(502).json({
                error:
                    "OpenAI returned an empty response."
            });
        }

        return res.status(200).json({
            reply: reply.trim(),
            provider: "OpenAI"
        });

    } catch (error) {

        console.error(
            "KLYDE OPENAI ERROR:",
            error
        );

        return res.status(500).json({
            error:
                error?.message ||
                "OpenAI connection failed."
        });
    }
}
