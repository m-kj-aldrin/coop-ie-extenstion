

// Wait for Alpine.js to be available
function waitForAlpine() {
    return new Promise((resolve) => {
        if (window.Alpine) {
            resolve(window.Alpine);
        } else {
            document.addEventListener("alpine:init", () =>
                resolve(window.Alpine)
            );
        }
    });
}

/**
 * Sends a message to the parent window which will relay it to the background script
 * @param {Object} message - The message to send
 * @returns {Promise<any>}
 */
function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        window.parent.postMessage(
            { type: "backgroundRequest", data: message },
            "*"
        );

        function handleResponse(event) {
            if (event.data.type === "backgroundResponse") {
                window.removeEventListener("message", handleResponse);
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.data);
                }
            }
        }

        window.addEventListener("message", handleResponse);
    });
}

// Initialize Alpine component
waitForAlpine().then(() => {
    window.Alpine.data("crmTool", () => ({
        entityType: "contact",
        searchValue: "",
        status: "",
        results: [],

        getKey(result) {
            return this.entityType === "contact"
                ? result.coop_external_customer_id
                : result.ticketnumber;
        },

        async makeRequest() {
            if (!this.searchValue.trim()) {
                this.status =
                    this.entityType === "contact"
                        ? "Please enter an MMID"
                        : "Please enter a Ticket Number";
                return;
            }

            this.status = "Making request...";
            this.results = [];

            try {
                const response = await sendMessageToBackground({
                    action: "makeCRMRequest",
                    entityType: this.entityType,
                    searchValue: this.searchValue.trim(),
                });

                if (response.error) {
                    this.status = `Error: ${response.error}`;
                } else {
                    this.status = "Request successful!";
                    this.results = response.data?.value || [];
                }
            } catch (error) {
                this.status = `Error: ${error.message}`;
            }
        },
    }));
});
