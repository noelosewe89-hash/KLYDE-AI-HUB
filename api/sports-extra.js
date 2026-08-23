/* =========================================================
   KLYDE AI HUB — SPORTS EXTRA ENGINE
   ========================================================

   PURPOSE
   -------
   Independent sports engine for sports not handled by
   the main football engine in /api/sports.js.

   IMPORTANT
   ---------
   - No fake sports data.
   - No search-engine dependency.
   - No KLYDE AI dependency.
   - API keys remain server-side.
   - Providers are connected independently.
   - One provider failure must not break other sports.
   - Each sport has its own adapter.
   - The frontend receives normalized KLYDE event data.

   SPORTS
   -------
   WWE / Wrestling
   Safari Rally / WRC
   Formula 1
   MotoGP
   Tennis
   Basketball
   Athletics
   Rugby
   Boxing
   MMA
   Cricket
   Golf
   Volleyball
   Baseball
   Snooker
   Swimming
========================================================= */

export default async function handler(req, res) {

    /* =====================================================
       METHOD CHECK
    ===================================================== */

    if (req.method !== "GET") {

        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });

    }


    /* =====================================================
       REQUEST PARAMETERS
    ===================================================== */

    const sport =
        String(
            req.query?.sport || ""
        )
            .trim()
            .toLowerCase();


    const type =
        String(
            req.query?.type || "live"
        )
            .trim()
            .toLowerCase();


    /* =====================================================
       NEVER CACHE LIVE DATA
    ===================================================== */

    if (type === "live") {

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );

    }


    try {

        /* =================================================
           SPORT NORMALIZATION
        ================================================= */

        const normalizedSport =
            normalizeSportName(
                sport
            );


        /* =================================================
           SUPPORTED SPORT CHECK
        ================================================= */

        if (
            normalizedSport ===
            "unknown"
        ) {

            return res.status(200).json({

                success: true,

                type,

                sport:
                    sport ||
                    "unknown",

                provider:
                    "KLYDE SPORTS",

                providers: [],

                results: 0,

                events: [],

                live: false,

                dataAvailable: false,

                message:
                    "Sport is not currently supported by KLYDE Sports."

            });

        }


        /* =================================================
           SPORT ROUTER
        ================================================= */

        const result =
            await getSportData(
                normalizedSport,
                type
            );


        /* =================================================
           NORMALIZED RESPONSE
        ================================================= */

        return res.status(200).json({

            success:
                result.success !== false,

            type,

            sport:
                normalizedSport,

            provider:
                result.provider ||
                "KLYDE SPORTS",

            providers:
                result.providers ||
                [],

            results:
                Array.isArray(
                    result.events
                )
                    ? result.events.length
                    : 0,

            events:
                Array.isArray(
                    result.events
                )
                    ? result.events
                    : [],

            live:
                Boolean(
                    result.live
                ),

            dataAvailable:
                Boolean(
                    result.dataAvailable
                ),

            providerStatus:
                result.providerStatus ??
                null,

            message:
                result.message ||
                "KLYDE Sports response."

        });

    }


    /* =====================================================
       GLOBAL ERROR HANDLER
    ===================================================== */

    catch (error) {

        console.error(
            "KLYDE SPORTS EXTRA ERROR:",
            error?.message ||
            error
        );


        return res.status(200).json({

            success: false,

            type,

            sport:
                normalizeSportName(
                    sport
                ),

            provider:
                "KLYDE SPORTS",

            providers: [],

            results: 0,

            events: [],

            live: false,

            dataAvailable: false,

            message:
                error?.message ||
                "KLYDE Sports extra engine error."

        });

    }

}


/* =========================================================
   SPORT NORMALIZATION
========================================================= */

