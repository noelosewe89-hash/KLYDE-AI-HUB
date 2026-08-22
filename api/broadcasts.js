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

   IMPORTANT:
   We NEVER assume an ESPN/SofaScore event ID
   is a SportMonks fixture ID.
========================================================= */

export default async function handler(req, res) {

    const token =
        process.env.SPORTMONKS_API_KEY;


    /* =====================================================
       READ MATCH INFORMATION
    ===================================================== */

    const fixtureId =
        req.query?.fixture || "";

    const provider =
        String(
            req.query?.provider || ""
        ).toLowerCase();

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
           ADD SOURCE WITHOUT DUPLICATES
        ================================================= */

        function addSource(source) {

            if (!source) {
                return;
            }


            const newUrl =
                String(
                    source?.url || ""
                )
                    .toLowerCase()
                    .trim();


            const newName =
                String(
                    source?.name ||
                    source?.station ||
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
                            ) ||

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
           
           Only do this when:
           - provider is SportMonks
           - OR provider is unknown
           
           This prevents ESPN IDs being treated
           as SportMonks IDs.
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

                    `https://api.sportmonks.com/v3/football/fixtures/${encodeURIComponent(
                        fixtureId
                    )}` +

                    `?api_token=${encodeURIComponent(
                        token
                    )}` +

                    `&include=tvStations;league;participants`;



                const response =
                    await fetch(url);


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
           
           Used for ESPN / SofaScore matches.
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
                        ).padStart(
                            2,
                            "0"
                        );


                    const dd =
                        String(
                            date.getUTCDate()
                        ).padStart(
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
                                        ) &&

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


        const searchableText =

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
           AFRICAN COMPETITIONS
        ================================================= */

        const africanCountries = [

            "algeria",
            "angola",
            "benin",
            "botswana",
            "burkina",
            "burundi",
            "cameroon",
            "central african",
            "comoros",
            "congo",
            "cote d'ivoire",
            "côte d'ivoire",
            "djibouti",
            "egypt",
            "equatorial guinea",
            "eswatini",
            "ethiopia",
            "gabon",
            "gambia",
            "ghana",
            "guinea",
            "guinea-bissau",
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


        const isAfrican =
            africanCountries.some(
                name =>
                    searchableText.includes(
                        name
                    )
            );


        if (isAfrican) {

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

        const isCAF =

            searchableText.includes(
                "caf"
            ) ||

            searchableText.includes(
                "africa cup"
            ) ||

            searchableText.includes(
                "champions league"
            ) ||

            searchableText.includes(
                "confederation cup"
            ) ||

            searchableText.includes(
                "u17"
            ) ||

            searchableText.includes(
                "u20"
            );


        if (isCAF) {

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
                    "CAF TV streams selected CAF matches live. Availability depends on the competition."

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
                "OneFootball offers selected Free-to-Air live matches. Availability varies by match and territory."

        });


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
