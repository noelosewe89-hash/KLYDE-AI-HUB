export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const apiKey = process.env.API_FOOTBALL_KEY;

        const type = req.query.type || "live";

        let url =
            "https://v3.football.api-sports.io/fixtures?live=all";

        if (type === "fixtures") {
            url =
                "https://v3.football.api-sports.io/fixtures?next=10";
        }

        if (type === "results") {
            url =
                "https://v3.football.api-sports.io/fixtures?last=10";
        }

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
                    "API-Football request failed."
            });
        }

        return res.status(200).json({
            success: true,
            type,
            results: data?.results || 0,
            matches: data?.response || []
        });

    } catch (error) {

        console.error(
            "KLYDE SPORTS ERROR:",
            error
        );

        return res.status(500).json({
            error:
                error?.message ||
                "KLYDE Sports backend error."
        });
    }
}
