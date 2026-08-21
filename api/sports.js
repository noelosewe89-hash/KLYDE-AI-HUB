/* =========================================================
   KLYDE AI HUB — SPORTS ENGINE

   LIVE:
   - SportMonks
   - Live scores
   - Teams
   - League
   - Match state
   - Fixture ID
   - TV station data when supplied

   FIXTURES / RESULTS:
   - API-Football

   IMPORTANT:
   - Do not expose API keys to the frontend.
   - Broadcaster lookup remains handled by /api/broadcasts.js.
========================================================= */


export default async function handler(req, res) {


    /* =====================================================
       METHOD CHECK
    ===================================================== */

    if (req.method !== "GET") {

        return res.status(405).json({

            error:
                "Method not allowed"

        });

    }


    try {


        /* =================================================
           REQUEST TYPE
        ================================================= */

        const type =
            req.query.type ||
            "live";


        /* =================================================
           LIVE MATCHES — SPORTMONKS
           ================================================= */

        if (
            type === "live" &&
            process.env.SPORTMONKS_API_KEY
        ) {


            const url =

                "https://api.sportmonks.com/v3/football/livescores/inplay" +

                "?api_token=" +

                encodeURIComponent(
                    process.env.SPORTMONKS_API_KEY
                ) +

                "&include=tvStations;league;participants;state;scores";


            const response =

                await fetch(

                    url,

                    {

                        method:
                            "GET",

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

                Array.isArray(
                    data?.data
                )

                    ? data.data

                    : [];


            /* =================================================
               NORMALIZE SPORTMONKS MATCHES
            ================================================= */

            const matches =

                sourceMatches.map(

                    fixture => {


                        const participants =

                            Array.isArray(
                                fixture?.participants
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


                        const scores =

                            Array.isArray(
                                fixture?.scores
                            )

                                ? fixture.scores

                                : [];


                        /* =====================================
                           SCORE HELPER
                        ===================================== */

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

                                        )

                                );


                            return (

                                score?.score?.goals ??

                                score?.goals ??

                                0

                            );

                        }


                        /* =====================================
                           TV STATIONS
                        ===================================== */

                        const tvStations =

                            fixture?.tvStations ||

                            fixture?.tv_stations ||

                            [];


                        /* =====================================
                           MATCH STATE
                        ===================================== */

                        const state =

                            fixture?.state ||

                            {};


                        /* =====================================
                           NORMALIZED MATCH
                        ===================================== */

                        return {


                            fixture: {

                                id:
                                    fixture?.id,

                                date:
                                    fixture?.starting_at ||

                                    fixture?.starting_at_timestamp ||

                                    null,

                                status: {

                                    long:
                                        state?.name ||

                                        "LIVE",

                                    short:
                                        "LIVE",

                                    elapsed:
                                        null

                                }

                            },


                            league: {

                                id:
                                    fixture?.league_id,

                                name:
                                    fixture?.league?.name ||

                                    "Football"

                            },


                            teams: {

                                home: {

                                    id:
                                        home?.id,

                                    name:
                                        home?.name ||

                                        "Home",

                                    logo:
                                        home?.image_path ||

                                        null

                                },


                                away: {

                                    id:
                                        away?.id,

                                    name:
                                        away?.name ||

                                        "Away",

                                    logo:
                                        away?.image_path ||

                                        null

                                }

                            },


                            goals: {

                                home:

                                    getCurrentScore(
                                        home?.id
                                    ),


                                away:

                                    getCurrentScore(
                                        away?.id
                                    )

                            },


                            /* =================================
                               BROADCAST INFORMATION
                            ================================= */

                            tvStations:
                                tvStations,


                            /* =================================
                               ORIGINAL PROVIDER DATA
                               Useful for future expansion.
                            ================================= */

                            sportmonks: {

                                fixture_id:
                                    fixture?.id,

                                league_id:
                                    fixture?.league_id,

                                starting_at:
                                    fixture?.starting_at ||

                                    null

                            }

                        };

                    }

                );


            return res.status(200).json({

                success:
                    true,

                type:
                    "live",

                provider:
                    "SportMonks",

                results:
                    matches.length,

                matches:
                    matches

            });

        }


        /* =================================================
           API-FOOTBALL FALLBACK

           Used when SportMonks isn't configured.

           Also continues handling:
           - fixtures
           - results
        ================================================= */

        const apiKey =

            process.env.API_FOOTBALL_KEY;


        if (!apiKey) {

            return res.status(500).json({

                error:
                    "No sports API key is configured."

            });

        }


        let url =

            "https://v3.football.api-sports.io/fixtures?live=all";


        /* =================================================
           UPCOMING FIXTURES
        ================================================= */

        if (
            type === "fixtures"
        ) {

            url =

                "https://v3.football.api-sports.io/fixtures?next=10";

        }


        /* =================================================
           RECENT RESULTS
        ================================================= */

        if (
            type === "results"
        ) {

            url =

                "https://v3.football.api-sports.io/fixtures?last=10";

        }


        const response =

            await fetch(

                url,

                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "x-apisports-key":
                            apiKey

                    }

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data?.message ||

                `API-Football HTTP ${response.status}`

            );

        }


        return res.status(200).json({

            success:
                true,

            type:
                type,

            provider:
                "API-Football",

            results:
                data?.results ||

                0,

            matches:
                data?.response ||

                []

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


        return res.status(500).json({

            error:

                error?.message ||

                "KLYDE Sports backend error."

        });

    }

}
