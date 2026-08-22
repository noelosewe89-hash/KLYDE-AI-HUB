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
   - SportMonks TV stations are only shown when actually returned.
   - Guide sources are clearly marked as guides.
   - No broadcaster is falsely guaranteed to carry a match.
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
        ).toLowerCase()
        .trim();

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

           Defined locally so the function can never crash
           because of an undefined africanCountries variable.
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
            "democratic republic of the congo",
            "dr congo",
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
            "guinea-bissau",
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

           ONLY:
           - provider = SportMonks
           - OR provider is unknown

           This prevents ESPN/SofaScore IDs from being
           incorrectly sent to SportMonks.
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

               const url =
    "https://api.sportmonks.com/v3/football/fixtures/" +
    encodeURIComponent(fixtureId) +
    "?api_token=" +
    encodeURIComponent(token) +
    "&include=tvStations;league;participants";

                const response =
                    await fetch(url);


                const data =
                    await safeJSON(
                        response
                    );


                if (response.ok) {

                    sportmonksFixture =
                        data?.data ||
                        null;

                }

                else {

                    console.error(

                        "KLYDE SPORTMONKS DIRECT LOOKUP STATUS:",

                        response.status,

                        data?.message ||
                        data?.errors ||
                        ""

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

           Used when the fixture came from ESPN/SofaScore.
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


                    const url =

                        `https://api.sportmonks.com/v3/football/fixtures/date/${dateString}` +

                        `?api_token=${encodeURIComponent(
                            token
                        )}` +

                        `&include=tvStations;league;participants`;


                    const response =
                        await fetch(url);


                    const data =
                        await safeJSON(
                            response
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
                                true

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


        const leagueLower =
            leagueName.toLowerCase();


        const countryLower =
            fixtureCountry.toLowerCase();


        const matchText =

            (

                leagueLower +
                " " +
                countryLower +
                " " +
                home.toLowerCase() +
                " " +
                away.toLowerCase()

            );


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
                    "CAF TV provides selected official CAF live coverage. Availability depends on competition and territory."

            });

        }


        /* =================================================
           ONEFOOTBALL

           Added once only.
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
                "OneFootball provides selected live football coverage. Availability varies by match and territory."

        });


        /* =================================================
           KORALIVE BROADCAST GUIDE

           NOT a verified broadcaster.
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
                "KoraLive is a football broadcast guide. It does not mean KoraLive itself hosts the stream."

        });


        /* =================================================
           FINAL CLEANUP
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
                        )
                            .trim();


                    const url =
                        String(
                            source?.url ||
                            source?.link ||
                            source?.tvstation?.url ||
                            ""
                        )
                            .trim();


                    return (

                        Boolean(name) ||
                        Boolean(url)

                    );

                }
            );


        /* =================================================
           SORT SOURCES

           1. SportMonks verified stations
           2. Other verified official sources
           3. Broadcast guides
           4. Other sources
        ================================================= */

        broadcasters.sort(
            (a, b) => {

                function score(source) {

                    if (
                        source?.source ===
                        "SportMonks"
                    ) {

                        return 4;

                    }


                    if (
                        source?.verified &&
                        source?.type ===
                        "official-free-platform"
                    ) {

                        return 3;

                    }


                    if (
                        source?.type ===
                        "broadcast-guide"
                    ) {

                        return 1;

                    }


                    if (
                        source?.verified
                    ) {

                        return 2;

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
           RETURN SUCCESS
        ================================================= */

        return res.status(200).json({

            success:
                true,

            fixture:
                fixtureId || null,

            provider:
                provider ||
                "unknown",

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

            error?.message ||
            error

        );


        /*
         * IMPORTANT:
         * Return JSON even when something unexpected
         * happens. This prevents the frontend from
         * receiving an HTML FUNCTION_INVOCATION_FAILED
         * response.
         */

        return res.status(200).json({

            success:
                false,

            fixture:
                fixtureId || null,

            provider:
                provider ||
                "unknown",

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
