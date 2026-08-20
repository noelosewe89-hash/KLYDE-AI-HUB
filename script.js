document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       KLYDE AI HUB — MAIN ELEMENTS
    ===================================================== */

    const searchForm =
        document.getElementById("searchForm");

    const searchInput =
        document.getElementById("searchInput");

    const result =
        document.getElementById("result");


    /* =====================================================
       MAIN CHAT
    ===================================================== */

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const query =
                    searchInput
                        ? searchInput.value.trim()
                        : "";

                if (!query) {
                    return;
                }

                addMessage(
                    "user",
                    query
                );

                searchInput.value = "";

                const thinking =
                    addMessage(
                        "assistant",
                        "KLYDE AI is thinking..."
                    );

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

                                body:
                                    JSON.stringify({
                                        message: query
                                    })
                            }
                        );

                    const raw =
                        await response.text();

                    let data;

                    try {

                        data =
                            JSON.parse(raw);

                    } catch (error) {

                        throw new Error(
                            raw ||
                            "Invalid server response."
                        );
                    }

                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "KLYDE AI could not answer."
                        );
                    }

                    if (thinking) {
                        thinking.remove();
                    }

                    addMessage(
                        "assistant",
                        data.reply ||
                        "KLYDE AI returned no response."
                    );

                } catch (error) {

                    if (thinking) {
                        thinking.remove();
                    }

                    console.error(
                        "KLYDE AI ERROR:",
                        error
                    );

                    addMessage(
                        "assistant",
                        "KLYDE AI error: " +
                        (
                            error.message ||
                            "Unknown error"
                        )
                    );
                }

            }
        );

    }


    /* =====================================================
       MESSAGE DISPLAY
    ===================================================== */

    function addMessage(
        type,
        message
    ) {

        if (!result) {
            return null;
        }

        const wrapper =
            document.createElement("div");

        wrapper.className =
            type === "user"
                ? "klyde-message user-message"
                : "klyde-message ai-message";


        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";

        avatar.textContent =
            type === "user"
                ? "U"
                : "K";


        const content =
            document.createElement("div");

        content.className =
            "message-content";


        const name =
            document.createElement("strong");

        name.textContent =
            type === "user"
                ? "YOU"
                : "KLYDE AI";


        const text =
            document.createElement("p");

        text.textContent =
            message;


        content.appendChild(name);
        content.appendChild(text);

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        result.appendChild(wrapper);

        result.scrollTop =
            result.scrollHeight;

        return wrapper;
    }


    /* =====================================================
       SPORTS CENTER
    ===================================================== */

    const sportsButton =
        document.querySelector(
            '[data-tool="Sports Center"]'
        );


    if (sportsButton) {

        sportsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    !searchInput ||
                    !searchForm
                ) {
                    return;
                }

                searchInput.value =
                    `You are KLYDE Sports.

Give me the latest sports information available.

Cover:
⚽ Football
🏀 Basketball
🎾 Tennis
🏆 Results
📅 Fixtures
📊 League standings
🔄 Major transfers
📰 Important sports news

Organize the answer clearly.

If current/live information is not available, clearly say so rather than inventing results.`;

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
        );

    }


    /* =====================================================
       SPORTS QUICK ACTIONS
    ===================================================== */

    const sportsActions = {

        "football":
            "Give me the latest football information, including major results, fixtures, standings, transfers and important news.",

        "basketball":
            "Give me the latest basketball information, including results, fixtures, standings and major news.",

        "tennis":
            "Give me the latest tennis information, including major results, upcoming matches and important news.",

        "results":
            "Give me the latest available sports results.",

        "fixtures":
            "Show me the latest available football and major sports fixtures.",

        "standings":
            "Show me the latest available football league standings.",

        "sports news":
            "Give me the latest important sports news."
    };


    window.klydeSports =
        function (category) {

            if (
                !sportsActions[category]
            ) {
                return;
            }

            if (
                !searchInput ||
                !searchForm
            ) {
                return;
            }

            searchInput.value =
                sportsActions[category];

            searchForm.dispatchEvent(
                new Event(
                    "submit",
                    {
                        bubbles: true,
                        cancelable: true
                    }
                )
            );

        };


    /* =====================================================
       EDUCATION CENTER
    ===================================================== */

    const education =
        document.getElementById(
            "education"
        );


    if (education) {

        const cards =
            education.querySelectorAll(
                ".card"
            );


        cards.forEach(
            function (card) {

                const title =
                    card.querySelector(
                        "h3"
                    );

                if (!title) {
                    return;
                }


                const subject =
                    title.textContent.trim();


                /*
                   Prevent duplicate buttons
                */

                if (
                    card.querySelector(
                        ".education-action"
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
                    "education-action";

                button.textContent =
                    "Study with KLYDE →";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        startEducationLesson(
                            subject
                        );

                    }
                );


                card.appendChild(
                    button
                );

            }
        );

    }


    /* =====================================================
       EDUCATION LESSON
    ===================================================== */

    function startEducationLesson(
        subject
    ) {

        if (
            !searchInput ||
            !searchForm
        ) {
            return;
        }


        searchInput.value =
            `You are my ${subject} tutor.

Teach me ${subject} according to the Kenyan secondary-school and KCSE learning context.

Start with a simple explanation.

Then provide:

1. Key notes
2. Important definitions
3. Worked examples
4. Common KCSE-style questions
5. Practice questions
6. Answers
7. A short quiz at the end

Make the lesson clear and suitable for a Kenyan secondary-school student.

Do not overwhelm me. Teach step by step.`;


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


    /* =====================================================
       QUICK EDUCATION SUBJECTS
    ===================================================== */

    const educationSubjects = [

        "Mathematics",
        "English",
        "Kiswahili",
        "Chemistry",
        "Physics",
        "Biology",
        "CRE",
        "Computer Studies"

    ];


    window.klydeStudy =
        function (subject) {

            if (
                !educationSubjects.includes(
                    subject
                )
            ) {
                return;
            }

            startEducationLesson(
                subject
            );

        };


    /* =====================================================
       QUICK PROMPT BUTTONS
    ===================================================== */

    const quickButtons =
        document.querySelectorAll(
            ".quick-prompts button"
        );


    quickButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const buttonText =
                        button.textContent
                            .trim()
                            .toLowerCase();


                    let prompt =
                        "Help me.";


                    if (
                        buttonText.includes(
                            "explain"
                        )
                    ) {

                        prompt =
                            "Explain a difficult topic to me simply, step by step, with examples.";

                    }

                    else if (
                        buttonText.includes(
                            "study"
                        )
                    ) {

                        prompt =
                            "Help me study for my KCSE exams. Give me clear notes and practice questions.";

                    }

                    else if (
                        buttonText.includes(
                            "ideas"
                        )
                    ) {

                        prompt =
                            "Give me creative ideas.";

                    }

                    else if (
                        buttonText.includes(
                            "tech"
                        )
                    ) {

                        prompt =
                            "Help me solve a technology problem.";

                    }


                    if (
                        searchInput &&
                        searchForm
                    ) {

                        searchInput.value =
                            prompt;


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

                }
            );

        }
    );


    /* =====================================================
       GENERAL DATA-TOOL BUTTONS
    ===================================================== */

    const toolButtons =
        document.querySelectorAll(
            "[data-tool]"
        );


    toolButtons.forEach(
        function (button) {

            const tool =
                button.getAttribute(
                    "data-tool"
                );


            /*
               Sports already has its
               own event listener.
            */

            if (
                tool ===
                "Sports Center"
            ) {
                return;
            }


            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    let prompt =
                        "";


                    if (
                        tool ===
                        "Explain Something"
                    ) {

                        prompt =
                            "Explain something difficult to me in a simple way.";

                    }

                    else if (
                        tool ===
                        "Study Help"
                    ) {

                        prompt =
                            "Help me study for my KCSE exams.";

                    }

                    else if (
                        tool ===
                        "Creative Ideas"
                    ) {

                        prompt =
                            "Give me creative ideas.";

                    }

                    else if (
                        tool ===
                        "Technology Help"
                    ) {

                        prompt =
                            "Help me solve a technology problem.";

                    }

                    else {

                        prompt =
                            "Tell me more about " +
                            tool +
                            ".";

                    }


                    if (
                        searchInput &&
                        searchForm
                    ) {

                        searchInput.value =
                            prompt;


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

                }
            );

        }
    );


    /* =====================================================
       ENTER KEY
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

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

                }

            }
        );

    }


    /* =====================================================
       KLYDE READY MESSAGE
    ===================================================== */

    console.log(
        "KLYDE AI HUB loaded successfully."
    );

    console.log(
        "Sports Center: READY"
    );

    console.log(
        "Education Center: READY"
    );

});
