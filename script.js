document.addEventListener("DOMContentLoaded", function () {

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    let conversation = [];

    /* =====================================================
       CHAT
    ===================================================== */

    if (searchForm) {

        searchForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (!query) return;

            addMessage("user", query);

            searchInput.value = "";

            const thinking = addMessage(
                "assistant",
                "KLYDE AI is thinking..."
            );

            try {

                const response = await fetch("/api/chat", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: query
                    })
                });

                const text = await response.text();

                let data;

                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(
                        text || "Invalid server response."
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
                    data.reply || "No response received."
                );

            } catch (error) {

                if (thinking) {
                    thinking.remove();
                }

                addMessage(
                    "assistant",
                    "KLYDE AI error: " +
                    error.message
                );
            }

        });
    }


    /* =====================================================
       CHAT DISPLAY
    ===================================================== */

    function addMessage(type, message) {

        if (!result) return null;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "klyde-message " +
            (
                type === "user"
                    ? "user-message"
                    : "ai-message"
            );

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

        text.textContent = message;

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
       SPORTS
    ===================================================== */

    const sportsButtons =
        document.querySelectorAll(
            '[data-tool="Sports Center"]'
        );

    sportsButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openSports();

            }
        );

    });


    function openSports() {

        const sportsMessage = `

⚽ KLYDE SPORTS CENTER

Choose what you want:

1. ⚽ Football
2. 🏀 Basketball
3. 🎾 Tennis
4. 🏆 Results
5. 📅 Fixtures
6. 📊 Standings
7. 📰 Sports News

You can also ask KLYDE AI directly:

"What's happening in football today?"

"Show me today's fixtures."

"Give me the latest football results."

"Who is top of the league?"

`;

        addMessage(
            "assistant",
            sportsMessage
        );

        if (searchInput) {

            searchInput.focus();

        }
    }


    /* =====================================================
       EDUCATION
    ===================================================== */

    const educationSection =
        document.getElementById("education");

    if (educationSection) {

        const cards =
            educationSection.querySelectorAll(
                ".card"
            );

        cards.forEach(function (card) {

            const title =
                card.querySelector("h3");

            if (!title) return;

            const subject =
                title.textContent.trim();

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                "Study with KLYDE →";

            button.className =
                "education-action";

            button.addEventListener(
                "click",
                function () {

                    const prompt =
                        `Help me study ${subject}. ` +
                        `Give me a clear explanation, ` +
                        `examples and a short quiz.`;

                    if (searchInput) {

                        searchInput.value =
                            prompt;

                        searchForm.requestSubmit();

                    }

                }
            );

            card.appendChild(button);

        });

    }


    /* =====================================================
       EDUCATION QUICK SUBJECTS
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

            if (searchInput) {

                searchInput.value =
                    `Teach me ${subject} ` +
                    `according to the Kenyan ` +
                    `KCSE curriculum. ` +
                    `Explain step by step and ` +
                    `give me practice questions.`;

                searchForm.requestSubmit();

            }

        };


    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    const toolButtons =
        document.querySelectorAll(
            "[data-tool]"
        );

    toolButtons.forEach(function (button) {

        const tool =
            button.getAttribute(
                "data-tool"
            );

        if (
            tool === "Sports Center"
        ) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                let prompt = "";

                if (
                    tool ===
                    "Explain Something"
                ) {

                    prompt =
                        "Explain a difficult topic to me simply.";

                } else if (
                    tool === "Study Help"
                ) {

                    prompt =
                        "Help me study for my KCSE exams.";

                } else if (
                    tool === "Creative Ideas"
                ) {

                    prompt =
                        "Give me creative ideas.";

                } else if (
                    tool === "Technology Help"
                ) {

                    prompt =
                        "Help me solve a technology problem.";

                } else {

                    prompt =
                        `Tell me more about ${tool}.`;

                }

                if (searchInput) {

                    searchInput.value =
                        prompt;

                    searchForm.requestSubmit();

                }

            }
        );

    });

});
