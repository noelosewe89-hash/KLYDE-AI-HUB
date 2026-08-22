/* =========================================================
   KLYDE AI HUB — SPORTS ENGINE

   LIVE:
   - SportMonks
   - API-Football fallback
   - Live scores
   - Teams
   - League
   - Match state
   - Fixture ID
   - TV station data when supplied

   FIXTURES:
   - API-Football

   RESULTS:
   - API-Football

   IMPORTANT:
   - API keys stay on the server.
   - Frontend receives normalized match data.
   - Broadcaster lookup remains handled by /api/broadcasts.js.
========================================================= */

export default async function handler(req, res) {

    /* =====================================================
       METHOD CHECK
    ===================================================== */

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    /* =====================================================
       REQUEST TYPE
    ===================================================== */

    const type =
        req.query?.type || "live";


    try {

        /* =================================================
           LIVE — TRY SPORTMONKS FIRST
        ================================================= */

        if (
            type === "live" &&
            process.env.SPORTMONKS_API_KEY
        ) {

            try {

                console.log(
                    "KLYDE SPORTS: Trying SportMonks live..."
                );


                const sportMonksURL =
                    "https://api.sportmonks.com/v3/football/livescores/inplay" +
                    "?api_token=" +
                    encodeURIComponent(
                        process.env.SPORTMONKS_API_KEY
                    ) +
                    "&include=tvStations;league;participants;state;scores";


                const response =
                    await fetch(
                        sportMonksURL,
                        {
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.message ||
                        `SportMonks HTTP ${response.status}`
                    );

                }


                const sourceMatches =
                    Array.isArray(data?.data)
                        ? data.data
                        : [];


                const matches =
                    normalizeSportMonksMatches(
                        sourceMatches
                    );


                /*
                 * IMPORTANT:
                 *
                 * If SportMonks actually has matches,
                 * use them immediately.
                 */

                if (matches.length > 0) {

                    console.log(
                        `KLYDE SPORTS: SportMonks returned ${matches.length} live matches.`
                    );


                    return res.status(200).json({

                        success: true,

                        type: "live",

                        provider: "SportMonks",

                        results:
                            matches.length,

                        matches

                    });

                }


                /*
                 * SportMonks returned ZERO.
                 *
                 * DO NOT stop here.
                 *
                 * Continue to API-Football.
                 */

                console.log(
                    "KLYDE SPORTS: SportMonks returned zero live matches. Trying API-Football..."
                );

            }

            catch (sportMonksError) {

                console.error(
                    "KLYDE SPORTMONKS ERROR:",
                    sportMonksError?.message ||
                    sportMonksError
                );


                /*
                 * IMPORTANT:
                 *
                 * Do NOT return an error.
                 *
                 * Continue to API-Football fallback.
                 */

            }

        }


        /* =================================================
           API-FOOTBALL
        ================================================= */

        const apiFootballKey =
            process.env.API_FOOTBALL_KEY;


        /*
         * If API-Football isn't configured and
         * SportMonks also failed, return a clean
         * response instead of crashing.
         */

        if (!apiFootballKey) {

            console.error(
                "KLYDE SPORTS: API_FOOTBALL_KEY is not configured."
            );


            return res.status(200).json({

                success: true,

                type,

                provider:
                    "KLYDE SPORTS",

                results: 0,

                matches: [],

                fallback: false,

                message:
                    "No backup sports API is configured."

            });

        }


        /* =================================================
           BUILD API-FOOTBALL URL
        ================================================= */

        let apiFootballURL;


        if (type === "fixtures") {

            apiFootballURL =
                "https://v3.football.api-sports.io/fixtures?next=10";

        }

        else if (type === "results") {

            apiFootballURL =
                "https://v3.football.api-sports.io/fixtures?last=10";

        }

        else {

            /*
             * LIVE FALLBACK
             */

            apiFootballURL =
                "https://v3.football.api-sports.io/fixtures?live=all";

        }


        console.log(
            `KLYDE SPORTS: Requesting API-Football ${type}...`
        );


        /* =================================================
           CALL API-FOOTBALL
        ================================================= */

        const response =
            await fetch(
                apiFootballURL,
                {

                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "x-apisports-key":
                            apiFootballKey

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data?.message ||

                data?.errors?.message ||

                `API-Football HTTP ${response.status}`

            );

        }


        /* =================================================
           CHECK API-FOOTBALL RESPONSE
        ================================================= */

        const sourceMatches =
            Array.isArray(data?.response)
                ? data.response
                : [];


        /* =================================================
           NORMALIZE API-FOOTBALL
        ================================================= */

        const matches =
            normalizeApiFootballMatches(
                sourceMatches
            );


        console.log(
            `KLYDE SPORTS: API-Football returned ${matches.length} ${type} matches.`
        );


        /* =================================================
           FINAL RESPONSE
        ================================================= */

        return res.status(200).json({

            success: true,

            type,

            provider:
                "API-Football",

            results:
                matches.length,

            matches,

            fallback:
                type === "live"

        });

    }


    /* =====================================================
       GLOBAL ERROR HANDLER
    ===================================================== */

    catch (error) {

        console.error(
            "KLYDE SPORTS ERROR:",
            error
        );


        return res.status(200).json({

            success: false,

            type,

            provider:
                "KLYDE SPORTS",

            results: 0,

            matches: [],

            error:
                error?.message ||
                "KLYDE Sports backend error."

        });

    }

}