function normalizeSportName(
    sport
) {

    const aliases = {

        /* WWE */

        wwe:
            "wwe",

        wrestling:
            "wwe",


        /* RALLY */

        rally:
            "rally",

        "safari-rally":
            "rally",

        safari:
            "rally",

        wrc:
            "rally",


        /* MOTORSPORT */

        f1:
            "f1",

        "formula-1":
            "f1",

        formula1:
            "f1",

        motogp:
            "motogp",


        /* COURT SPORTS */

        tennis:
            "tennis",

        basketball:
            "basketball",

        volleyball:
            "volleyball",


        /* FIELD SPORTS */

        rugby:
            "rugby",

        cricket:
            "cricket",

        baseball:
            "baseball",


        /* ATHLETICS */

        athletics:
            "athletics",

        track:
            "athletics",

        field:
            "athletics",


        /* COMBAT */

        boxing:
            "boxing",

        mma:
            "mma",


        /* INDIVIDUAL SPORTS */

        golf:
            "golf",

        snooker:
            "snooker",

        swimming:
            "swimming"

    };


    return (
        aliases[sport] ||
        "unknown"
    );

}


/* =========================================================
   SPORT DATA ROUTER
========================================================= */

async function getSportData(
    sport,
    type
) {

    switch (sport) {

        case "wwe":
            return getWWEData(type);


        case "rally":
            return getRallyData(type);


        case "f1":
            return getF1Data(type);


        case "motogp":
            return getMotoGPData(type);


        case "tennis":
            return getTennisData(type);


        case "basketball":
            return getBasketballData(type);


        case "athletics":
            return getAthleticsData(type);


        case "rugby":
            return getRugbyData(type);


        case "boxing":
            return getBoxingData(type);


        case "mma":
            return getMMAData(type);


        case "cricket":
            return getCricketData(type);


        case "golf":
            return getGolfData(type);


        case "volleyball":
            return getVolleyballData(type);


        case "baseball":
            return getBaseballData(type);


        case "snooker":
            return getSnookerData(type);


        case "swimming":
            return getSwimmingData(type);


        default:

            return unavailableResult(
                sport
            );

    }

}


/* =========================================================
   WWE
========================================================= */

async function getWWEData(
    type
) {

    /*
     * Provider will be connected later.
     *
     * Possible data:
     * - Raw
     * - SmackDown
     * - NXT
     * - Premium Live Events
     * - Match cards
     * - Results
     * - Superstars
     * - Championships
     * - Event schedules
     */

    return unavailableResult(
        "wwe",
        "WWE provider is not configured yet."
    );

}


/* =========================================================
   SAFARI RALLY / WRC
========================================================= */

async function getRallyData(
    type
) {

    /*
     * Provider will be connected here.
     *
     * Target data:
     * - Safari Rally Kenya
     * - WRC
     * - Rally schedule
     * - Stages
     * - Stage times
     * - Overall classification
     * - Driver standings
     * - Manufacturer standings
     * - Retirements
     * - Time gaps
     * - Rally status
     */

    return unavailableResult(
        "rally",
        "WRC/Safari Rally provider is not configured yet."
    );

}


/* =========================================================
   FORMULA 1
========================================================= */

async function getF1Data(
    type
) {

    /*
     * Target data:
     * - Grand Prix
     * - Practice
     * - Qualifying
     * - Sprint
     * - Race
     * - Driver standings
     * - Constructor standings
     * - Lap information
     * - Results
     */

    return unavailableResult(
        "f1",
        "Formula 1 provider is not configured yet."
    );

}


/* =========================================================
   MOTOGP
========================================================= */

async function getMotoGPData(
    type
) {

    /*
     * Target data:
     * - MotoGP
     * - Moto2
     * - Moto3
     * - Practice
     * - Qualifying
     * - Sprint
     * - Race
     * - Rider standings
     */

    return unavailableResult(
        "motogp",
        "MotoGP provider is not configured yet."
    );

}


/* =========================================================
   TENNIS
========================================================= */

async function getTennisData(
    type
) {

    /*
     * Target data:
     * - ATP
     * - WTA
     * - Grand Slams
     * - Live matches
     * - Sets
     * - Games
     * - Results
     * - Tournament draws
     * - Rankings
     */

    return unavailableResult(
        "tennis",
        "Tennis provider is not configured yet."
    );

}


/* =========================================================
   BASKETBALL
========================================================= */

async function getBasketballData(
    type
) {

    /*
     * Target data:
     * - NBA
     * - Major leagues
     * - Live scores
     * - Quarters
     * - Team statistics
     * - Standings
     * - Results
     */

    return unavailableResult(
        "basketball",
        "Basketball provider is not configured yet."
    );

}


