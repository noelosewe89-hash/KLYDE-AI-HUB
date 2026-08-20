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

    try {
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
                   model: "groq/compound-mini",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB. Be helpful, clear, friendly and practical."
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
            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    `Groq HTTP ${response.status}`
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(502).json({
                error: "Groq returned an empty response."
            });
        }

        return res.status(200).json({
            reply: reply,
            provider: "Groq"
        });

    } catch (error) {

        console.error("KLYDE GROQ ERROR:", error);

        return res.status(500).json({
            error:
                error?.message ||
                "KLYDE AI backend error."
        });
    }
}
