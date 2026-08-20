```javascript
// ============================================================
// KLYDE AI HUB
// Phase 2 — AI Chat Experience
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    /* ========================================================
       ELEMENTS
    ======================================================== */

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    let conversation = [];



    /* ========================================================
       INITIAL AI MESSAGE
    ======================================================== */

    if (result) {

        result.innerHTML = `
            <div class="klyde-message ai-message">
                <div class="message-avatar">K</div>

                <div class="message-content">
                    <strong>KLYDE AI</strong>

                    <p>
                        Hello! I'm KLYDE AI. Ask me anything and
                        let's explore it together.
                    </p>
                </div>
            </div>
        `;

    }



    /* ========================================================
       CHAT SUBMISSION
    ======================================================== */

    if (searchForm) {

        searchForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const query = searchInput.value.trim();

                if (!query) {

                    searchInput.focus();

                    showMessage(
                        "Type something to ask KLYDE AI."
                    );

                    return;

                }


                /* --------------------------------------------
                   SAVE USER MESSAGE
                -------------------------------------------- */

                conversation.push({
                    role: "user",
                    message: query
                });


                /* --------------------------------------------
                   DISPLAY USER MESSAGE
                -------------------------------------------- */

                addMessage(
                    "user",
                    query
                );


                /* --------------------------------------------
                   CLEAR INPUT
                -------------------------------------------- */

                searchInput.value = "";

                searchInput.focus();


                /* --------------------------------------------
                   THINKING INDICATOR
                -------------------------------------------- */

                const thinking = createThinkingMessage();


                try {

                    /* ----------------------------------------
                       SEND REQUEST TO YOUR EXISTING API
                    ---------------------------------------- */

                    const response = await fetch(
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


                    /* ----------------------------------------
                       READ RESPONSE SAFELY
                    ---------------------------------------- */

                    const rawText =
                        await response.text();

                    let data;

                    try {

                        data =
                            JSON.parse(rawText);

                    } catch (jsonError) {

                        throw new Error(
                            rawText ||
                            "The AI server returned an invalid response."
                        );

                    }


                    /* ----------------------------------------
                       API ERROR
                    ---------------------------------------- */

                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "KLYDE AI could not process your request."
                        );

                    }


                    /* ----------------------------------------
                       GET AI REPLY
                    ---------------------------------------- */

                    const reply =
                        data.reply ||
                        "I couldn't generate a response this time.";


                    /* ----------------------------------------
                       SAVE AI RESPONSE
                    ---------------------------------------- */

                    conversation.push({
                        role: "assistant",
                        message: reply
                    });


                    /* ----------------------------------------
                       REMOVE THINKING
                    ---------------------------------------- */

                    if (thinking) {
                        thinking.remove();
                    }


                    /* ----------------------------------------
                       DISPLAY AI RESPONSE
                    ---------------------------------------- */

                    addMessage(
                        "assistant",
                        reply
                    );


                } catch (error) {

                    console.error(
                        "KLYDE AI ERROR:",
                        error
                    );


                    /* ----------------------------------------
                       REMOVE THINKING
                    ---------------------------------------- */

                    if (thinking) {
                        thinking.remove();
                    }


                    /* ----------------------------------------
                       REMOVE FAILED USER MESSAGE
                    ---------------------------------------- */

                    conversation.pop();


                    /* ----------------------------------------
                       DISPLAY ERROR
                    ---------------------------------------- */

                    addMessage(
                        "assistant",
                        "Sorry bro — KLYDE AI couldn't complete that request right now.\n\n" +
                        error.message
                    );

                }

            }
        );

    }



    /* ========================================================
       ADD CHAT MESSAGE
    ======================================================== */

    function addMessage(
        type,
        message
    ) {

        if (!result) {
            return;
        }


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


        text.textContent =
            message;


        content.appendChild(name);

        content.appendChild(text);


        /* ====================================================
           COPY BUTTON FOR AI
        ==================================================== */

        if (type === "assistant") {

            const copyButton =
                document.createElement("button");

            copyButton.className =
                "copy-response";

            copyButton.type =
                "button";

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


                        setTimeout(
                            function () {

                                copyButton.textContent =
                                    "Copy";

                            },
                            1800
                        );

                    } catch (error) {

                        showMessage(
                            "Copy is not available on this browser."
                        );

                    }

                }
            );


            content.appendChild(
                copyButton
            );

        }


        wrapper.appendChild(
            avatar
        );

        wrapper.appendChild(
            content
        );


        result.appendChild(
            wrapper
        );


        /* ====================================================
           SCROLL CHAT TO BOTTOM
        ==================================================== */

        result.scrollTop =
            result.scrollHeight;

    }



    /* ========================================================
       THINKING MESSAGE
    ======================================================== */

    function createThinkingMessage() {

        if (!result) {
            return null;
        }


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "klyde-message ai-message thinking-message";


        wrapper.innerHTML = `
            <div class="message-avatar">
                K
            </div>

            <div class="message-content">

                <strong>KLYDE AI</strong>

                <div class="thinking">

                    <span></span>
                    <span></span>
                    <span></span>

                    <em>
                        KLYDE is thinking...
                    </em>

                </div>

            </div>
        `;


        result.appendChild(
            wrapper
        );


        result.scrollTop =
            result.scrollHeight;


        return wrapper;

    }



    /* ========================================================
       BUILD CONVERSATION PROMPT
    ======================================================== */

    function buildConversationPrompt() {

        const systemInstruction = `