/* =========================================================
   ATHLETICS
========================================================= */

async function getAthleticsData(
    type
) {

    /*
     * Target data:
     * - Diamond League
     * - World Athletics events
     * - Olympic events
     * - Kenyan athletes
     * - Track results
     * - Field results
     * - Rankings
     */

    return unavailableResult(
        "athletics",
        "Athletics provider is not configured yet."
    );

}


/* =========================================================
   RUGBY
========================================================= */

async function getRugbyData(
    type
) {

    /*
     * Target data:
     * - Rugby Union
     * - Rugby Sevens
     * - International competitions
     * - Kenya Rugby
     * - Live scores
     * - Fixtures
     * - Results
     * - Standings
     */

    return unavailableResult(
        "rugby",
        "Rugby provider is not configured yet."
    );

}


/* =========================================================
   BOXING
========================================================= */

async function getBoxingData(
    type
) {

    /*
     * Target data:
     * - Fight schedules
     * - Live fights
     * - Results
     * - Weight classes
     * - Records
     * - Championships
     */

    return unavailableResult(
        "boxing",
        "Boxing provider is not configured yet."
    );

}


/* =========================================================
   MMA
========================================================= */

async function getMMAData(
    type
) {

    /*
     * Target data:
     * - UFC
     * - PFL
     * - ONE
     * - Fight cards
     * - Results
     * - Rankings
     * - Championships
     */

    return unavailableResult(
        "mma",
        "MMA provider is not configured yet."
    );

}


/* =========================================================
   CRICKET
========================================================= */

async function getCricketData(
    type
) {

    /*
     * Target data:
     * - Test
     * - ODI
     * - T20
     * - IPL
     * - International cricket
     * - Live scores
     * - Results
     * - Standings
     */

    return unavailableResult(
        "cricket",
        "Cricket provider is not configured yet."
    );

}


/* =========================================================
   GOLF
========================================================= */

async function getGolfData(
    type
) {

    /*
     * Target data:
     * - PGA Tour
     * - DP World Tour
     * - Major championships
     * - Live leaderboard
     * - Player scores
     * - Results
     */

    return unavailableResult(
        "golf",
        "Golf provider is not configured yet."
    );

}


/* =========================================================
   VOLLEYBALL
========================================================= */

async function getVolleyballData(
    type
) {

    /*
     * Target data:
     * - International volleyball
     * - Club competitions
     * - Live scores
     * - Sets
     * - Results
     * - Standings
     */

    return unavailableResult(
        "volleyball",
        "Volleyball provider is not configured yet."
    );

}


/* =========================================================
   BASEBALL
========================================================= */

async function getBaseballData(
    type
) {

    /*
     * Target data:
     * - MLB
     * - International baseball
     * - Live games
     * - Innings
     * - Results
     * - Standings
     */

    return unavailableResult(
        "baseball",
        "Baseball provider is not configured yet."
    );

}


/* =========================================================
   SNOOKER
========================================================= */

async function getSnookerData(
    type
) {

    /*
     * Target data:
     * - World Snooker Tour
     * - Tournaments
     * - Live frames
     * - Match results
     * - Draws
     * - Rankings
     */

    return unavailableResult(
        "snooker",
        "Snooker provider is not configured yet."
    );

}


/* =========================================================
   SWIMMING
========================================================= */

async function getSwimmingData(
    type
) {

    /*
     * Target data:
     * - World Aquatics
     * - Championships
     * - Olympic events
     * - Heats
     * - Finals
     * - Results
     * - Records
     */

    return unavailableResult(
        "swimming",
        "Swimming provider is not configured yet."
    );

}


/* =========================================================
   NORMALIZED UNAVAILABLE RESPONSE
========================================================= */

function unavailableResult(
    sport,
    message
) {

    return {

        success: true,

        provider:
            "KLYDE SPORTS",

        providers: [],

        events: [],

        live: false,

        dataAvailable: false,

        providerStatus:
            "NOT_CONFIGURED",

        message:
            message ||
            `${sport} provider is not configured yet.`

    };

}