/* =========================================================
   SPORTMONKS NORMALIZER
========================================================= */

function normalizeSportMonksMatches(
    sourceMatches
) {

    if (
        !Array.isArray(sourceMatches)
    ) {

        return [];

    }


    return sourceMatches
        .map(fixture => {

            if (!fixture) {
                return null;
            }


            /* =================================================
               PARTICIPANTS
            ================================================= */

            const participants =
                Array.isArray(
                    fixture.participants
                )
                    ? fixture.participants
                    : [];


            const home =
                participants.find(
                    team =>
                        team?.meta?.location ===
                        "home"
                ) ||
                participants[0] ||
                {};


            const away =
                participants.find(
                    team =>
                        team?.meta?.location ===
                        "away"
                ) ||
                participants[1] ||
                {};


            /* =================================================
               SCORES
            ================================================= */

            const scores =
                Array.isArray(
                    fixture.scores
                )
                    ? fixture.scores
                    : [];


            function getCurrentScore(
                participantId
            ) {

                const score =
                    scores.find(
                        item =>

                            String(
                                item?.participant_id
                            ) ===
                            String(
                                participantId
                            )

                            &&

                            (
                                item?.description ===
                                "CURRENT"

                                ||

                                item?.description ===
                                "CURRENT SCORE"

                                ||

                                item?.description ===
                                "CURRENT_SCORE"
                            )
                    );


                return (

                    score?.score?.goals ??

                    score?.goals ??

                    0

                );

            }


            /* =================================================
               STATE
            ================================================= */

            const state =
                fixture.state || {};


            /* =================================================
               TV STATIONS
            ================================================= */

            const tvStations =
                fixture.tvStations ||

                fixture.tv_stations ||

                [];


            /* =================================================
               NORMALIZED OBJECT
            ================================================= */

            return {

                fixture: {

                    id:
                        fixture.id,

                    date:
                        fixture.starting_at ||

                        (
                            fixture.starting_at_timestamp
                                ? new Date(
                                    fixture.starting_at_timestamp *
                                    1000
                                ).toISOString()
                                : null
                        ),

                    status: {

                        long:
                            state.name ||

                            "LIVE",

                        short:
                            "LIVE",

                        elapsed:
                            state.minute ||

                            null

                    }

                },


                league: {

                    id:
                        fixture.league_id,

                    name:
                        fixture?.league?.name ||

                        "Football",

                    country:
                        fixture?.league?.country ||

                        ""

                },


                teams: {

                    home: {

                        id:
                            home.id,

                        name:
                            home.name ||

                            "Home",

                        logo:
                            home.image_path ||

                            null

                    },


                    away: {

                        id:
                            away.id,

                        name:
                            away.name ||

                            "Away",

                        logo:
                            away.image_path ||

                            null

                    }

                },


                goals: {

                    home:
                        getCurrentScore(
                            home.id
                        ),

                    away:
                        getCurrentScore(
                            away.id
                        )

                },


                events:
                    Array.isArray(
                        fixture.events
                    )
                        ? fixture.events
                        : [],


                tvStations,


                sportmonks: {

                    fixture_id:
                        fixture.id,

                    league_id:
                        fixture.league_id,

                    starting_at:
                        fixture.starting_at ||

                        null

                }

            };

        })


        .filter(Boolean);

}


/* =========================================================
   API-FOOTBALL NORMALIZER
========================================================= */

function normalizeApiFootballMatches(
    sourceMatches
) {

    if (
        !Array.isArray(sourceMatches)
    ) {

        return [];

    }


    return sourceMatches
        .map(match => {

            if (!match) {
                return null;
            }


            const fixture =
                match.fixture || {};


            const league =
                match.league || {};


            const teams =
                match.teams || {};


            const goals =
                match.goals || {};


            const status =
                fixture.status || {};


            const home =
                teams.home || {};


            const away =
                teams.away || {};


            return {

                fixture: {

                    id:
                        fixture.id ||

                        null,

                    date:
                        fixture.date ||

                        null,

                    status: {

                        long:
                            status.long ||

                            "MATCH",

                        short:
                            status.short ||

                            "NS",

                        elapsed:
                            status.elapsed ||

                            null

                    }

                },


                league: {

                    id:
                        league.id ||

                        null,

                    name:
                        league.name ||

                        "Football",

                    country:
                        league.country ||

                        ""

                },


                teams: {

                    home: {

                        id:
                            home.id ||

                            null,

                        name:
                            home.name ||

                            "Home",

                        logo:
                            home.logo ||

                            null

                    },


                    away: {

                        id:
                            away.id ||

                            null,

                        name:
                            away.name ||

                            "Away",

                        logo:
                            away.logo ||

                            null

                    }

                },


                goals: {

                    home:
                        goals.home ?? 0,

                    away:
                        goals.away ?? 0

                },


                events:
                    Array.isArray(
                        match.events
                    )
                        ? match.events
                        : [],


                tvStations:
                    match.tvStations ||

                    [],


                apiFootball: {

                    fixture_id:
                        fixture.id ||

                        null,

                    league_id:
                        league.id ||

                        null,

                    status:
                        status.short ||

                        null

                }

            };

        })


        .filter(Boolean);

}
