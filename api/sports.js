export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const API_KEY =
        process.env.API_FOOTBALL_KEY;

    if (!API_KEY) {
        return res.status(500).json({
            error: "API_FOOTBALL_KEY is not configured."
        });
    }

    const type =
        req.query.type || "fixtures";

    const date =
        req.query.date ||
        new Date().toISOString().split("T")[0];

    let endpoint = "";

    if (type === "live") {

        endpoint =
            "https://v3.football.api-sports.io/fixtures?live=all";

    }

    else if (type === "results") {

        endpoint =
            `https://v3.football.api-sports.io/fixtures?date=${date}`;

    }

    else if (type === "fixtures") {

        endpoint =
            `https://v3.football.api-sports.io/fixtures?date=${date}`;

    }

    else if (type === "standings") {

        /*
         Kenyan Premier League.
         We'll make league selection
         configurable later.
        */

        endpoint =
            "https://v3.football.api-sports.io/standings?league=276&season=2025";

    }

    else {

        return res.status(400).json({
            error: "Unknown sports request."
        });

    }


    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "GET",

                    headers: {
                        "x-apisports-key":
                            API_KEY
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            return res.status(
                response.status
            ).json({

                error:
                    data?.message ||
                    "Sports API request failed."

            });

        }


        return res.status(200).json({

            success: true,

            type: type,

            results:
                data?.results || 0,

            response:
                data?.response || []

        });


    } catch (error) {

        console.error(
            "KLYDE SPORTS ERROR:",
            error
        );


        return res.status(500).json({

            error:
                error?.message ||
                "Unable to connect to sports provider."

        });

    }

}
