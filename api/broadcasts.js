export default async function handler(req, res) {

    try {

        const token = process.env.SPORTMONKS_API_KEY;

        const fixture =
            req.query.fixture || "1522004";

        if (!token) {

            return res.status(500).json({
                error: "Sportmonks token not available to this function."
            });

        }

        const response = await fetch(
            `https://api.sportmonks.com/v3/football/fixtures/${fixture}?api_token=${token}&include=tvStations`
        );

        const data = await response.json();

        return res.status(response.status).json({
            success: response.ok,
            fixture: fixture,
            data: data
        });

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });

    }

}
