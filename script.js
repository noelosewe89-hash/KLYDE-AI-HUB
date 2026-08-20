
// KLYDE AI HUB
// Phase 2 - AI Chat Experience

document.addEventListener("DOMContentLoaded", function () {

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    let conversation = [];

    /* =========================================================
       INITIAL MESSAGE
    ========================================================= */

    if (result) {
        result.innerHTML = "";

        addMessage(
            "assistant",
            "Hello! I'm KLYDE AI. Ask me anything and let's explore it together."
        );
    }


    /* =========================================================
       CHAT FORM
    ========================================================= */

    if (searchForm) {

        searchForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (query === "") {
                searchInput.focus();
                return;
            }

            conversation.push({
                role: "user",
                message: query
            });

            addMessage("user", query);

            searchInput.value = "";

            const thinkingMessage = createThinkingMessage();

            try {

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: buildConversationPrompt()
                    })
                });

                const rawText = await response.text();

                let data;

                try {
                    data = JSON.parse(rawText);
                } catch (error) {
                    throw new Error(
                        rawText || "The server returned an invalid response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.error || "KLYDE AI could not process the request."
                    );
                }

                const reply =
                    data.reply ||
                    "KLYDE AI did not return a response.";

                conversation.push({
                    role: "assistant",
                    message: reply
                });

                if (thinkingMessage) {
                    thinkingMessage.remove();
                }

                addMessage("assistant", reply);

            } catch (error) {

                console.error("KLYDE AI ERROR:", error);

                if (thinkingMessage) {
                    thinkingMessage.remove();
                }

                conversation.pop();

                addMessage(
                    "assistant",
                    "KLYDE AI error: " + error.message
                );
            }

        });

    }


    /* =========================================================
       ENTER KEY
    ========================================================= */

    if (searchInput) {

        searchInput.addEventListener("keydown", function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                if (searchForm) {
                    searchForm.requestSubmit();
                }

            }

        });

    }


    /* =========================================================
       ADD MESSAGE
    ========================================================= */

    function addMessage(type, message) {

        if (!result) {
            return;
        }

        const messageWrapper =
            document.createElement("div");

        messageWrapper.className =
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


        /* COPY BUTTON */

        if (type === "assistant") {

            const copyButton =
                document.createElement("button");

            copyButton.type = "button";

            copyButton.className =
                "copy-response";

            copyButton.textContent =
                "Copy";

            copyButton.addEventListener(
                "click",
                async function () {

                    try {

                        await navigator.clipboard.writeText(
                            message
                        );

                        copyButton.textContent =
                            "Copied ✓";

                        setTimeout(function () {
                            copyButton.textContent =
                                "Copy";
                        }, 1800);

                    } catch (error) {

                        copyButton.textContent =
                            "Copy unavailable";

                    }

                }
            );

            content.appendChild(copyButton);
        }


        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);

        result.appendChild(messageWrapper);

        result.scrollTop =
            result.scrollHeight;
    }


    /* =========================================================
       THINKING ANIMATION
    ========================================================= */

    function createThinkingMessage() {

        if (!result) {
            return null;
        }

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "klyde-message ai-message thinking-message";

        wrapper.innerHTML = `
            <div class="message-avatar">K</div>

            <div class="message-content">

                <strong>KLYDE AI</strong>

                <div class="thinking">
                    <span></span>
                    <span></span>
                    <span></span>
                    <em>KLYDE is thinking...</em>
                </div>

            </div>
        `;

        result.appendChild(wrapper);

        result.scrollTop =
            result.scrollHeight;

        return wrapper;
    }


    /* =========================================================
       CONVERSATION PROMPT
    ========================================================= */

    function buildConversationPrompt() {

        const systemInstruction = `
You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB.

Your personality:
- Intelligent
- Helpful
- Friendly
- Confident
- Practical
- Clear
- Encouraging

Your job is to help users with:
- Questions
- Learning
- Education
- Technology
- Writing
- Creativity
- Music
- Sports
- Planning
- General information

Answer naturally and directly.

Use simple explanations when the user needs them.

Remember the conversation history provided below.

Do not mention Gemini or the underlying AI provider unless the user specifically asks.

Do not pretend to have performed actions you cannot actually perform.

Conversation:
`;

        let prompt =
            systemInstruction + "\n\n";

        conversation.forEach(function (item) {

            if (item.role === "user") {

                prompt +=
                    "USER: " +
                    item.message +
                    "\n";

            }

            if (item.role === "assistant") {

                prompt +=
                    "KLYDE AI: " +
                    item.message +
                    "\n";

            }

        });

        return prompt;
    }


    /* =========================================================
       TOOL BUTTONS
    ========================================================= */

    const toolButtons =
        document.querySelectorAll("[data-tool]");

    toolButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            const tool =
                button.getAttribute("data-tool");

            showMessage(
                tool +
                " will be available in a future KLYDE AI HUB update."
            );

        });

    });


    /* =========================================================
       OTHER BUTTONS
    ========================================================= */

    const normalButtons =
        document.querySelectorAll(
            ".card button:not([data-tool]), .banner button"
        );

    normalButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            event.preventDefault();

            showMessage(
                "This KLYDE AI HUB feature is being prepared."
            );

        });

    });


    /* =========================================================
       TOAST
    ========================================================= */

    function showMessage(message) {

        let toast =
            document.getElementById("toast");

        if (!toast) {

            toast =
                document.createElement("div");

            toast.id = "toast";

            document.body.appendChild(toast);
        }

        toast.textContent = message;

        toast.classList.add("show");

        setTimeout(function () {

            toast.classList.remove("show");

        }, 3000);
    }

});

