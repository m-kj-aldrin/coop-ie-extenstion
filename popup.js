/**
 * Creates a formatted display of entity data
 * @param {import('./background').Contact | import('./background').Incident} data
 * @returns {HTMLDivElement}
 */
function createEntityDisplay(data) {
    const container = document.createElement("div");
    container.className = "entity-data";

    // Display different fields based on the entity type
    if ("fullname" in data) {
        // It's a Contact
        container.innerHTML = `
            <div class="field">
                <label>Name:</label>
                <span>${data.fullname || "N/A"}</span>
            </div>
            <div class="field">
                <label>Email:</label>
                <span>${data.emailaddress1 || "N/A"}</span>
            </div>
            <div class="field">
                <label>Customer ID:</label>
                <span>${data.coop_external_customer_id || "N/A"}</span>
            </div>
            <div class="field">
                <label>Personal Number:</label>
                <span>${data.coop_personalnumber || "N/A"}</span>
            </div>
        `;
    } else {
        // It's an Incident
        container.innerHTML = `
            <div class="field">
                <label>Title:</label>
                <span>${data.title || "N/A"}</span>
            </div>
            <div class="field">
                <label>Description:</label>
                <span>${data.description || "N/A"}</span>
            </div>
            <div class="field">
                <label>Ticket Number:</label>
                <span>${data.ticketnumber || "N/A"}</span>
            </div>
            <div class="field">
                <label>Case Origin:</label>
                <span>${data.caseorigincode || "N/A"}</span>
            </div>
        `;
    }

    return container;
}

document.getElementById("makeRequest").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const resultsContainer = document.getElementById("results");
    const mmid = document.getElementById("mmid").value.trim();
    
    if (!mmid) {
        status.textContent = "Please enter an MMID";
        return;
    }

    status.textContent = "Making request...";
    resultsContainer.innerHTML = "";

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const response = await chrome.runtime.sendMessage({
            action: "makeCRMRequest",
            mmid: mmid
        });

        if (response.error) {
            status.textContent = `Error: ${response.error}`;
        } else {
            status.textContent = "Request successful!";

            // Display the data
            if (response.data?.value?.length > 0) {
                response.data.value.forEach((item) => {
                    resultsContainer.appendChild(createEntityDisplay(item));
                });
            } else {
                resultsContainer.textContent = "No data found";
            }
        }
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
    }
});
