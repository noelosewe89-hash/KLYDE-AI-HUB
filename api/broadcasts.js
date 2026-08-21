export default async function handler(req, res) {

    const token =
        process.env.SPORTMONKS_API_KEY;

    const fixtureId =
        req.query.fixture;


    if (!fixtureId) {

        return res.status(400).json({
            error: "Fixture ID is required."
        });

    }


    if (!token) {

        return res.status(500).json({
            success: false,
            error: "SPORTMONKS_API_KEY is not configured."
        });

    }


    try {

        /* =================================================
           GET FIXTURE + TV STATIONS
        ================================================= */

        const url =
            `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}` +
            `?api_token=${encodeURIComponent(token)}` +
            `&include=tvStations;league;participants`;


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            return res.status(response.status).json({

                success: false,

                error:
                    data?.message ||
                    "Sportmonks request failed.",

                details: data

            });

        }


        const fixture =
            data?.data || {};


        /* =================================================
           SPORTMONKS BROADCASTERS
        ================================================= */

        const stations =
            fixture?.tvStations ||
            fixture?.tv_stations ||
            [];


        const broadcasters =
            stations.map(
                station => {

                    const tvstation =
                        station?.tvstation ||
                        {};


                    return {

                        ...station,

                        name:
                            tvstation.name ||
                            station.name ||
                            station.station ||
                            "Official Broadcaster",

                        url:
                            tvstation.url ||
                            station.url ||
                            station.link ||
                            "",

                        source:
                            "Sportmonks",

                        verified:
                            true

                    };

                }
            );


        /* =================================================
           FIXTURE INFORMATION
        ================================================= */

        const league =
            fixture?.league || {};


        const leagueName =
            String(
                league?.name || ""
            );


        const country =
            String(
                league?.country?.name ||
                league?.country ||
                ""
            );


        const searchableText =
            (
                leagueName +
                " " +
                country
            ).toLowerCase();


        /* =================================================
           DUPLICATE PROTECTION
        ================================================= */

        function addSource(source) {

            const exists =
                broadcasters.some(
                    item => {

                        const existingUrl =
                            String(
                                item?.url || ""
                            )
                                .toLowerCase();

                        const newUrl =
                            String(
                                source?.url || ""
                            )
                                .toLowerCase();

                        return (
                            existingUrl &&
                            newUrl &&
                            existingUrl === newUrl
                        );

                    }
                );


            if (!exists) {

                broadcasters.push(
                    source
                );

            }

        }


        /* =================================================
           FIFA+
           -------------------------------------------------
           FIFA+ officially streams thousands of matches
           from member associations and federations.
        ================================================= */

        const africanCountries = [

            "algeria",
            "angola",
            "benin",
            "botswana",
            "burkina",
            "burundi",
            "cameroon",
            "central african",
            "comoros",
            "congo",
            "cote d'ivoire",
            "côte d'ivoire",
            "djibouti",
            "egypt",
            "equatorial guinea",
            "eswatini",
            "ethiopia",
            "gabon",
            "gambia",
            "ghana",
            "guinea",
            "guinea-bissau",
            "kenya",
            "lesotho",
            "liberia",
            "libya",
            "madagascar",
            "malawi",
            "mali",
            "mauritania",
            "mauritius",
            "morocco",
            "mozambique",
            "namibia",
            "niger",
            "nigeria",
            "rwanda",
            "senegal",
            "seychelles",
            "sierra leone",
            "somalia",
            "south africa",
            "south sudan",
            "sudan",
            "tanzania",
            "togo",
            "tunisia",
            "uganda",
            "zambia",
            "zimbabwe"

        ];


        const isAfrican =
            africanCountries.some(
                name =>
                    searchableText.includes(
                        name
                    )
            );


        if (isAfrican) {

            addSource({

                name:
                    "FIFA+",

                station:
                    "FIFA+",

                url:
                    "https://www.fifa.com/fifaplus",

                source:
                    "FIFA+",

                verified:
                    true,

                free:
                    true,

                type:
                    "official-free-platform",

                note:
                    "FIFA+ carries selected live football matches. Availability depends on competition and territory."

            });

        }


        /* =================================================
           CAF TV
           -------------------------------------------------
           CAF confirms CAF TV on YouTube carries selected
           CAF competitions live.
        ================================================= */

        const isCAF =
            searchableText.includes("caf") ||

            searchableText.includes(
                "africa cup"
            ) ||

            searchableText.includes(
                "champions league"
            ) ||

            searchableText.includes(
                "confederation cup"
            ) ||

            searchableText.includes(
                "u17"
            ) ||

            searchableText.includes(
                "u20"
            );


        if (isCAF) {

            addSource({

                name:
                    "CAF TV",

                station:
                    "CAF TV",

                url:
                    "https://www.youtube.com/@CAF_TV",

                source:
                    "CAF",

                verified:
                    true,

                free:
                    true,

                type:
                    "official-free-platform",

                note:
                    "CAF TV streams selected CAF matches live. Availability depends on the competition."

            });

        }


        /* =================================================
           ONEFOOTBALL
           -------------------------------------------------
           OneFootball officially provides Free-to-Air
           matches in supported territories.
        ================================================= */

        addSource({

            name:
                "OneFootball",

            station:
                "OneFootball",

            url:
                "https://tv.onefootball.com/",

            source:
                "OneFootball",

            verified:
                true,

            free:
                true,

            type:
                "official-free-platform",

            note:
                "OneFootball offers selected Free-to-Air live matches. Availability varies by match and territory."

        });


        /* =================================================
           RETURN RESULT
        ================================================= */

        return res.status(200).json({

            success:
                true,

            fixture:
                fixtureId,

            results:
                broadcasters.length,

            sportmonks_results:
                stations.length,

            fallback_results:
                Math.max(
                    0,
                    broadcasters.length -
                    stations.length
                ),

            fixture_info: {

                league:
                    leagueName,

                country:
                    country

            },

            broadcasters:

                broadcasters

        });

    }


    catch (error) {

        console.error(
            "KLYDE BROADCAST ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            error:
                error?.message ||
                "Broadcast lookup failed."

        });

    }

}
