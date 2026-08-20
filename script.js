document.addEventListener("DOMContentLoaded", function () {

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    /* =====================================================
       CHAT
    ===================================================== */

    if (searchForm) {

        searchForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (!query) {
                return;
            }

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

                const raw = await response.text();

                let data;

                try {
                    data = JSON.parse(raw);
                } catch (error) {
                    throw new Error(
                        raw || "Invalid server response."
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

        });

    }


    /* =====================================================
       DISPLAY MESSAGES
    ===================================================== */

    function addMessage(type, message) {

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
       SPORTS BUTTON
    ===================================================== */

    const sportsButton =
        document.querySelector(
            '[data-tool="Sports Center"]'
        );

    if (sportsButton) {

        sportsButton.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value =
                        "Tell me the latest sports news, football fixtures, results and standings.";

                    if (searchForm) {
                        searchForm.dispatchEvent(
                            new Event("submit", {
                                bubbles: true,
                                cancelable: true
                            })
                        );
                    }
                }

            }
        );
    }


    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    const quickButtons =
        document.querySelectorAll(
            ".quick-prompts button"
        );

    quickButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();

                let prompt =
                    "Help me.";

                if (
                    text.includes("explain")
                ) {
                    prompt =
                        "Explain a difficult topic to me simply with examples.";
                }

                else if (
                    text.includes("study")
                ) {
                    prompt =
                        "Help me study for my KCSE exams.";
                }

                else if (
                    text.includes("ideas")
                ) {
                    prompt =
                        "Give me some creative ideas.";
                }

                else if (
                    text.includes("tech")
                ) {
                    prompt =
                        "Help me solve a technology problem.";
                }

                if (searchInput) {

                    searchInput.value =
                        prompt;

                    if (searchForm) {

                        searchForm.dispatchEvent(
                            new Event("submit", {
                                bubbles: true,
                                cancelable: true
                            })
                        );

                    }
                }

            }
        );

    });


    /* =====================================================
       EDUCATION CARDS
    ===================================================== */

    const education =
        document.getElementById("education");

    if (education) {

        const cards =
            education.querySelectorAll(
                ".card"
            );

        cards.forEach(function (card) {

            const title =
                card.querySelector("h3");

            if (!title) {
                return;
            }

            const subject =
                title.textContent.trim();

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                "Study with KLYDE →";

            button.addEventListener(
                "click",
                function () {

                    if (!searchInput) {
                        return;
                    }

                    searchInput.value =
                        "Teach me " +
                        subject +
                        " according to the Kenyan KCSE curriculum. Explain it step by step and give me practice questions.";

                    if (searchForm) {

                        searchForm.dispatchEvent(
                            new Event("submit", {
                                bubbles: true,
                                cancelable: true
                            })
                        );

                    }

                }
            );

            card.appendChild(button);

        });

    }

});
