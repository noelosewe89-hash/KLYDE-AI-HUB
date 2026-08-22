/* =========================================================
   KLYDE AI HUB — BROADCAST SOURCE ENGINE

   Supports:
   - SportMonks fixture IDs
   - ESPN fixture IDs
   - SofaScore fixture IDs
   - Team-name/date matching
   - SportMonks TV stations
   - FIFA+
   - CAF TV
   - OneFootball
   - KoraLive broadcast guide

   IMPORTANT:
   - We NEVER assume an ESPN/SofaScore event ID
     is a SportMonks fixture ID.
   - SportMonks IDs are only sent to SportMonks when
     provider is SportMonks or provider is unknown.
   - KoraLive is displayed only as a broadcast GUIDE.
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
       ENVIRONMENT
    ===================================================== */

    const token =
        process.env.SPORTMONKS_API_KEY;


    /* =====================================================
       READ MATCH INFORMATION
    ===================================================== */

    const fixtureId =
        String(
            req.query?.fixture || ""
        ).trim();


    const provider =
        String(
            req.query?.provider || ""
        ).trim().toLowerCase();


    const home =
        String(
            req.query?.home || ""
        ).trim();


    const away =
        String(
            req.query?.away || ""
        ).trim();


    const matchDate =
        String(
            req.query?.date || ""
        ).trim();


    const league =
        String(
            req.query?.league || ""
        ).trim();


    const country =
        String(
            req.query?.country || ""
        ).trim();


    if (!fixtureId && !home && !away) {

        return res.status(400).json({

            success: false,

            error:
                "Match information is required."

        });

    }


    try {

        let broadcasters = [];

        let sportmonksFixture = null;


        /* =================================================
           AFRICAN COUNTRIES
        ================================================= */

        const africanCountries = [

            "algeria",
            "angola",
            "benin",
            "botswana",
            "burkina faso",
            "burundi",
            "cameroon",
            "cape verde",
            "central african republic",
            "chad",
            "comoros",
            "congo",
            "democratic republic of congo",
            "drc",
            "djibouti",
            "egypt",
            "equatorial guinea",
            "eritrea",
            "eswatini",
            "ethiopia",
            "gabon",
            "gambia",
            "ghana",
            "guinea",
            "guinea bissau",
            "ivory coast",
            "cote d'ivoire",
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
            "sao tome",
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


        /* =================================================
           SAFE JSON READER
        ================================================= */

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


        /* =================================================
           NORMALIZE TEAM NAMES
        ================================================= */

        function normalizeName(value) {

            return String(value || "")

                .toLowerCase()

                .normalize("NFD")

                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )

                .replace(
                    /[^a-z0-9]/g,
                    ""
                );

        }


        /* =================================================
           TEAM NAME MATCH
        ================================================= */

        function namesMatch(
            first,
            second
        ) {

            const a =
                normalizeName(first);


            const b =
                normalizeName(second);


            if (!a || !b) {

                return false;

            }


            if (a === b) {

                return true;

            }


            return (
                a.includes(b) ||
                b.includes(a)
            );

        }


        /* =================================================
           ADD SOURCE WITHOUT DUPLICATES
        ================================================= */

        function addSource(source) {

            if (!source) {

                return;

            }


            const newUrl =
                String(
                    source?.url ||
                    source?.link ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            const newName =
                String(
                    source?.name ||
                    source?.station ||
                    source?.tvstation?.name ||
                    ""
                )
                    .toLowerCase()
                    .trim();


            const exists =
                broadcasters.some(
                    existing => {

                        const oldUrl =
                            String(
                                existing?.url ||
                                existing?.link ||
                                existing?.tvstation?.url ||
                                ""
                            )
                                .toLowerCase()
                                .trim();


                        const oldName =
                            String(
                                existing?.name ||
                                existing?.station ||
                                existing?.tvstation?.name ||
                                ""
                            )
                                .toLowerCase()
                                .trim();


                        return (

                            (
                                newUrl &&
                                oldUrl &&
                                newUrl === oldUrl
                            )

                            ||

                            (
                                newName &&
                                oldName &&
                                newName === oldName
                            )

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
           SPORTMONKS DIRECT FIXTURE LOOKUP

           IMPORTANT:

           Only perform direct ID lookup when:

           - provider is SportMonks
           - OR provider is unknown

           ESPN and SofaScore IDs are NOT sent directly
           to SportMonks.
        ================================================= */

        if (

            token &&

            (
                !provider ||
                provider === "sportmonks"
            ) &&

            fixtureId

        ) {

            try {

                console.log(
                    "KLYDE BROADCAST: SportMonks direct fixture lookup..."
                );


                const url =
                    "https://api.sportmonks.com/v3/football/fixtures/" +
                    encodeURIComponent(fixtureId) +
                    "?api_token=" +
                    encodeURIComponent(token) +
                    "&include=tvStations;league;participants";


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
                    await safeJSON(
                        response
                    );


                console.log(
                    "KLYDE BROADCAST SPORTMONKS STATUS:",
                    response.status
                );


                if (response.ok) {

                    sportmonksFixture =
                        data?.data ||
                        null;

                }

                else {

                    console.error(
                        "KLYDE SPORTMONKS DIRECT LOOKUP ERROR:",
                        data?.message ||
                        `HTTP ${response.status}`
                    );

                }

            }

            catch (error) {

                console.error(
                    "KLYDE SPORTMONKS DIRECT LOOKUP ERROR:",
                    error?.message ||
                    error
                );

            }

        }


        /* =================================================
           SPORTMONKS DATE + TEAM MATCHING

           Used when the match came from:

           - ESPN
           - SofaScore
           - another provider

           We match the teams and date instead of assuming
           the external fixture ID belongs to SportMonks.
        ================================================= */

        if (

            token &&

            !sportmonksFixture &&

            home &&

            away &&

            matchDate

        ) {

            try {

                const date =
                    new Date(matchDate);


                if (
                    !Number.isNaN(
                        date.getTime()
                    )
                ) {

                    const yyyy =
                        date.getUTCFullYear();


                    const mm =
                        String(
                            date.getUTCMonth() + 1
                        )
                            .padStart(
                                2,
                                "0"
                            );


                    const dd =
                        String(
                            date.getUTCDate()
                        )
                            .padStart(
                                2,
                                "0"
                            );


                    const dateString =
                        `${yyyy}-${mm}-${dd}`;


                    console.log(
                        "KLYDE BROADCAST: SportMonks team/date matching:",
                        home,
                        "vs",
                        away,
                        dateString
                    );


                    const url =
                        "https://api.sportmonks.com/v3/football/fixtures/date/" +
                        dateString +
                        "?api_token=" +
                        encodeURIComponent(token) +
                        "&include=tvStations;league;participants";


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
                        await safeJSON(
                            response
                        );


                    console.log(
                        "KLYDE SPORTMONKS TEAM MATCH STATUS:",
                        response.status
                    );


                    if (response.ok) {

                        const fixtures =
                            Array.isArray(
                                data?.data
                            )
                                ? data.data
                                : [];


                        sportmonksFixture =
                            fixtures.find(
                                fixture => {

                                    const participants =
                                        Array.isArray(
                                            fixture?.participants
                                        )
                                            ? fixture.participants
                                            : [];


                                    const fixtureHome =
                                        participants.find(
                                            team =>
                                                team?.meta?.location ===
                                                "home"
                                        )

                                        ||

                                        participants[0]

                                        ||

                                        {};


                                    const fixtureAway =
                                        participants.find(
                                            team =>
                                                team?.meta?.location ===
                                                "away"
                                        )

                                        ||

                                        participants[1]

                                        ||

                                        {};


                                    return (

                                        namesMatch(
                                            fixtureHome?.name,
                                            home
                                        )

                                        &&

                                        namesMatch(
                                            fixtureAway?.name,
                                            away
                                        )

                                    );

                                }
                            )

                            ||

                            null;

                    }

                    else {

                        console.error(
                            "KLYDE SPORTMONKS TEAM MATCH ERROR:",
                            data?.message ||
                            `HTTP ${response.status}`
                        );

                    }

                }

            }

            catch (error) {

                console.error(
                    "KLYDE SPORTMONKS TEAM MATCH ERROR:",
                    error?.message ||
                    error
                );

            }

        }


        /* =================================================
           READ SPORTMONKS TV STATIONS
        ================================================= */

        if (sportmonksFixture) {

            const stations =
                sportmonksFixture?.tvStations ||

                sportmonksFixture?.tv_stations ||

                [];


            if (Array.isArray(stations)) {

                stations.forEach(
                    station => {

                        const tvstation =
                            station?.tvstation ||
                            {};


                        addSource({

                            ...station,

                            name:
                                tvstation.name ||
                                station?.name ||
                                station?.station ||
                                "Official Broadcaster",

                            url:
                                tvstation.url ||
                                station?.url ||
                                station?.link ||
                                "",

                            source:
                                "SportMonks",

                            verified:
                                true,

                            type:
                                "broadcast-station"

                        });

                    }
                );

            }

        }


        /* =================================================
           DETERMINE LEAGUE / COUNTRY
        ================================================= */

        const fixtureLeague =
            sportmonksFixture?.league ||
            {};


        const leagueName =
            String(

                fixtureLeague?.name ||

                league ||

                ""

            ).trim();


        const fixtureCountry =
            String(

                fixtureLeague?.country?.name ||

                fixtureLeague?.country ||

                country ||

                ""

            ).trim();


        /* =================================================
           SEARCHABLE MATCH TEXT
        ================================================= */

        const matchText = (

            leagueName +
            " " +
            fixtureCountry +
            " " +
            home +
            " " +
            away

        )
            .toLowerCase();


        const leagueLower =
            leagueName.toLowerCase();


        const countryLower =
            fixtureCountry.toLowerCase();


        /* =================================================
           FIFA+
        ================================================= */

        const fifaRelevant =

            africanCountries.some(
                name =>
                    matchText.includes(
                        name
                    )
            )

            ||

            matchText.includes(
                "fifa"
            );


        if (fifaRelevant) {

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
        ================================================= */

        const cafRelevant =

            matchText.includes(
                "caf"
            )

            ||

            matchText.includes(
                "africa cup"
            )

            ||

            matchText.includes(
                "african cup"
            )

            ||

            matchText.includes(
                "caf champions"
            )

            ||

            matchText.includes(
                "caf confederation"
            )

            ||

            matchText.includes(
                "caf super cup"
            )

            ||

            matchText.includes(
                "caf u17"
            )

            ||

            matchText.includes(
                "caf u20"
            );


        if (cafRelevant) {

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
                    "CAF TV provides selected official CAF live coverage. Availability depends on the competition and territory."

            });

        }


        /* =================================================
           ONEFOOTBALL
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
                "OneFootball offers selected live football coverage. Availability varies by match and territory."

        });


        /* =================================================
           KORALIVE

           KoraLive is a broadcast GUIDE.

           We do NOT claim that KoraLive hosts the stream.
        ================================================= */

        addSource({

            name:
                "KoraLive",

            station:
                "KoraLive",

            url:
                "https://koralive.video/en/broadcasters/",

            source:
                "KoraLive",

            verified:
                false,

            free:
                true,

            type:
                "broadcast-guide",

            note:
                "KoraLive is a football broadcast guide. Availability and broadcaster information may vary by match and territory."

        });


        /* =================================================
           FINAL BROADCAST SOURCE CLEANUP
        ================================================= */

        broadcasters =
            broadcasters.filter(
                source => {

                    if (!source) {

                        return false;

                    }


                    const name =
                        String(
                            source?.name ||
                            source?.station ||
                            source?.tvstation?.name ||
                            ""
                        ).trim();


                    const url =
                        String(
                            source?.url ||
                            source?.link ||
                            source?.tvstation?.url ||
                            ""
                        ).trim();


                    return (
                        Boolean(name) ||
                        Boolean(url)
                    );

                }
            );


        /* =================================================
           SORT SOURCES

           Priority:

           1. SportMonks verified stations
           2. Other verified official sources
           3. Broadcast guides / other sources
        ================================================= */

        broadcasters.sort(
            (a, b) => {

                const aScore =

                    a?.source === "SportMonks"

                        ? 3

                        : a?.verified

                            ? 2

                            : 1;


                const bScore =

                    b?.source === "SportMonks"

                        ? 3

                        : b?.verified

                            ? 2

                            : 1;


                return (
                    bScore -
                    aScore
                );

            }
        );


        /* =================================================
           RETURN RESULTS
        ================================================= */

        return res.status(200).json({

            success:
                true,

            fixture:
                fixtureId || null,

            provider:
                provider || "unknown",

            match: {

                home:
                    home || null,

                away:
                    away || null,

                date:
                    matchDate || null,

                league:
                    leagueName || null,

                country:
                    fixtureCountry || null

            },

            sportmonks_matched:
                Boolean(
                    sportmonksFixture
                ),

            results:
                broadcasters.length,

            broadcasters

        });

    }


    /* =====================================================
       GLOBAL ERROR HANDLER
    ===================================================== */

    catch (error) {

        console.error(
            "KLYDE BROADCAST ERROR:",
            error
        );


        return res.status(200).json({

            success:
                false,

            fixture:
                fixtureId || null,

            provider:
                provider || "unknown",

            results:
                0,

            broadcasters:
                [],

            error:
                error?.message ||
                "Broadcast lookup failed."

        });

    }

}
