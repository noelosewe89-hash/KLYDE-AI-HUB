// KLYDE AI HUB
// Phase 1 interactive foundation

document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       SEARCH
    ========================= */

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const result = document.getElementById("result");

    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const query = searchInput.value.trim();

            if (query === "") {
                result.textContent = "Type something to search.";
                return;
            }

            
result.textContent = "KLYDE AI is thinking...";

try {
    const response = await fetch("/api/Chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: query
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    result.textContent = data.reply;

} catch (error) {
    result.textContent = "KLYDE AI error: " + error.message;
}

        });
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
       MESSAGE
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
