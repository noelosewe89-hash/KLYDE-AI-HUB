```javascript
/* =========================================================
   KLYDE AI HUB — SPORTS ENGINE

   LIVE PROVIDER ORDER:
   1. SportMonks
   2. API-Football
   3. SofaScore
   4. ESPN fallback

   LIVE MODE:
   - Collects matches from ALL available providers
   - Does NOT stop after the first provider
   - Removes duplicate matches
   - Keeps provider information
   - Keeps broadcaster / TV station information

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

    const type =
        req.query?.type || "live";


    /* =====================================================
       NEVER CACHE LIVE SCORES
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
           FIXTURES / RESULTS
        ================================================= */

        if (
            type === "fixtures" ||
            type === "results"
        ) {

            const apiFootballKey =
                process.env.API_FOOTBALL_KEY;


            if (!apiFootballKey) {

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


            let url;


            if (type === "fixtures") {

                url =
                    "https://v3.football.api-sports.io/fixtures?next=10";

            }

            else {

                url =
                    "https://v3.football.api-sports.io/fixtures?last=10";

            }


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
                                apiFootballKey

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
                Array.isArray(data?.response)
                    ? data.response
                    : [];


            const matches =
                normalizeApiFootballMatches(
                    sourceMatches
                );


            console.log(
                `KLYDE SPORTS: API-Football returned ${matches.length} ${type} matches.`
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


        /* =================================================
           LIVE MULTI-PROVIDER AGGREGATION
        ================================================= */

        const allLiveMatches = [];


        /* =================================================
           1. SPORTMONKS
        ================================================= */

        if (
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
                        `KLYDE SPORTS: SportMonks returned ${matches.length} live matches.`
                    );


                    allLiveMatches.push(
                        ...matches
                    );

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

        else {

            console.log(
                "KLYDE SPORTS: SPORTMONKS_API_KEY is not configured."
            );

        }


        /* =================================================
           2. API-FOOTBALL
        ================================================= */

        const apiFootballKey =
            process.env.API_FOOTBALL_KEY;


        if (apiFootballKey) {

            try {

                console.log(
                    "KLYDE SPORTS: Trying API-Football live..."
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
                                    apiFootballKey

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
                        Array.isArray(data?.response)
                            ? data.response
                            : [];


                    const matches =
                        normalizeApiFootballMatches(
                            sourceMatches
                        );


                    console.log(
                        `KLYDE SPORTS: API-Football returned ${matches.length} live matches.`
                    );


                    allLiveMatches.push(
                        ...matches
                    );

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

        else {

            console.log(
                "KLYDE SPORTS: API_FOOTBALL_KEY is not configured."
            );

        }


        /* =================================================
           3. SOFASCORE
        ================================================= */

        try {

            console.log(
                "KLYDE SPORTS: Trying SofaScore live..."
            );


            const sofaResponse =
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


            const sofaData =
                await safeJSON(
                    sofaResponse
                );


            console.log(
                "KLYDE SOFASCORE STATUS:",
                sofaResponse.status
            );


            if (sofaResponse.ok) {

                const sofaEvents =
                    Array.isArray(
                        sofaData?.events
                    )
                        ? sofaData.events
                        : [];


                console.log(
                    "KLYDE SOFASCORE RAW EVENT COUNT:",
                    sofaEvents.length
                );


                const sofaMatches =
                    normalizeSofaScoreMatches(
                        sofaEvents
                    );


                console.log(
                    `KLYDE SPORTS: SofaScore returned ${sofaMatches.length} live matches.`
                );


                allLiveMatches.push(
                    ...sofaMatches
                );

            }

            else {

                console.error(
                    "KLYDE SOFASCORE ERROR:",
                    sofaData?.message ||
                    `HTTP ${sofaResponse.status}`
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
                "KLYDE SPORTS: Trying ESPN live..."
            );


            const espnResponse =
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


            const espnData =
                await safeJSON(
                    espnResponse
                );


            console.log(
                "KLYDE ESPN STATUS:",
                espnResponse.status
            );


            if (espnResponse.ok) {

                const espnEvents =
                    Array.isArray(
                        espnData?.events
                    )
                        ? espnData.events
                        : [];


                const espnMatches =
                    normalizeESPNMatches(
                        espnEvents
                    );


                console.log(
                    `KLYDE SPORTS: ESPN returned ${espnMatches.length} live matches.`
                );


                allLiveMatches.push(
                    ...espnMatches
                );

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
           REMOVE DUPLICATES
        ================================================= */

        const uniqueMatches =
            deduplicateLiveMatches(
                allLiveMatches
            );


        console.log(
            "================================================="
        );

        console.log(
            "KLYDE SPORTS MULTI-PROVIDER SUMMARY"
        );

        console.log(
            "Raw matches:",
            allLiveMatches.length
        );

        console.log(
            "Unique matches:",
            uniqueMatches.length
        );

        console.log(
            "================================================="
        );


        /* =================================================
           RETURN ALL LIVE MATCHES
        ================================================= */

        if (
            uniqueMatches.length > 0
        ) {

            return res.status(200).json({

                success: true,

                type: "live",

                provider:
                    "Multi-provider",

                results:
                    uniqueMatches.length,

                matches:
                    uniqueMatches,

                fallback: false

            });

        }


        /* =================================================
           NO LIVE MATCHES
        ================================================= */

        return res.status(200).json({

            success: true,

            type: "live",

            provider:
                "KLYDE SPORTS",

            results: 0,

            matches: [],

            fallback: true,

            message:
                "No live matches were returned by the available live-score sources."

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
   LIVE MATCH DEDUPLICATION
========================================================= */

function deduplicateLiveMatches(
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
            match?.teams?.home?.name ||
            "";


        const away =
            match?.teams?.away?.name ||
            "";


        const league =
            match?.league?.name ||
            "";


        const date =
            match?.fixture?.date ||
            "";


        const fixtureId =
            match?.fixture?.id ||
            "";


        /*
         * Prefer provider-specific IDs.
         */

        let key = "";


        if (
            match.sportmonks?.fixture_id
        ) {

            key =
                `sportmonks:${match.sportmonks.fixture_id}`;

        }

        else if (
            match.apiFootball?.fixture_id
        ) {

            key =
                `api-football:${match.apiFootball.fixture_id}`;

        }

        else if (
            match.sofaScore?.event_id
        ) {

            key =
                `sofascore:${match.sofaScore.event_id}`;

        }

        else if (
            match.espn?.event_id
        ) {

            key =
                `espn:${match.espn.event_id}`;

        }

        else {

            /*
             * Fallback identity when a provider
             * does not expose an ID.
             */

            key =
                [
                    normalizeTeamName(home),
                    normalizeTeamName(away),
                    normalizeTeamName(league),
                    date
                        ? new Date(date)
                            .toISOString()
                            .slice(0, 13)
                        : ""
                ].join("|");

        }


        /*
         * Cross-provider duplicate detection.
         */

        const crossProviderKey =
            [
                normalizeTeamName(home),
                normalizeTeamName(away),
                normalizeTeamName(league)
            ].join("|");


        const existingIndex =
            unique.findIndex(
                existing => {

                    const existingHome =
                        normalizeTeamName(
                            existing?.teams?.home?.name || ""
                        );


                    const existingAway =
                        normalizeTeamName(
                            existing?.teams?.away?.name || ""
                        );


                    const existingLeague =
                        normalizeTeamName(
                            existing?.league?.name || ""
                        );


                    const existingCrossKey =
                        [
                            existingHome,
                            existingAway,
                            existingLeague
                        ].join("|");


                    return (
                        existingCrossKey ===
                        crossProviderKey
                    );

                }
            );


        if (
            seen.has(key)
        ) {

            continue;

        }


        if (
            existingIndex !== -1
        ) {

            /*
             * Merge useful information from
             * the newer provider into the
             * existing match.
             */

            unique[
                existingIndex
            ] =
                mergeMatchData(
                    unique[
                        existingIndex
                    ],
                    match
                );


            seen.add(key);

            continue;

        }


        seen.add(key);


        unique.push(
            match
        );

    }


    return unique;

}


/* =========================================================
   MERGE MATCH DATA
========================================================= */

function mergeMatchData(
    existing,
    incoming
) {

    if (!existing) {
        return incoming;
    }


    if (!incoming) {
        return existing;
    }


    return {

        ...existing,


        fixture: {

            ...existing.fixture,

            ...(incoming.fixture || {}),

            id:
                existing.fixture?.id ||
                incoming.fixture?.id ||
                null,

            date:
                existing.fixture?.date ||
                incoming.fixture?.date ||
                null,

            status: {

                ...existing.fixture?.status,

                ...(incoming.fixture?.status || {})

            }

        },


        league: {

            ...existing.league,

            ...(incoming.league || {})

        },


        teams: {

            ...existing.teams,

            home: {

                ...existing.teams?.home,

                ...(incoming.teams?.home || {})

            },

            away: {

                ...existing.teams?.away,

                ...(incoming.teams?.away || {})

            }

        },


        goals: {

            ...existing.goals,

            ...(incoming.goals || {})

        },


        events:

            (
                incoming.events &&
                incoming.events.length
            )
                ? incoming.events
                : existing.events || [],


        tvStations:

            mergeTVStations(
                existing.tvStations || [],
                incoming.tvStations || []
            ),


        sportmonks:
            existing.sportmonks ||
            incoming.sportmonks ||
            null,


        apiFootball:
            existing.apiFootball ||
            incoming.apiFootball ||
            null,


        sofaScore:
            existing.sofaScore ||
            incoming.sofaScore ||
            null,


        espn:
            existing.espn ||
            incoming.espn ||
            null

    };

}


/* =========================================================
   TV STATION MERGER
========================================================= */

function mergeTVStations(
    first,
    second
) {

    const stations = [];


    const source =
        [
            ...(Array.isArray(first)
                ? first
                : []),

            ...(Array.isArray(second)
                ? second
                : [])
        ];


    const seen = new Set();


    source.forEach(
        station => {

            if (!station) {
                return;
            }


            const name =
                station?.name ||
                station?.tvstation?.name ||
                station?.station ||
                "";


            const url =
                station?.url ||
                station?.tvstation?.url ||
                station?.link ||
                "";


            const key =
                `${name}|${url}`;


            if (
                seen.has(key)
            ) {

                return;

            }


            seen.add(key);


            stations.push(
                station
            );

        }
    );


    return stations;

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
        );

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
                        fixture.id || null,

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
                            home.id || null,

                        name:
                            home.name ||
                            "Home",

                        logo:
                            home.image_path ||
                            null

                    },

                    away: {

                        id:
                            away.id || null,

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
                        getScore(
                            home.id
                        ),

                    away:
                        getScore(
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

        .filter(Boolean);

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
```
