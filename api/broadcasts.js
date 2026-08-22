```javascript
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
   - ESPN/SofaScore IDs are NEVER treated as SportMonks IDs.
   - SportMonks TV stations are preferred when available.
   - KoraLive is displayed as a GUIDE, NOT as a verified broadcaster.
   - API keys remain server-side.
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
       SERVER-SIDE API KEY
    ===================================================== */

    const token =
        process.env.SPORTMONKS_API_KEY;


    /* =====================================================
       READ MATCH INFORMATION
    ===================================================== */

    const fixtureId =
        String(req.query?.fixture || "").trim();

    const provider =
        String(req.query?.provider || "")
            .trim()
            .toLowerCase();

    const home =
        String(req.query?.home || "").trim();

    const away =
        String(req.query?.away || "").trim();

    const matchDate =
        String(req.query?.date || "").trim();

    const league =
        String(req.query?.league || "").trim();

    const country =
        String(req.query?.country || "").trim();


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

           Kept locally so the broadcast engine never
           depends on an undefined variable.
        ================================================= */

        const africanCountries = [

            "angola",
            "benin",
            "botswana",
            "burkinafaso",
            "burundi",
            "cameroon",
            "capeverde",
            "centralafricanrepublic",
            "chad",
            "comoros",
            "congo",
            "congobrazzaville",
            "costadivoire",
            "cotedivoire",
            "democraticrepublicofthecongo",
            "drc",
            "djibouti",
            "egypt",
            "equatorialguinea",
            "eritrea",
            "eswatini",
            "ethiopia",
            "gabon",
            "gambia",
            "ghana",
            "guinea",
            "guineabissau",
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
            "southafrica",
            "southsudan",
            "sudan",
            "tanzania",
            "togo",
            "tunisia",
            "uganda",
            "zambia",
            "zimbabwe"

        ];


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
                    "");

        }


        /* =================================================
           TEAM NAME MATCH
        ================================================= */

        function namesMatch(first, second) {

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


            if (!newUrl && !newName) {
                return;
            }


            const exists =
                broadcasters.some(existing => {

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

                });


            if (!exists) {

                broadcasters.push(source);

            }

        }


        /* =================================================
           SPORTMONKS DIRECT FIXTURE LOOKUP

           Only:
           - SportMonks provider
           - unknown provider

           Never use ESPN/SofaScore IDs directly.
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
                    "KLYDE BROADCAST: SportMonks fixture lookup:",
                    fixtureId
                );


                const url =

                    `https://api.sportmonks.com/v3/football/fixtures/${encodeURIComponent(
                        fixtureId
                    )}` +

                    `?api_token=${encodeURIComponent(
                        token
                    )}` +

                    `&include=tvStations;league;participants`;


                const response =
                    await fetch(url, {

                        method: "GET",

                        headers: {
                            Accept:
                                "application/json"
                        }

                    });


                const data =
                    await response.json();


                if (response.ok) {

                    sportmonksFixture =
                        data?.data ||
                        null;

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

           Used when the frontend supplied an ESPN,
           SofaScore or unknown fixture ID.
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
                            .padStart(2, "0");


                    const dd =
                        String(
                            date.getUTCDate()
                        )
                            .padStart(2, "0");


                    const dateString =
                        `${yyyy}-${mm}-${dd}`;


                    const url =

                        `https://api.sportmonks.com/v3/football/fixtures/date/${dateString}` +

                        `?api_token=${encodeURIComponent(
                            token
                        )}` +

                        `&include=tvStations;league;participants`;


                    const response =
                        await fetch(url);


                    const data =
                        await response.json();


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
                                        ) ||
                                        participants[0] ||
                                        {};


                                    const fixtureAway =
                                        participants.find(
                                            team =>
                                                team?.meta?.location ===
                                                "away"
                                        ) ||
                                        participants[1] ||
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
                            ) || null;

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
           SPORTMONKS TV STATIONS
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
                                "official-broadcaster"

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

            );


        const fixtureCountry =
            String(

                fixtureLeague?.country?.name ||

                fixtureLeague?.country ||

                country ||

                ""

            );


        const matchText =

            (

                leagueName +
                " " +
                fixtureCountry +
                " " +
                home +
                " " +
                away

            )
                .toLowerCase();


        /* =================================================
           FIFA+
        ================================================= */

        const normalizedCountry =
            normalizeName(
                fixtureCountry
            );


        const fifaRelevant =

            africanCountries.some(
                name =>
                    normalizedCountry.includes(
                        normalizeName(name)
                    )
            )

            ||

            matchText.includes("fifa+")
            ||

            matchText.includes("fifaplus");


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

           IMPORTANT:
           KoraLive is ONLY presented as a broadcast guide.

           KLYDE does NOT claim that KoraLive itself
           owns or hosts the stream.
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
                "KoraLive is a football broadcast guide. Open the guide to check available broadcasters for this match. Availability varies by match and territory."

        });


        /* =================================================
           CLEAN SOURCES
        ================================================= */

        broadcasters =
            broadcasters.filter(source => {

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

            });


        /* =================================================
           SORT

           1. Verified SportMonks broadcasters
           2. Other verified official sources
           3. Broadcast guides
           4. Other sources
        ================================================= */

        broadcasters.sort(
            (a, b) => {

                function score(source) {

                    if (
                        source?.source ===
                        "SportMonks" &&
                        source?.verified === true
                    ) {

                        return 4;

                    }


                    if (
                        source?.verified === true &&
                        source?.type ===
                        "official-free-platform"
                    ) {

                        return 3;

                    }


                    if (
                        source?.type ===
                        "broadcast-guide"
                    ) {

                        return 2;

                    }


                    if (
                        source?.verified === true
                    ) {

                        return 1;

                    }


                    return 0;

                }


                return (
                    score(b) -
                    score(a)
                );

            }
        );


        /* =================================================
           LOG RESULT
        ================================================= */

        console.log(
            "KLYDE BROADCAST RESULT:",
            {
                fixtureId,
                provider,
                home,
                away,
                league: leagueName,
                country: fixtureCountry,
                sportmonksMatched:
                    Boolean(
                        sportmonksFixture
                    ),
                broadcasterCount:
                    broadcasters.length
            }
        );


        /* =================================================
           RETURN
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

            results:
                0,

            broadcasters: [],

            error:
                error?.message ||
                "Broadcast lookup failed."

        });

    }

}
```
