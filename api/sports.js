export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Sports API key is missing."
        });
    }

    const type = req.query.type || "fixtures";

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const date = req.query.date || today;

    let url;

    if (type === "live") {

        url =
            "https://v3.football.api-sports.io/fixtures?live=all";

    } else if (type === "fixtures") {

        url =
            `https://v3.football.api-sports.io/fixtures?date=${date}`;

    } else if (type === "results") {

        url =
            `https://v3.football.api-sports.io/fixtures?date=${date}`;

    } else {

        return res.status(400).json({
            error:
                "Invalid sports request."
        });
    }

    try {

        const response = await fetch(url, {
            headers: {
                "x-apisports-key": apiKey
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.message ||
                    "Sports provider error."
            });
        }

        const matches =
            (data?.response || []).map(match => ({

                id: match.fixture?.id,

                status:
                    match.fixture?.status?.short,

                elapsed:
                    match.fixture?.status?.elapsed,

                date:
                    match.fixture?.date,

                league: {
                    id:
                        match.league?.id,

                    name:
                        match.league?.name,

                    country:
                        match.league?.country,

                    logo:
                        match.league?.logo
                },

                home: {
                    id:
                        match.teams?.home?.id,

                    name:
                        match.teams?.home?.name,

                    logo:
                        match.teams?.home?.logo,

                    score:
                        match.goals?.home
                },

                away: {
                    id:
                        match.teams?.away?.id,

                    name:
                        match.teams?.away?.name,

                    logo:
                        match.teams?.away?.logo,

                    score:
                        match.goals?.away
                }

            }));


        return res.status(200).json({

            success: true,

            type: type,

            date: date,

            results:
                matches.length,

            matches: matches

        });

    } catch (error) {

        console.error(
            "KLYDE SPORTS ERROR:",
            error
        );

        return res.status(500).json({

            error:
                error?.message ||
                "Sports service unavailable."

        });

    }
}
