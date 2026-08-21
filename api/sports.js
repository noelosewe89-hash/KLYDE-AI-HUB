export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.API_FOOTBALL_KEY;

console.log(
    "KLYDE SPORTS KEY STATUS:",
    apiKey ? "FOUND" : "MISSING"
);
    if (!apiKey) {
        return res.status(500).json({
            error: "Sports API key is missing."
        });
    }

    const type = req.query.type || "fixtures"; // KLYDE SPORTS

    let url;

    if (type === "live") {
        url =
            "https://v3.football.api-sports.io/fixtures?live=all";
    }

    else if (type === "fixtures") {
        url =
            "https://v3.football.api-sports.io/fixtures?next=10";
    }

    else if (type === "results") {
        url =
            "https://v3.football.api-sports.io/fixtures?last=10";
    }

    else {
        return res.status(400).json({
            error:
                "Invalid type. Use live, fixtures or results."
        });
    }

    try {

        const response = await fetch(url, {
            method: "GET",

            headers: {
                "x-apisports-key": apiKey
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.message ||
                    "Sports provider request failed."
            });
        }

        return res.status(200).json({
            success: true,
            type: type,
            results: data?.results || 0,
            response: data?.response || []
        });

    } catch (error) {

        console.error(
            "KLYDE SPORTS ERROR:",
            error
        );

        return res.status(500).json({
            error:
                error?.message ||
                "Could not connect to sports provider."
        });
    }
}
