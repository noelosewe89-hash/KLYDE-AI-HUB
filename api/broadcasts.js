export default async function handler(req, res) {
    const token = process.env.SPORTMONKS_API_KEY;

    if (!token) {
        return res.status(500).json({
            error: "SPORTMONKS_API_KEY is not configured."
        });
    }

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
                error:
                    data?.message ||
                    "Sportmonks request failed."
            });
        }

        const stations =
            data?.data?.tvStations ||
            data?.data?.tv_stations ||
            [];

        return res.status(200).json({
            success: true,
            fixture: fixtureId,
            broadcasters: stations
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}
