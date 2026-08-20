// KLYDE AI HUB
// Phase 1 interactive foundation
// AI Chat Upgrade

document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       KLYDE AI CHAT
    ========================= */

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    // Conversation memory for the current session
    let conversation = [];

    if (searchForm) {

        searchForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (query === "") {
                result.textContent = "Type something to ask KLYDE AI.";
                return;
            }

            // Show thinking message
            result.textContent = "KLYDE AI is thinking...";

            // Add user's message to conversation
            conversation.push({
                role: "user",
                message: query
            });

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

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Something went wrong."
                    );
                }

                const reply =
                    data.reply ||
                    "KLYDE AI could not generate a response.";

                // Save KLYDE's response
                conversation.push({
                    role: "assistant",
                    message: reply
                });

                // Display response
                result.textContent = reply;

                // Clear search box
                searchInput.value = "";

            } catch (error) {

                // Remove failed user message from memory
                conversation.pop();

                result.textContent =
                    "KLYDE AI error: " + error.message;
            }

        });
    }


    /* =========================
       BUILD CONVERSATION
    ========================= */

    function buildConversationPrompt() {

        const systemInstruction = `
You are KLYDE AI, the intelligent assistant inside KLYDE AI HUB.

Your personality:
- Helpful
- Intelligent
- Clear
- Friendly
- Confident
- Practical

Answer naturally and directly.
Remember the conversation provided below.
If the user asks a follow-up question, use the previous messages
to understand what they mean.

Do not mention Gemini unless the user specifically asks what technology
powers you.

Conversation:
`;

        let prompt = systemInstruction + "\n\n";

        conversation.forEach(function (item) {

            if (item.role === "user") {
                prompt += "USER: " + item.message + "\n";
            }

            if (item.role === "assistant") {
                prompt += "KLYDE AI: " + item.message + "\n";
            }

        });

        return prompt;
    }


    /* =========================
       BUTTONS
    ========================= */

    const buttons = document.querySelectorAll("[data-tool]");

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const tool = button.getAttribute("data-tool");

            showMessage(
                tool + " will be available in a future KLYDE AI HUB update."
            );

        });

    });


    /* =========================
       GENERAL BUTTON FEEDBACK
    ========================= */

    const normalButtons = document.querySelectorAll(
        ".card button:not([data-tool]), .banner button"
    );

    normalButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            showMessage(
                "This KLYDE AI HUB feature is being prepared."
            );

        });

    });


    /* =========================
       MESSAGE / TOAST
    ========================= */

    function showMessage(message) {

        let toast = document.getElementById("toast");

        if (!toast) {

            toast = document.createElement("div");

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
