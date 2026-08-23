/* =========================================================
   KLYDE AI HUB — SPORTS EXTRA ENGINE

   PURPOSE:
   - Handles sports outside the existing football engine.
   - Keeps Sports Center independent from KLYDE AI/chat.
   - Provides one normalized response structure.
   - Designed for real-time provider integrations.
   - NEVER invents live scores, results, or events.

   SUPPORTED SPORTS:
   - WWE / Wrestling
   - Safari Rally / WRC
   - Formula 1
   - MotoGP
   - Tennis
   - Basketball
   - Athletics
   - Rugby
   - Boxing / MMA
   - Cricket
   - Golf
   - Volleyball
   - Baseball
   - Snooker
   - Swimming

   NOTE:
   Provider/API credentials remain server-side.
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
           VALIDATE SPORT
        ================================================= */

        const supportedSports = [
            "wwe",
            "wrestling",
            "rally",
            "safari-rally",
            "wrc",
            "f1",
            "formula-1",
            "motogp",
            "tennis",
            "basketball",
            "athletics",
            "rugby",
            "boxing",
            "mma",
            "cricket",
            "golf",
            "volleyball",
            "baseball",
            "snooker",
            "swimming"
        ];


        if (
            !supportedSports.includes(
                sport
            )
        ) {

            return res.status(200).json({

                success: true,

                type,

                sport:

                    sport ||
                    "unknown",

                provider:
                    "KLYDE SPORTS",

                results: 0,

                events: [],

                live: false,

                dataAvailable: false,

                message:
                    "Sport is not currently supported by KLYDE Sports."

            });

        }


        /* =================================================
           NORMALIZE SPORT NAME
        ================================================= */

        const normalizedSport =
            normalizeSportName(
                sport
            );


        /* =================================================
           PROVIDER ROUTING
        =================================================

           Each sport will eventually connect to
           its verified real-data provider here.

           We deliberately do NOT generate fake
           sporting information.
        ================================================= */

        const result =
            await getSportData(
                normalizedSport,
                type
            );


        /* =================================================
           RETURN NORMALIZED RESPONSE
        ================================================= */

        return res.status(200).json({

            success: true,

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
                Array.isArray(result.events)
                    ? result.events.length
                    : 0,

            events:
                Array.isArray(result.events)
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

            message:
                result.message ||
                "KLYDE Sports data response."

        });

    }


    /* =====================================================
       GLOBAL ERROR HANDLER
    ===================================================== */

    catch (error) {

        console.error(
            "KLYDE SPORTS EXTRA ERROR:",
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

            error:
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

        "wwe":
            "wwe",

        "wrestling":
            "wwe",

        "rally":
            "rally",

        "safari-rally":
            "rally",

        "wrc":
            "rally",

        "f1":
            "f1",

        "formula-1":
            "f1",

        "motogp":
            "motogp",

        "tennis":
            "tennis",

        "basketball":
            "basketball",

        "athletics":
            "athletics",

        "rugby":
            "rugby",

        "boxing":
            "boxing",

        "mma":
            "mma",

        "cricket":
            "cricket",

        "golf":
            "golf",

        "volleyball":
            "volleyball",

        "baseball":
            "baseball",

        "snooker":
            "snooker",

        "swimming":
            "swimming"

    };


    return (
        aliases[sport] ||
        sport ||
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

    /*
     * These functions are deliberately separated.
     *
     * We will connect each one to a verified
     * provider instead of putting all sports
     * into one giant function.
     */

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

    return unavailableResult(
        "wwe",
        "WWE live-data provider is not connected yet."
    );

}


/* =========================================================
   SAFARI RALLY / WRC
========================================================= */

async function getRallyData(
    type
) {

    return unavailableResult(
        "rally",
        "Safari Rally/WRC live-data provider is not connected yet."
    );

}


/* =========================================================
   FORMULA 1
========================================================= */

async function getF1Data(
    type
) {

    return unavailableResult(
        "f1",
        "Formula 1 live-data provider is not connected yet."
    );

}


/* =========================================================
   MOTOGP
========================================================= */

async function getMotoGPData(
    type
) {

    return unavailableResult(
        "motogp",
        "MotoGP live-data provider is not connected yet."
    );

}


/* =========================================================
   TENNIS
========================================================= */

async function getTennisData(
    type
) {

    return unavailableResult(
        "tennis",
        "Tennis live-data provider is not connected yet."
    );

}


/* =========================================================
   BASKETBALL
========================================================= */

async function getBasketballData(
    type
) {

    return unavailableResult(
        "basketball",
        "Basketball live-data provider is not connected yet."
    );

}


/* =========================================================
   ATHLETICS
========================================================= */

async function getAthleticsData(
    type
) {

    return unavailableResult(
        "athletics",
        "Athletics live-data provider is not connected yet."
    );

}


/* =========================================================
   RUGBY
========================================================= */

async function getRugbyData(
    type
) {

    return unavailableResult(
        "rugby",
        "Rugby live-data provider is not connected yet."
    );

}


/* =========================================================
   BOXING
========================================================= */

async function getBoxingData(
    type
) {

    return unavailableResult(
        "boxing",
        "Boxing live-data provider is not connected yet."
    );

}


/* =========================================================
   MMA
========================================================= */

async function getMMAData(
    type
) {

    return unavailableResult(
        "mma",
        "MMA live-data provider is not connected yet."
    );

}


/* =========================================================
   CRICKET
========================================================= */

async function getCricketData(
    type
) {

    return unavailableResult(
        "cricket",
        "Cricket live-data provider is not connected yet."
    );

}


/* =========================================================
   GOLF
========================================================= */

async function getGolfData(
    type
) {

    return unavailableResult(
        "golf",
        "Golf live-data provider is not connected yet."
    );

}


/* =========================================================
   VOLLEYBALL
========================================================= */

async function getVolleyballData(
    type
) {

    return unavailableResult(
        "volleyball",
        "Volleyball live-data provider is not connected yet."
    );

}


/* =========================================================
   BASEBALL
========================================================= */

async function getBaseballData(
    type
) {

    return unavailableResult(
        "baseball",
        "Baseball live-data provider is not connected yet."
    );

}


/* =========================================================
   SNOOKER
========================================================= */

async function getSnookerData(
    type
) {

    return unavailableResult(
        "snooker",
        "Snooker live-data provider is not connected yet."
    );

}


/* =========================================================
   SWIMMING
========================================================= */

async function getSwimmingData(
    type
) {

    return unavailableResult(
        "swimming",
        "Swimming live-data provider is not connected yet."
    );

}


/* =========================================================
   UNAVAILABLE RESPONSE
========================================================= */

function unavailableResult(
    sport,
    message
) {

    return {

        provider:
            "KLYDE SPORTS",

        providers: [],

        events: [],

        live: false,

        dataAvailable: false,

        message:
            message ||
            `${sport} data is currently unavailable.`

    };

}