You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB.

Your identity:
- Your name is KLYDE AI.
- You are the central AI assistant of KLYDE AI HUB.

Your personality:
- Intelligent
- Helpful
- Clear
- Confident
- Friendly
- Practical
- Encouraging
- Natural

Communication style:
- Understand what the user actually means.
- Give direct answers.
- Explain complicated things simply.
- Use examples when useful.
- Do not unnecessarily repeat yourself.
- Do not pretend to know something you do not know.
- If something requires current information, clearly say that current information is needed.
- Match the user's tone naturally.
- You may use casual language when the user does.
- Do not mention Gemini or the underlying AI provider unless the user specifically asks.

KLYDE AI HUB:
KLYDE AI HUB is a digital platform designed around AI,
sports, creativity, education, information and future digital tools.

Conversation rules:
- Remember previous messages in this conversation.
- Use previous context when answering follow-up questions.
- If the user refers to "it", "that", "the site", "the code",
  or another unclear reference, use the conversation context
  to understand what they mean.
- Never claim to have performed an action that you cannot actually perform.

Conversation:
`;


        let prompt =
            systemInstruction +
            "\n\n";


        conversation.forEach(
            function (item) {

                if (
                    item.role === "user"
                ) {

                    prompt +=
                        "USER: " +
                        item.message +
                        "\n";

                }


                if (
                    item.role === "assistant"
                ) {

                    prompt +=
                        "KLYDE AI: " +
                        item.message +
                        "\n";

                }

            }
        );


        return prompt;

    }



    /* ========================================================
       KEYBOARD SHORTCUTS
    ======================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                /*
                 * Enter = send
                 * Shift + Enter = new line
                 */

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    if (searchForm) {

                        searchForm.requestSubmit();

                    }

                }

            }
        );

    }



    /* ========================================================
       TOOL BUTTONS
    ======================================================== */

    const buttons =
        document.querySelectorAll(
            "[data-tool]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const tool =
                        button.getAttribute(
                            "data-tool"
                        );


                    showMessage(
                        tool +
                        " will be available in a future KLYDE AI HUB update."
                    );

                }
            );

        }
    );



    /* ========================================================
       GENERAL BUTTON FEEDBACK
    ======================================================== */

    const normalButtons =
        document.querySelectorAll(
            ".card button:not([data-tool]), .banner button"
        );


    normalButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    showMessage(
                        "This KLYDE AI HUB feature is being prepared."
                    );

                }
            );

        }
    );



    /* ========================================================
       TOAST MESSAGE
    ======================================================== */

    function showMessage(
        message
    ) {

        let toast =
            document.getElementById(
                "toast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "toast";

            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

    }

});
```
