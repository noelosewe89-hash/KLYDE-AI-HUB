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

/* =========================================================
   SAFARI RALLY / WRC
========================================================= */

async function getRallyData(
    type
) {

    const apiKey =
        process.env.BLACKTOP_API_KEY;


    if (!apiKey) {

        return unavailableResult(
            "rally",
            "WRC API is not configured."
        );

    }


    try {

        const response =
            await fetch(
                "https://api.ocblacktop.com/v1/wrc/events",
                {
                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "x-api-key":
                            apiKey

                    }
                }
            );


        const data =
            await safeJSON(response);


        console.log(
            "KLYDE WRC STATUS:",
            response.status
        );


        if (!response.ok) {

            console.error(
                "KLYDE WRC ERROR:",
                data?.message ||
                data?.error ||
                `HTTP ${response.status}`
            );


            return unavailableResult(
                "rally",
                "WRC data provider returned an error."
            );

        }


        /*
         * The WRC API returns upcoming/current
         * event information. We preserve the
         * original provider data while also
         * creating KLYDE's normalized event format.
         */

        const sourceEvents = [
            ...(Array.isArray(data?.upcoming)
                ? data.upcoming
                : []),

            ...(Array.isArray(data?.completed)
                ? data.completed
                : []),

            ...(Array.isArray(data?.events)
                ? data.events
                : []),

            ...(Array.isArray(data?.data)
                ? data.data
                : [])
        ];


        const events =
            sourceEvents.map(
                normalizeWRCEvent
            )
            .filter(Boolean);


        /*
         * Determine whether one of the returned
         * events is currently active.
         */

        const now =
            Date.now();


        const liveEvents =
            events.filter(
                event => {

                    const start =
                        event.startTimestamp || 0;

                    const end =
                        event.endTimestamp || 0;


                    return (
                        start &&
                        end &&
                        now >= start &&
                        now <= end
                    );

                }
            );


        return {

            provider:
                "Orange Cat Blacktop WRC",

            providers: [
                "Orange Cat Blacktop WRC"
            ],

            events,

            live:
                liveEvents.length > 0,

            dataAvailable:
                events.length > 0,

            message:
                events.length
                    ? "WRC data successfully received by KLYDE Sports."
                    : "No WRC events were returned."

        };

    }

    catch (error) {

        console.error(
            "KLYDE WRC ERROR:",
            error?.message ||
            error
        );


        return unavailableResult(
            "rally",
            "KLYDE could not reach the WRC data provider."
        );

    }

}


/* =========================================================
   WRC EVENT NORMALIZER
========================================================= */

function normalizeWRCEvent(
    event
) {

    if (!event) {
        return null;
    }


    const startTimestamp =
        event.dateStart
            ? new Date(
                event.dateStart
            ).getTime()
            : 0;


    const endTimestamp =
        event.dateEnd
            ? new Date(
                event.dateEnd
            )
            .setHours(
                23,
                59,
                59,
                999
            )
            : 0;


    const country =
        event.location?.country || {};


    return {

        id:
            event.id ||
            null,

        sport:
            "rally",

        category:
            "WRC",

        name:
            event.name ||
            "WRC Rally",

        round:
            event.round ??
            null,

        status:
            getRallyStatus(
                startTimestamp,
                endTimestamp
            ),

        startDate:
            event.dateStart ||
            null,

        endDate:
            event.dateEnd ||
            null,

        startTimestamp,

        endTimestamp,

        location: {

            name:
                event.location?.name ||
                "",

            country:
                country.name ||
                "",

            countryCode:
                country.threeCode ||
                country.twoCode ||
                ""

        },

        liveTiming:
            false,

        liveTimingAvailable:
            false,

        provider:
            "Orange Cat Blacktop WRC",

        providerEventId:
            event.id ||
            null,

        source:
            event

    };

}


/* =========================================================
   WRC EVENT STATUS
========================================================= */

function getRallyStatus(
    startTimestamp,
    endTimestamp
) {

    const now =
        Date.now();


    if (
        startTimestamp &&
        endTimestamp &&
        now >= startTimestamp &&
        now <= endTimestamp
    ) {

        return "LIVE";

    }


    if (
        startTimestamp &&
        now < startTimestamp
    ) {

        return "UPCOMING";

    }


    if (
        endTimestamp &&
        now > endTimestamp
    ) {

        return "COMPLETED";

    }


    return "UNKNOWN";

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
