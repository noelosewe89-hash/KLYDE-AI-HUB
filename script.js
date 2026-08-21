/* =====================================================
   KLYDE AI HUB — MAIN SCRIPT
   AI + MEMORY + THINKING + COPY
   SPORTS + BROADCASTERS + EDUCATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       BASIC ELEMENTS
    ================================================= */

    const searchForm =
        document.getElementById("searchForm");

    const searchInput =
        document.getElementById("searchInput");

    const result =
        document.getElementById("result");

    const quickPrompts =
        document.querySelectorAll(
            ".quick-prompts button"
        );

    const sportsSection =
        document.getElementById("sports");


    /* =================================================
       AI MEMORY
    ================================================= */

    let conversation = [];


    /* =================================================
       ESCAPE HTML
    ================================================= */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =================================================
       TIME FORMAT
    ================================================= */

    function formatTime(dateString) {

        if (!dateString) {
            return "";
        }

        const date =
            new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    /* =================================================
       BUILD AI MEMORY PROMPT
    ================================================= */

    function buildConversationPrompt() {

        const history =
            conversation
                .map(item => {

                    return `${
                        item.role === "user"
                            ? "USER"
                            : "KLYDE AI"
                    }: ${item.message}`;

                })
                .join("\n");

        return `
You are KLYDE AI, the intelligent assistant
inside KLYDE AI HUB.

Be intelligent, helpful, clear, natural,
confident and practical.

Remember the conversation history below.
Use previous messages when answering
follow-up questions.

Do not pretend to remember information
that is not contained in the conversation.

CONVERSATION HISTORY:

${history}

END CONVERSATION HISTORY.

Answer the user's latest message naturally.
`;
    }


    /* =================================================
       THINKING ANIMATION
    ================================================= */

    function thinkingHTML() {

        return `

            <div class="klyde-welcome">

                <div class="welcome-icon">
                    K
                </div>

                <div>

                    <strong>
                        KLYDE AI
                    </strong>

                    <p>

                        KLYDE is thinking

                        <span class="thinking-dots">

                            <span>.</span>
                            <span>.</span>
                            <span>.</span>

                        </span>

                    </p>

                </div>

            </div>

        `;

    }


    /* =================================================
       DISPLAY AI RESPONSE
    ================================================= */

    function displayAIResponse(answer) {

        result.innerHTML = `

            <div class="klyde-welcome">

                <div class="welcome-icon">
                    K
                </div>

                <div>

                    <strong>
                        KLYDE AI
                    </strong>

                    <p style="white-space:pre-wrap;">
                        ${escapeHTML(answer)}
                    </p>

                    <button
                        type="button"
                        class="klyde-copy-response"
                    >
                        📋 Copy
                    </button>

                </div>

            </div>

        `;


        const copyButton =
            result.querySelector(
                ".klyde-copy-response"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(answer);

                        copyButton.textContent =
                            "Copied ✓";


                        setTimeout(
                            () => {

                                copyButton.textContent =
                                    "📋 Copy";

                            },
                            1500
                        );

                    }

                    catch (error) {

                        console.error(
                            "COPY ERROR:",
                            error
                        );

                        copyButton.textContent =
                            "Copy unavailable";

                    }

                }
            );

        }

    }


    /* =================================================
       AI CHAT
    ================================================= */

    async function askKlyde(question) {

        if (!question) {
            return;
        }


        /* ---------------------------------------------
           SHOW THINKING
        --------------------------------------------- */

        result.innerHTML =
            thinkingHTML();


        /* ---------------------------------------------
           SAVE USER MESSAGE
        --------------------------------------------- */

        conversation.push({

            role: "user",

            message: question

        });


        try {

            /* -----------------------------------------
               SEND MEMORY TO BACKEND
            ----------------------------------------- */

            const response =
                await fetch(
                    "/api/chat",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            message:
                                buildConversationPrompt()

                        })

                    }
                );


            /* -----------------------------------------
               READ RESPONSE SAFELY
            ----------------------------------------- */

            let data = {};

            try {

                data =
                    await response.json();

            }

            catch {

                throw new Error(
                    "KLYDE received an invalid response from the AI server."
                );

            }


            /* -----------------------------------------
               API ERROR
            ----------------------------------------- */

            if (!response.ok) {

                throw new Error(

                    data?.error ||

                    data?.message ||

                    "KLYDE AI request failed."

                );

            }


            /* -----------------------------------------
               GET AI ANSWER
            ----------------------------------------- */

            const answer =

                data?.reply ||

                data?.answer ||

                data?.message ||

                data?.response ||

                "KLYDE could not generate a response.";


            /* -----------------------------------------
               SAVE AI RESPONSE TO MEMORY
            ----------------------------------------- */

            conversation.push({

                role: "assistant",

                message: answer

            });


            /* -----------------------------------------
               DISPLAY ANSWER
            ----------------------------------------- */

            displayAIResponse(
                answer
            );


            /* -----------------------------------------
               CLEAR INPUT
            ----------------------------------------- */

            if (searchInput) {

                searchInput.value = "";

            }

        }

        catch (error) {

            console.error(
                "KLYDE AI ERROR:",
                error
            );


            /* -----------------------------------------
               REMOVE FAILED USER MESSAGE
            ----------------------------------------- */

            conversation.pop();


            result.innerHTML = `

                <div class="klyde-welcome">

                    <div class="welcome-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            KLYDE AI
                        </strong>

                        <p>
                            ${escapeHTML(
                                error.message
                            )}
                        </p>

                    </div>

                </div>

            `;

        }

    }


    /* =================================================
       AI FORM
    ================================================= */

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const question =
                    searchInput
                        ? searchInput.value.trim()
                        : "";

                if (!question) {
                    return;
                }

                askKlyde(question);

            }
        );

    }


    /* =================================================
       QUICK PROMPTS
    ================================================= */

    quickPrompts.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const prompt =

                        button.dataset.tool ||

                        button.textContent.trim();


                    if (!prompt) {
                        return;
                    }


                    if (searchInput) {

                        searchInput.value =
                            prompt;

                        searchInput.focus();

                    }


                    askKlyde(prompt);

                }
            );

        }
    );


    /* =================================================
       SPORTS INITIALIZATION
    ================================================= */

    if (sportsSection) {

        createSportsInterface();

    }


    /* =================================================
       SPORTS INTERFACE
    ================================================= */

    function createSportsInterface() {

        const container =
            sportsSection.querySelector(
                ".sports-container"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div
                class="klyde-sports-main"
                style="width:100%;"
            >

                <div>

                    <span class="live">
                        ● LIVE SPORTS
                    </span>

                    <h3>
                        The game never stops.
                    </h3>

                    <p>
                        Live football scores,
                        fixtures, results and
                        verified broadcaster
                        information.
                    </p>

                </div>


                <div
                    class="klyde-sports-controls"
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                        margin:20px 0;
                    "
                >

                    <button
                        type="button"
                        class="button"
                        data-sports-type="live"
                    >
                        🔴 LIVE
                    </button>


                    <button
                        type="button"
                        class="button outline"
                        data-sports-type="fixtures"
                    >
                        📅 FIXTURES
                    </button>


                    <button
                        type="button"
                        class="button outline"
                        data-sports-type="results"
                    >
                        🏆 RESULTS
                    </button>

                </div>


                <div
                    id="klydeSportsStatus"
                    style="margin:10px 0;"
                >
                    Loading live matches...
                </div>


                <div
                    id="klydeSportsMatches"
                    class="cards"
                    style="margin-top:20px;"
                ></div>

            </div>

        `;


        const controls =
            sportsSection.querySelectorAll(
                "[data-sports-type]"
            );


        controls.forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        loadSports(
                            button.dataset
                                .sportsType
                        );

                    }
                );

            }
        );


        loadSports("live");

    }


    /* =================================================
       LOAD SPORTS
    ================================================= */

    async function loadSports(type) {

        const matchesContainer =
            document.getElementById(
                "klydeSportsMatches"
            );

        const status =
            document.getElementById(
                "klydeSportsStatus"
            );


        if (!matchesContainer) {
            return;
        }


        status.textContent =

            type === "live"

                ? "Loading live matches..."

                : "Loading matches...";


        matchesContainer.innerHTML = `

            <div class="card">

                <strong>
                    KLYDE SPORTS
                </strong>

                <p>
                    Getting the latest
                    football data...
                </p>

            </div>

        `;


        try {

            const response =
                await fetch(
                    `/api/sports?type=${encodeURIComponent(
                        type
                    )}`
                );


            let data = {};

            try {

                data =
                    await response.json();

            }

            catch {

                throw new Error(
                    "Sports server returned an invalid response."
                );

            }


            if (!response.ok) {

                throw new Error(

                    data?.error ||

                    "Sports API request failed."

                );

            }


            const matches =
                data?.matches || [];


            status.innerHTML = `

                <strong>

                    ${
                        type === "live"

                            ? "🔴 LIVE NOW"

                            : type === "fixtures"

                                ? "📅 UPCOMING FIXTURES"

                                : "🏆 RECENT RESULTS"

                    }

                </strong>

                <span style="opacity:.7;">

                    —
                    ${matches.length}
                    matches

                </span>

            `;


            renderSportsMatches(

                matches,

                type,

                matchesContainer

            );

        }

        catch (error) {

            console.error(
                "KLYDE SPORTS ERROR:",
                error
            );


            status.textContent =
                "Sports error";


            matchesContainer.innerHTML = `

                <div class="card">

                    <strong>
                        ⚠️ SPORTS ERROR
                    </strong>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }


    /* =================================================
       RENDER SPORTS MATCHES
    ================================================= */

    function renderSportsMatches(
        matches,
        type,
        container
    ) {

        if (!matches.length) {

            container.innerHTML = `

                <div class="card">

                    <strong>

                        ${
                            type === "live"

                                ? "🔴 NO LIVE MATCHES"

                                : "⚽ NO MATCHES FOUND"

                        }

                    </strong>

                    <p>
                        There are currently
                        no matches available.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =

            matches.map(
                match => {

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


                    const isLive =
                        type === "live";


                    return `

                        <div
                            class="card klyde-match-card"
                            style="
                                margin-bottom:15px;
                            "
                        >

                            <span
                                class="${
                                    isLive
                                        ? "live"
                                        : "label"
                                }"
                            >

                                ${
                                    isLive

                                        ? `● LIVE ${
                                            status.elapsed
                                                ? status.elapsed + "'"
                                                : ""
                                          }`

                                        : escapeHTML(
                                            status.long ||
                                            "MATCH"
                                          )

                                }

                            </span>


                            <small>

                                ${escapeHTML(
                                    league.name ||
                                    "Football"
                                )}

                                ${
                                    league.country

                                        ? " · " +
                                          escapeHTML(
                                            league.country
                                          )

                                        : ""
                                }

                            </small>


                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    justify-content:space-between;
                                    gap:15px;
                                    margin-top:15px;
                                "
                            >

                                <div
                                    style="
                                        flex:1;
                                        text-align:center;
                                    "
                                >

                                    ${
                                        home.logo

                                            ? `
                                                <img
                                                    src="${escapeHTML(
                                                        home.logo
                                                    )}"
                                                    alt=""
                                                    style="
                                                        width:45px;
                                                        height:45px;
                                                        object-fit:contain;
                                                    "
                                                >
                                              `

                                            : ""
                                    }


                                    <strong>

                                        ${escapeHTML(
                                            home.name ||
                                            "Home"
                                        )}

                                    </strong>

                                </div>


                                <div
                                    style="
                                        min-width:80px;
                                        text-align:center;
                                    "
                                >

                                    <strong
                                        style="
                                            display:block;
                                            font-size:25px;
                                        "
                                    >

                                        ${
                                            goals.home ??
                                            0
                                        }

                                        -

                                        ${
                                            goals.away ??
                                            0
                                        }

                                    </strong>


                                    <small>

                                        ${
                                            isLive

                                                ? escapeHTML(
                                                    status.long ||
                                                    ""
                                                  )

                                                : formatTime(
                                                    fixture.date
                                                  )
                                        }

                                    </small>

                                </div>


                                <div
                                    style="
                                        flex:1;
                                        text-align:center;
                                    "
                                >

                                    ${
                                        away.logo

                                            ? `
                                                <img
                                                    src="${escapeHTML(
                                                        away.logo
                                                    )}"
                                                    alt=""
                                                    style="
                                                        width:45px;
                                                        height:45px;
                                                        object-fit:contain;
                                                    "
                                                >
                                              `

                                            : ""
                                    }


                                    <strong>

                                        ${escapeHTML(
                                            away.name ||
                                            "Away"
                                        )}

                                    </strong>

                                </div>

                            </div>


                            ${
                                match.events &&
                                match.events.length

                                    ? `

                                        <div
                                            style="
                                                margin-top:15px;
                                                font-size:13px;
                                                opacity:.8;
                                            "
                                        >

                                            ${match.events
                                                .slice(-3)
                                                .map(
                                                    event => `

                                                        <div>

                                                            ⚽

                                                            ${
                                                                event.time?.elapsed ||
                                                                ""
                                                            }'

                                                            —

                                                            ${escapeHTML(
                                                                event.player?.name ||
                                                                "Goal"
                                                            )}

                                                        </div>

                                                    `
                                                )
                                                .join("")
                                            }

                                        </div>

                                      `

                                    : ""
                            }


                            ${
                                isLive

                                    ? `

                                        <button
                                            type="button"
                                            class="button klyde-watch-live"
                                            data-fixture-id="${escapeHTML(
                                                fixture.id
                                            )}"
                                            style="
                                                width:100%;
                                                margin-top:18px;
                                            "
                                        >

                                            📺 WATCH LIVE

                                        </button>

                                      `

                                    : ""
                            }

                        </div>

                    `;

                }
            )
            .join("");


        /* =============================================
           WATCH LIVE BUTTONS
        ============================================= */

        container
            .querySelectorAll(
                ".klyde-watch-live"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            loadBroadcasters(
                                button.dataset
                                    .fixtureId,

                                button
                            );

                        }
                    );

                }
            );

    }


    /* =================================================
       BROADCASTER LOOKUP
    ================================================= */

    async function loadBroadcasters(
        fixtureId,
        button
    ) {

        if (!fixtureId) {
            return;
        }


        const originalText =
            button.innerHTML;


        button.disabled = true;

        button.innerHTML =
            "📡 CHECKING...";


        try {

            const response =
                await fetch(
                    `/api/broadcasts?fixture=${encodeURIComponent(
                        fixtureId
                    )}`
                );


            let data = {};

            try {

                data =
                    await response.json();

            }

            catch {

                throw new Error(
                    "Broadcaster server returned an invalid response."
                );

            }


            if (!response.ok) {

                throw new Error(

                    data?.error ||

                    "Broadcaster lookup failed."

                );

            }


            showBroadcastPopup(

                data?.broadcasters || [],

                fixtureId

            );

        }

        catch (error) {

            console.error(
                "KLYDE BROADCAST ERROR:",
                error
            );


            showSimplePopup(

                "⚠️ BROADCAST ERROR",

                error.message

            );

        }

        finally {

            button.disabled = false;

            button.innerHTML =
                originalText;

        }

    }


    /* =================================================
       BROADCAST POPUP
    ================================================= */

    function showBroadcastPopup(
        broadcasters,
        fixtureId
    ) {

        const popup =
            document.createElement("div");


        popup.className =
            "klyde-broadcast-popup";


        popup.style.cssText = `

            position:fixed;
            inset:0;
            background:rgba(0,0,0,.82);
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;

        `;


        const list =

            broadcasters.length

                ? broadcasters
                    .map(
                        broadcaster => {

                            const station =
                                broadcaster.tvstation ||
                                {};


                            const name =

                                station.name ||

                                broadcaster.name ||

                                broadcaster.station ||

                                "Official Broadcaster";


                            const url =

                                station.url ||

                                broadcaster.url ||

                                broadcaster.link ||

                                "";


                            return `

                                <div
                                    style="
                                        padding:15px;
                                        border:1px solid #ddd;
                                        border-radius:12px;
                                        margin-bottom:10px;
                                    "
                                >

                                    <strong>

                                        📺
                                        ${escapeHTML(
                                            name
                                        )}

                                    </strong>


                                    ${
                                        url

                                            ? `

                                                <button
                                                    type="button"
                                                    class="klyde-open-stream"
                                                    data-url="${escapeHTML(
                                                        url
                                                    )}"
                                                    style="
                                                        display:block;
                                                        width:100%;
                                                        margin-top:10px;
                                                        padding:11px;
                                                        border:0;
                                                        border-radius:9px;
                                                        cursor:pointer;
                                                    "
                                                >

                                                    WATCH →

                                                </button>

                                              `

                                            : `

                                                <p
                                                    style="
                                                        font-size:13px;
                                                        opacity:.6;
                                                    "
                                                >

                                                    Broadcaster found,
                                                    but no viewing
                                                    URL was supplied.

                                                </p>

                                              `
                                    }

                                </div>

                            `;

                        }
                    )
                    .join("")

                : `

                    <div
                        style="
                            padding:20px;
                            border-radius:12px;
                            background:#f4f4f4;
                        "
                    >

                        <strong>

                            📺 NO VERIFIED BROADCAST

                        </strong>

                        <p>

                            Sportmonks currently has
                            no broadcaster information
                            for this fixture.

                        </p>

                    </div>

                  `;


        popup.innerHTML = `

            <div
                style="
                    width:100%;
                    max-width:500px;
                    max-height:85vh;
                    overflow:auto;
                    background:white;
                    color:#111;
                    border-radius:20px;
                    padding:25px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    "
                >

                    <div>

                        <h2 style="margin:0;">
                            📺 WATCH LIVE
                        </h2>

                        <small>
                            Fixture
                            ${escapeHTML(
                                fixtureId
                            )}
                        </small>

                    </div>


                    <button
                        type="button"
                        class="klyde-close-popup"
                        style="
                            width:35px;
                            height:35px;
                            border:0;
                            border-radius:50%;
                            font-size:22px;
                            cursor:pointer;
                        "
                    >

                        ×

                    </button>

                </div>


                <div
                    style="margin-top:20px;"
                >

                    ${list}

                </div>


                <p
                    style="
                        font-size:12px;
                        opacity:.55;
                        margin-top:15px;
                    "
                >

                    KLYDE only displays broadcaster
                    information returned by its connected
                    sports data provider.

                </p>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        popup
            .querySelector(
                ".klyde-close-popup"
            )
            .onclick = () => {

                popup.remove();

            };


        popup
            .querySelectorAll(
                ".klyde-open-stream"
            )
            .forEach(
                button => {

                    button.onclick = () => {

                        const url =
                            button.dataset.url;


                        if (
                            url &&
                            /^https?:\/\//i.test(
                                url
                            )
                        ) {

                            window.open(
                                url,
                                "_blank",
                                "noopener,noreferrer"
                            );

                        }

                    };

                }
            );

    }


    /* =================================================
       SIMPLE POPUP
    ================================================= */

    function showSimplePopup(
        title,
        message
    ) {

        const popup =
            document.createElement("div");


        popup.style.cssText = `

            position:fixed;
            inset:0;
            background:rgba(0,0,0,.82);
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;

        `;


        popup.innerHTML = `

            <div
                style="
                    width:100%;
                    max-width:430px;
                    background:white;
                    color:#111;
                    border-radius:20px;
                    padding:30px;
                    text-align:center;
                "
            >

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <p>
                    ${escapeHTML(message)}
                </p>


                <button
                    type="button"
                    class="button klyde-close-popup"
                    style="margin-top:15px;"
                >

                    CLOSE

                </button>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        popup
            .querySelector(
                ".klyde-close-popup"
            )
            .onclick = () => {

                popup.remove();

            };

    }


    /* =================================================
       GENERAL DATA-TOOL BUTTONS
    ================================================= */

    document
        .querySelectorAll(
            "[data-tool]"
        )
        .forEach(
            button => {

                if (
                    button.closest(
                        ".quick-prompts"
                    )
                ) {
                    return;
                }


                if (
                    button.classList.contains(
                        "klyde-watch-live"
                    )
                ) {
                    return;
                }


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const tool =
                            button.dataset.tool;


                        if (
                            tool ===
                            "Sports Center"
                        ) {

                            if (
                                sportsSection
                            ) {

                                sportsSection
                                    .scrollIntoView({
                                        behavior:
                                            "smooth"
                                    });


                                loadSports(
                                    "live"
                                );

                            }

                            return;

                        }


                        if (
                            searchInput
                        ) {

                            searchInput.value =
                                tool;

                            searchInput.focus();

                            askKlyde(tool);

                        }

                    }
                );

            }
        );

});
