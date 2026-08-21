export default async function handler(req, res) {

    const token = process.env.SPORTMONKS_API_KEY;

    const fixtureId = req.query.fixture;

    if (!fixtureId) {
        return res.status(400).json({
            error: "Fixture ID is required."
        });
    }

    try {

        const url =
            `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${encodeURIComponent(token)}&include=tvStations`;

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {

            return res.status(response.status).json({
                success: false,
                error: data?.message || "Sportmonks request failed.",
                details: data
            });

        }

        const stations =
            data?.data?.tvStations ||
            data?.data?.tv_stations ||
            [];

        return res.status(200).json({

            success: true,

            fixture: fixtureId,

            results: stations.length,

            broadcasters: stations

        });

    } catch (error) {

        console.error(
            "KLYDE BROADCAST ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            error: error.message

        });

    }

}
