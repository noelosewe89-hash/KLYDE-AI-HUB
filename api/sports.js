/* =========================================================
   KLYDE AI HUB — SPORTS ENGINE

   LIVE PROVIDERS:
   1. SportMonks
   2. API-Football
   3. SofaScore
   4. ESPN

   LIVE MODE:
   - Queries ALL available providers
   - Combines their matches
   - Removes duplicates
   - Preserves provider information

   FIXTURES:
   - API-Football

   RESULTS:
   - API-Football

   IMPORTANT:
   - API keys stay on the server.
   - Frontend receives normalized match data.
   - Broadcaster lookup remains handled by /api/broadcasts.js.
   - LIVE responses are never cached.
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

    const type = req.query?.type || "live";
   /* =====================================================
   KLYDE EXTRA SPORTS ROUTING
   - Football remains handled by this engine.
   - Other sports are handled by /api/sports-extra.js.
===================================================== */

const sport =
    String(
        req.query?.sport || "football"
    )
        .trim()
        .toLowerCase();


const extraSports = [
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
    extraSports.includes(
        sport
    )
) {

    const baseUrl =
        `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const extraUrl =
        `${baseUrl}/api/sports-extra.js?type=${encodeURIComponent(type)}&sport=${encodeURIComponent(sport)}`;

    try {

        const extraResponse =
            await fetch(
                extraUrl,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const extraData =
            await extraResponse.json();


        return res
            .status(extraResponse.status)
            .json(extraData);

    }

    catch (error) {

        console.error(
            "KLYDE SPORTS EXTRA ROUTING ERROR:",
            error
        );


        return res.status(200).json({

            success: false,

            type,

            sport,

            provider:
                "KLYDE SPORTS",

            results: 0,

            matches: [],

            events: [],

            dataAvailable: false,

            error:
                "KLYDE Sports extra engine could not be reached."

        });

    }

}


    /* =====================================================
       NEVER CACHE LIVE SCORES
    ===================================================== */

    if (type === "live") {

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }


    try {

        /* =================================================
           FIXTURES / RESULTS
        ================================================= */

        if (
            type === "fixtures" ||
            type === "results"
        ) {

            return await handleApiFootballArchive(
                type,
                res
            );
        }


        /* =================================================
           LIVE — MULTI PROVIDER AGGREGATION
        ================================================= */

        const allMatches = [];

        const providersUsed = [];


        /* =================================================
           1. SPORTMONKS
        ================================================= */

        if (process.env.SPORTMONKS_API_KEY) {

            try {

                console.log(
                    "KLYDE SPORTS: Querying SportMonks..."
                );

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
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const data =
                    await safeJSON(response);


                console.log(
                    "KLYDE SPORTMONKS STATUS:",
                    response.status
                );


                if (response.ok) {

                    const sourceMatches =
                        Array.isArray(data?.data)
                            ? data.data
                            : [];


                    const matches =
                        normalizeSportMonksMatches(
                            sourceMatches
                        );


                    console.log(
                        `KLYDE SPORTMONKS: ${matches.length} live matches`
                    );


                    if (matches.length) {

                        allMatches.push(
                            ...matches
                        );

                        providersUsed.push(
                            "SportMonks"
                        );

                    }

                }

                else {

                    console.error(
                        "KLYDE SPORTMONKS ERROR:",
                        data?.message ||
                        `HTTP ${response.status}`
                    );

                }

            }

            catch (error) {

                console.error(
                    "KLYDE SPORTMONKS ERROR:",
                    error?.message ||
                    error
                );

            }

        }


        /* =================================================
           2. API-FOOTBALL
        ================================================= */

        if (process.env.API_FOOTBALL_KEY) {

            try {

                console.log(
                    "KLYDE SPORTS: Querying API-Football..."
                );


                const response =
                    await fetch(
                        "https://v3.football.api-sports.io/fixtures?live=all",
                        {
                            method: "GET",

                            headers: {

                                "Accept":
                                    "application/json",

                                "x-apisports-key":
                                    process.env.API_FOOTBALL_KEY

                            }
                        }
                    );


                const data =
                    await safeJSON(response);


                console.log(
                    "KLYDE API-FOOTBALL STATUS:",
                    response.status
                );


                if (response.ok) {

                    const sourceMatches =
                        Array.isArray(
                            data?.response
                        )
                            ? data.response
                            : [];


                    const matches =
                        normalizeApiFootballMatches(
                            sourceMatches
                        );


                    console.log(
                        `KLYDE API-FOOTBALL: ${matches.length} live matches`
                    );


                    if (matches.length) {

                        allMatches.push(
                            ...matches
                        );

                        providersUsed.push(
                            "API-Football"
                        );

                    }

                }

                else {

                    console.error(
                        "KLYDE API-FOOTBALL ERROR:",
                        data?.message ||
                        data?.errors?.message ||
                        `HTTP ${response.status}`
                    );

                }

            }

            catch (error) {

                console.error(
                    "KLYDE API-FOOTBALL ERROR:",
                    error?.message ||
                    error
                );

            }

        }


        /* =================================================
           3. SOFASCORE
        ================================================= */

        try {

            console.log(
                "KLYDE SPORTS: Querying SofaScore..."
            );


            const response =
                await fetch(
                    "https://www.sofascore.com/api/v1/sport/football/events/live",
                    {
                        method: "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",

                            "Referer":
                                "https://www.sofascore.com/"

                        }
                    }
                );


            const data =
                await safeJSON(response);


            console.log(
                "KLYDE SOFASCORE STATUS:",
                response.status
            );


            if (response.ok) {

                const events =
                    Array.isArray(
                        data?.events
                    )
                        ? data.events
                        : [];


                const matches =
                    normalizeSofaScoreMatches(
                        events
                    );


                console.log(
                    `KLYDE SOFASCORE: ${matches.length} live matches`
                );


                if (matches.length) {

                    allMatches.push(
                        ...matches
                    );

                    providersUsed.push(
                        "SofaScore"
                    );

                }

            }

            else {

                console.error(
                    "KLYDE SOFASCORE ERROR:",
                    data?.message ||
                    `HTTP ${response.status}`
                );

            }

        }

        catch (error) {

            console.error(
                "KLYDE SOFASCORE ERROR:",
                error?.message ||
                error
            );

        }


        /* =================================================
           4. ESPN
        ================================================= */

        try {

            console.log(
                "KLYDE SPORTS: Querying ESPN..."
            );


            const response =
                await fetch(
                    "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard",
                    {
                        method: "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            "User-Agent":
                                "Mozilla/5.0"

                        }
                    }
                );


            const data =
                await safeJSON(response);


            console.log(
                "KLYDE ESPN STATUS:",
                response.status
            );


            if (response.ok) {

                const events =
                    Array.isArray(
                        data?.events
                    )
                        ? data.events
                        : [];


                const matches =
                    normalizeESPNMatches(
                        events
                    );


                console.log(
                    `KLYDE ESPN: ${matches.length} live matches`
                );


                if (matches.length) {

                    allMatches.push(
                        ...matches
                    );

                    providersUsed.push(
                        "ESPN"
                    );

                }

            }

        }

        catch (error) {

            console.error(
                "KLYDE ESPN ERROR:",
                error?.message ||
                error
            );

        }


        /* =================================================
           DEDUPLICATE ALL PROVIDERS
        ================================================= */

        const matches =
            deduplicateMatches(
                allMatches
            );


        /* =================================================
           SORT LIVE MATCHES
        ================================================= */

        matches.sort(
            sortLiveMatches
        );


        console.log(
            "KLYDE SPORTS TOTAL RAW MATCHES:",
            allMatches.length
        );


        console.log(
            "KLYDE SPORTS TOTAL UNIQUE MATCHES:",
            matches.length
        );


        console.log(
            "KLYDE SPORTS PROVIDERS:",
            providersUsed
        );


        /* =================================================
           RETURN ALL LIVE MATCHES
        ================================================= */

        return res.status(200).json({

            success: true,

            type: "live",

            provider:
                providersUsed.join(" + ") ||
                "KLYDE SPORTS",

            providers:
                providersUsed,

            results:
                matches.length,

            matches,

            fallback:
                providersUsed.length > 1,

            message:
                matches.length
                    ? "Live matches aggregated from all available providers."
                    : "No live matches were returned by the available live-score sources."

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
   API-FOOTBALL FIXTURES / RESULTS
========================================================= */

async function handleApiFootballArchive(
    type,
    res
) {

    const apiKey =
        process.env.API_FOOTBALL_KEY;


    if (!apiKey) {

        return res.status(200).json({

            success: true,

            type,

            provider:
                "KLYDE SPORTS",

            results: 0,

            matches: [],

            fallback: false,

            message:
                "API-Football is not configured."

        });

    }


    const url =
        type === "fixtures"

            ? "https://v3.football.api-sports.io/fixtures?next=10"

            : "https://v3.football.api-sports.io/fixtures?last=10";


    console.log(
        `KLYDE SPORTS: Requesting API-Football ${type}...`
    );


    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {

                    "Accept":
                        "application/json",

                    "x-apisports-key":
                        apiKey

                }
            }
        );


    const data =
        await safeJSON(response);


    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.errors?.message ||
            `API-Football HTTP ${response.status}`
        );

    }


    const sourceMatches =
        Array.isArray(
            data?.response
        )
            ? data.response
            : [];


    const matches =
        normalizeApiFootballMatches(
            sourceMatches
        );


    return res.status(200).json({

        success: true,

        type,

        provider:
            "API-Football",

        results:
            matches.length,

        matches,

        fallback: false

    });

}


/* =========================================================
   SAFE JSON READER
========================================================= */

async function safeJSON(response) {

    const text =
        await response.text();


    if (!text) {
        return {};
    }


    try {

        return JSON.parse(text);

    }

    catch {

        return {

            message:
                text.slice(0, 500)

        };

    }

}


/* =========================================================
   MULTI-PROVIDER DEDUPLICATION
========================================================= */

function deduplicateMatches(
    matches
) {

    if (!Array.isArray(matches)) {
        return [];
    }


    const unique = [];
    const seen = new Set();


    for (const match of matches) {

        if (!match) {
            continue;
        }


        const home =
            normalizeTeamName(
                match?.teams?.home?.name
            );


        const away =
            normalizeTeamName(
                match?.teams?.away?.name
            );


        if (!home || !away) {
            continue;
        }


        /*
         * Prefer the actual fixture ID when
         * available, but do NOT rely on it
         * because different providers use
         * different IDs for the same match.
         */

        const timestamp =
            getMatchTimestamp(
                match
            );


        const minute =
            timestamp
                ? Math.floor(
                    timestamp /
                    1000 /
                    60
                )
                : "";


        const key =
            `${home}|${away}|${minute}`;


        const reverseKey =
            `${away}|${home}|${minute}`;


        if (
            seen.has(key) ||
            seen.has(reverseKey)
        ) {

            /*
             * Same match found through another
             * provider.

             * Keep the richer version.
             */

            const existingIndex =
                unique.findIndex(
                    item => {

                        const existingHome =
                            normalizeTeamName(
                                item?.teams?.home?.name
                            );

                        const existingAway =
                            normalizeTeamName(
                                item?.teams?.away?.name
                            );

                        return (
                            (
                                existingHome === home &&
                                existingAway === away
                            ) ||
                            (
                                existingHome === away &&
                                existingAway === home
                            )
                        );

                    }
                );


            if (
                existingIndex !== -1
            ) {

                unique[existingIndex] =
                    mergeMatchData(
                        unique[existingIndex],
                        match
                    );

            }


            continue;

        }


        seen.add(key);


        unique.push(match);

    }


    return unique;

}


/* =========================================================
   MERGE MATCH DATA FROM DIFFERENT PROVIDERS
========================================================= */

function mergeMatchData(
    existing,
    incoming
) {

    const merged = {

        ...existing,

        ...incoming,

        fixture: {

            ...(existing.fixture || {}),
            ...(incoming.fixture || {})

        },

        league: {

            ...(existing.league || {}),
            ...(incoming.league || {})

        },

        teams: {

            ...(existing.teams || {}),

            home: {

                ...(existing.teams?.home || {}),
                ...(incoming.teams?.home || {})

            },

            away: {

                ...(existing.teams?.away || {}),
                ...(incoming.teams?.away || {})

            }

        },

        goals: {

            ...(existing.goals || {}),
            ...(incoming.goals || {})

        }

    };


    /*
     * Preserve provider identities.
     */

    merged.providers =
        Array.from(
            new Set([
                ...(existing.providers || []),
                ...(incoming.providers || []),
                getProviderName(existing),
                getProviderName(incoming)
            ].filter(Boolean))
        );


    /*
     * Preserve broadcaster/TV information.
     */

    merged.tvStations =
        mergeArrays(
            existing.tvStations,
            incoming.tvStations
        );


    /*
     * Preserve events.

     * Avoid replacing useful events with
     * an empty provider response.
     */

    merged.events =
        (
            incoming.events?.length
                ? incoming.events
                : existing.events
        ) || [];


    return merged;

}


/* =========================================================
   PROVIDER NAME
========================================================= */

function getProviderName(
    match
) {

    if (match?.sportmonks) {
        return "SportMonks";
    }

    if (match?.apiFootball) {
        return "API-Football";
    }

    if (match?.sofaScore) {
        return "SofaScore";
    }

    if (match?.espn) {
        return "ESPN";
    }

    return "";

}


/* =========================================================
   MERGE ARRAYS
========================================================= */

function mergeArrays(
    first,
    second
) {

    const result = [];


    [
        ...(Array.isArray(first) ? first : []),
        ...(Array.isArray(second) ? second : [])
    ].forEach(item => {

        const key =
            JSON.stringify(item);


        if (
            !result.some(
                existing =>
                    JSON.stringify(existing) ===
                    key
            )
        ) {

            result.push(item);

        }

    });


    return result;

}


/* =========================================================
   TEAM NAME NORMALIZATION
========================================================= */

function normalizeTeamName(
    name
) {

    return String(
        name || ""
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        )
        .replace(
            /footballclub|fc$/,
            ""
        );

}


/* =========================================================
   MATCH TIMESTAMP
========================================================= */

function getMatchTimestamp(
    match
) {

    const date =
        match?.fixture?.date;


    if (!date) {
        return 0;
    }


    const timestamp =
        new Date(date).getTime();


    return Number.isNaN(timestamp)
        ? 0
        : timestamp;

}


/* =========================================================
   LIVE MATCH SORTING
========================================================= */

function sortLiveMatches(
    a,
    b
) {

    const aTime =
        getMatchTimestamp(a);


    const bTime =
        getMatchTimestamp(b);


    return aTime - bTime;

}


/* =========================================================
   SPORTMONKS NORMALIZER
========================================================= */

function normalizeSportMonksMatches(
    sourceMatches
) {

    if (!Array.isArray(sourceMatches)) {
        return [];
    }


    return sourceMatches
        .map(fixture => {

            if (!fixture) {
                return null;
            }


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


            const scores =
                Array.isArray(
                    fixture.scores
                )
                    ? fixture.scores
                    : [];


            function getScore(
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
                    );


                return (
                    score?.score?.goals ??
                    score?.goals ??
                    0
                );

            }


            const state =
                fixture.state || {};


            const tvStations =
                fixture.tvStations ||
                fixture.tv_stations ||
                [];


            return {

                fixture: {

                    id:
                        fixture.id ||
                        null,

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
                        fixture.league_id ||
                        null,

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
                            home.id ||
                            null,

                        name:
                            home.name ||
                            "Home",

                        logo:
                            home.image_path ||
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
                            away.image_path ||
                            null

                    }

                },


                goals: {

                    home:
                        getScore(home.id),

                    away:
                        getScore(away.id)

                },


                events:
                    Array.isArray(
                        fixture.events
                    )
                        ? fixture.events
                        : [],


                tvStations,


                providers:
                    ["SportMonks"],


                sportmonks: {

                    fixture_id:
                        fixture.id ||
                        null,

                    league_id:
                        fixture.league_id ||
                        null,

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

    if (!Array.isArray(sourceMatches)) {
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
                            status.elapsed ??
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
                    Array.isArray(
                        match.tvStations
                    )
                        ? match.tvStations
                        : [],


                providers:
                    ["API-Football"],


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


/* =========================================================
   SOFASCORE NORMALIZER
========================================================= */

function normalizeSofaScoreMatches(
    sourceMatches
) {

    if (!Array.isArray(sourceMatches)) {
        return [];
    }


    return sourceMatches
        .map(event => {

            if (!event) {
                return null;
            }


            const homeTeam =
                event.homeTeam || {};


            const awayTeam =
                event.awayTeam || {};


            const tournament =
                event.tournament || {};


            const status =
                event.status || {};


            const homeScore =
                event.homeScore || {};


            const awayScore =
                event.awayScore || {};


            return {

                fixture: {

                    id:
                        event.id ||
                        null,

                    date:
                        event.startTimestamp
                            ? new Date(
                                event.startTimestamp *
                                1000
                            ).toISOString()
                            : null,

                    status: {

                        long:
                            status.description ||
                            status.type ||
                            "LIVE",

                        short:
                            "LIVE",

                        elapsed:
                            event.clock?.current ||
                            null

                    }

                },


                league: {

                    id:
                        tournament.id ||
                        null,

                    name:
                        tournament.name ||
                        "Football",

                    country:
                        tournament.category?.name ||
                        ""

                },


                teams: {

                    home: {

                        id:
                            homeTeam.id ||
                            null,

                        name:
                            homeTeam.name ||
                            "Home",

                        logo:
                            homeTeam.id
                                ? `https://api.sofascore.com/api/v1/team/${homeTeam.id}/image`
                                : null

                    },

                    away: {

                        id:
                            awayTeam.id ||
                            null,

                        name:
                            awayTeam.name ||
                            "Away",

                        logo:
                            awayTeam.id
                                ? `https://api.sofascore.com/api/v1/team/${awayTeam.id}/image`
                                : null

                    }

                },


                goals: {

                    home:
                        homeScore.current ??
                        homeScore.normaltime ??
                        0,

                    away:
                        awayScore.current ??
                        awayScore.normaltime ??
                        0

                },


                events:
                    Array.isArray(
                        event.incidents
                    )
                        ? event.incidents
                        : [],


                tvStations: [],


                providers:
                    ["SofaScore"],


                sofaScore: {

                    event_id:
                        event.id ||
                        null,

                    tournament_id:
                        tournament.id ||
                        null,

                    start_timestamp:
                        event.startTimestamp ||
                        null

                }

            };

        })
        .filter(match => {

            if (!match) {
                return false;
            }


            return (
                match.teams.home.name !== "Home" &&
                match.teams.away.name !== "Away"
            );

        });

}


