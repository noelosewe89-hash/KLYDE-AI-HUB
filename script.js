/* =====================================================
   KLYDE AI HUB — MAIN SCRIPT
   AI + MEMORY + THINKING + COPY
   SPORTS + BROADCASTERS
   NEWS + MUSIC
   EDUCATION + AI TUTOR + REVISION + STUDY TOOLS
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

        if (!result) {
            return;
        }

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
       MAIN KLYDE AI
    ================================================= */

    async function askKlyde(question) {

        if (!question) {
            return;
        }

        if (!result) {
            return;
        }


        result.innerHTML =
            thinkingHTML();


        conversation.push({

            role: "user",

            message: question

        });


        try {

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


            let data = {};

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }

            else {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    "KLYDE received an invalid response from the AI server."
                );

            }


            if (!response.ok) {

                throw new Error(

                    data?.error ||

                    data?.message ||

                    "KLYDE AI request failed."

                );

            }


            const answer =

                data?.reply ||

                data?.answer ||

                data?.message ||

                data?.response ||

                "KLYDE could not generate a response.";


            conversation.push({

                role: "assistant",

                message: answer

            });


            displayAIResponse(
                answer
            );


            if (searchInput) {

                searchInput.value = "";

            }

        }

        catch (error) {

            console.error(
                "KLYDE AI ERROR:",
                error
            );


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


        if (status) {

            status.textContent =

                type === "live"

                    ? "Loading live matches..."

                    : "Loading matches...";

        }


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

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }

            else {

                const text =
                    await response.text();

                throw new Error(
                    text ||
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


            if (status) {

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

            }


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


            if (status) {

                status.textContent =
                    "Sports error";

            }


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

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }

            else {

                const text =
                    await response.text();

                throw new Error(
                    text ||
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

                            No broadcaster information
                            was returned for this fixture.

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
       EDUCATION
    ================================================= */

    const educationSection =
        document.getElementById(
            "education"
        );


    function openEducation(mode) {

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
                    max-width:560px;
                    max-height:90vh;
                    overflow:auto;
                    background:white;
                    color:#111;
                    border-radius:20px;
                    padding:28px;
                    box-sizing:border-box;
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

                        <small>
                            KLYDE EDUCATION
                        </small>

                        <h2 style="margin:5px 0;">
                            ${
                                mode === "tutor"
                                    ? "🎓 AI Tutor"
                                    : mode === "revision"
                                        ? "📝 Revision"
                                        : "📚 Study Tools"
                            }
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="klyde-education-close"
                        style="
                            width:38px;
                            height:38px;
                            border:0;
                            border-radius:50%;
                            font-size:23px;
                            cursor:pointer;
                        "
                    >
                        ×
                    </button>

                </div>


                <label
                    style="
                        display:block;
                        margin-top:18px;
                        font-weight:bold;
                    "
                >
                    Subject
                </label>


                <select
                    class="klyde-education-subject"
                    style="
                        width:100%;
                        padding:13px;
                        margin-top:7px;
                        border:1px solid #ccc;
                        border-radius:10px;
                    "
                >

                    <option value="">
                        Choose subject
                    </option>

                    <option>
                        Mathematics
                    </option>

                    <option>
                        English
                    </option>

                    <option>
                        Kiswahili
                    </option>

                    <option>
                        Chemistry
                    </option>

                    <option>
                        Physics
                    </option>

                    <option>
                        Biology
                    </option>

                    <option>
                        CRE
                    </option>

                    <option>
                        Computer Studies
                    </option>

                    <option>
                        General KCSE Preparation
                    </option>

                </select>


                <label
                    style="
                        display:block;
                        margin-top:18px;
                        font-weight:bold;
                    "
                >
                    Topic / Question
                </label>


                <input
                    type="text"
                    class="klyde-education-topic"
                    placeholder="e.g. Organic Chemistry"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:13px;
                        margin-top:7px;
                        border:1px solid #ccc;
                        border-radius:10px;
                    "
                >


                <div
                    class="klyde-education-options"
                    style="margin-top:18px;"
                ></div>


                <button
                    type="button"
                    class="button klyde-education-start"
                    style="
                        width:100%;
                        margin-top:20px;
                    "
                >
                    START WITH KLYDE AI →
                </button>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        const subject =
            popup.querySelector(
                ".klyde-education-subject"
            );


        const topic =
            popup.querySelector(
                ".klyde-education-topic"
            );


        const options =
            popup.querySelector(
                ".klyde-education-options"
            );


        if (mode === "tutor") {

            options.innerHTML = `

                <label
                    style="
                        display:block;
                        font-weight:bold;
                    "
                >
                    Level
                </label>

                <select
                    class="klyde-education-level"
                    style="
                        width:100%;
                        padding:13px;
                        margin-top:7px;
                        border:1px solid #ccc;
                        border-radius:10px;
                    "
                >

                    <option>
                        KCSE / Secondary School
                    </option>

                    <option>
                        Beginner
                    </option>

                    <option>
                        Intermediate
                    </option>

                    <option>
                        Advanced
                    </option>

                </select>

            `;

        }


        else if (mode === "revision") {

            options.innerHTML = `

                <label
                    style="
                        display:block;
                        font-weight:bold;
                    "
                >
                    Revision Type
                </label>

                <select
                    class="klyde-education-type"
                    style="
                        width:100%;
                        padding:13px;
                        margin-top:7px;
                        border:1px solid #ccc;
                        border-radius:10px;
                    "
                >

                    <option>
                        Topic Revision
                    </option>

                    <option>
                        KCSE-style Questions
                    </option>

                    <option>
                        Quick Quiz
                    </option>

                    <option>
                        Past-paper Practice
                    </option>

                </select>

            `;

        }


        else {

            options.innerHTML = `

                <label
                    style="
                        display:block;
                        font-weight:bold;
                    "
                >
                    Study Tool
                </label>

                <select
                    class="klyde-education-type"
                    style="
                        width:100%;
                        padding:13px;
                        margin-top:7px;
                        border:1px solid #ccc;
                        border-radius:10px;
                    "
                >

                    <option>
                        Revision Notes
                    </option>

                    <option>
                        Summary
                    </option>

                    <option>
                        Flashcards
                    </option>

                    <option>
                        Quiz
                    </option>

                    <option>
                        Study Plan
                    </option>

                    <option>
                        Exam Tips
                    </option>

                </select>

            `;

        }


        popup
            .querySelector(
                ".klyde-education-close"
            )
            .onclick = () => {

                popup.remove();

            };


        const startButton =
            popup.querySelector(
                ".klyde-education-start"
            );


        async function startEducation() {

            const selectedSubject =
                subject.value ||
                "General";


            const selectedTopic =
                topic.value.trim();


            if (!selectedTopic) {

                topic.focus();

                return;

            }


            let prompt = "";


            if (mode === "tutor") {

                const level =
                    popup.querySelector(
                        ".klyde-education-level"
                    )?.value ||
                    "KCSE / Secondary School";


                prompt = `

Act as KLYDE AI Tutor.

Subject:
${selectedSubject}

Topic:
${selectedTopic}

Level:
${level}

Teach me this topic step-by-step.

Use simple language.

Include:

1. Clear definition.
2. Important concepts.
3. Step-by-step explanation.
4. Worked examples where appropriate.
5. Common mistakes.
6. A short practice question.
7. The answer and explanation.

Do not simply give the answer.
Help the student understand.

Make it suitable for Kenyan secondary-school/KCSE learning.

`;

            }


            else if (mode === "revision") {

                const revisionType =
                    popup.querySelector(
                        ".klyde-education-type"
                    )?.value ||
                    "Topic Revision";


                prompt = `

Act as a KLYDE AI examination revision tutor.

Subject:
${selectedSubject}

Topic:
${selectedTopic}

Revision type:
${revisionType}

Prepare a focused revision session.

Include:

• Key points.
• Important definitions.
• Important concepts.
• Likely examination areas.
• KCSE-style practice questions.
• Answers after the questions.
• Worked calculations where necessary.
• Common student mistakes.
• Quick revision tips.

Make it suitable for Kenyan secondary-school/KCSE preparation.

`;

            }


            else {

                const tool =
                    popup.querySelector(
                        ".klyde-education-type"
                    )?.value ||
                    "Revision Notes";


                prompt = `

Use KLYDE AI Study Tools.

Subject:
${selectedSubject}

Topic:
${selectedTopic}

Create:
${tool}

Make the material:

• Accurate.
• Clear.
• Well organized.
• Easy to revise.
• Suitable for Kenyan secondary-school/KCSE preparation.

Include examples and practice material where useful.

`;

            }


            popup.remove();


            if (searchInput) {

                searchInput.value =
                    prompt.trim();

                searchInput.focus();

            }


            /*
               IMPORTANT:

               We use the EXISTING AI SEARCH FORM.

               We do NOT create another fetch()
               and we do NOT create another askKlyde().
            */

            if (searchForm) {

                searchForm.dispatchEvent(
                    new Event(
                        "submit",
                        {
                            bubbles: true,
                            cancelable: true
                        }
                    )
                );

            }


            const askSection =
                document.getElementById(
                    "ask"
                );


            if (askSection) {

                askSection.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }


        startButton.onclick =
            startEducation;


        topic.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    startEducation();

                }

            }
        );


        topic.focus();

    }


    /* =================================================
       ADD EDUCATION CONTROLS
    ================================================= */

    if (educationSection) {

        educationSection
            .querySelectorAll(".card")
            .forEach(card => {

                const heading =
                    card.querySelector("h3");


                if (!heading) {
                    return;
                }


                const title =
                    heading.textContent.trim();


                let mode = "";


                if (
                    title === "AI Tutor"
                ) {

                    mode = "tutor";

                }


                else if (
                    title === "Revision"
                ) {

                    mode = "revision";

                }


                else if (
                    title === "Study Tools"
                ) {

                    mode = "tools";

                }


                if (!mode) {
                    return;
                }


                /*
                   Prevent duplicate buttons.
                */

                if (
                    card.querySelector(
                        ".klyde-education-launch"
                    )
                ) {

                    return;

                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "button klyde-education-launch";


                button.textContent =

                    mode === "tutor"

                        ? "Start AI Tutor →"

                        : mode === "revision"

                            ? "Start Revision →"

                            : "Open Study Tools →";


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        openEducation(
                            mode
                        );

                    }
                );


                card.appendChild(
                    button
                );

            });

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


                /*
                   Education buttons created above
                   already have their own handlers.
                */

                if (
                    button.classList.contains(
                        "klyde-education-launch"
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

                            askKlyde(
                                tool
                            );

                        }

                    }
                );

            }
        );

});