/* =========================================================
   ESPN NORMALIZER
========================================================= */

function normalizeESPNMatches(
    sourceMatches
) {

    if (!Array.isArray(sourceMatches)) {
        return [];
    }


    return sourceMatches
        .map(event => {

            if (!event) {
                return null;
            }


            const competition =
                event.competitions?.[0] ||
                {};


            const competitors =
                Array.isArray(
                    competition.competitors
                )
                    ? competition.competitors
                    : [];


            const home =
                competitors.find(
                    item =>
                        item?.homeAway ===
                        "home"
                ) ||
                {};


            const away =
                competitors.find(
                    item =>
                        item?.homeAway ===
                        "away"
                ) ||
                {};


            const status =
                competition.status ||
                event.status ||
                {};


            return {

                fixture: {

                    id:
                        event.id ||
                        null,

                    date:
                        event.date ||
                        null,

                    status: {

                        long:
                            status.type?.detail ||
                            "LIVE",

                        short:
                            "LIVE",

                        elapsed:
                            null

                    }

                },


                league: {

                    id:
                        event.league?.id ||
                        null,

                    name:
                        event.league?.name ||
                        event.season?.displayName ||
                        "Football",

                    country:
                        ""

                },


                teams: {

                    home: {

                        id:
                            home.team?.id ||
                            null,

                        name:
                            home.team?.displayName ||
                            home.team?.name ||
                            "Home",

                        logo:
                            home.team?.logo ||
                            null

                    },

                    away: {

                        id:
                            away.team?.id ||
                            null,

                        name:
                            away.team?.displayName ||
                            away.team?.name ||
                            "Away",

                        logo:
                            away.team?.logo ||
                            null

                    }

                },


                goals: {

                    home:
                        Number(
                            home.score || 0
                        ),

                    away:
                        Number(
                            away.score || 0
                        )

                },


                events: [],


                tvStations: [],


                providers:
                    ["ESPN"],


                espn: {

                    event_id:
                        event.id ||
                        null

                }

            };

        })
        .filter(match => {

            if (!match) {
                return false;
            }


            return (
                match.teams.home.name !== "Home" &&
                match.teams.away.name !== "Away"
            );

        });

}
