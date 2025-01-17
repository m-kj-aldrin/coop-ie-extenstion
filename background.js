/// <reference path="./types.js" />

console.log("Background script loaded");

/** @type {Record<string, EntityConfig>} */
const ENTITY_CONFIGS = {
    contacts: {
        select: {
            fullname: true,
            emailaddress1: true,
            coop_external_customer_id: true,
            coop_personalnumber: true,
        },
        defaultFilter: "coop_external_customer_id ne null",
    },
    incidents: {
        select: {
            title: true,
            description: true,
            ticketnumber: true,
            caseorigincode: true,
        },
        defaultFilter: "statecode eq 0",
    },
};

/**
 * @template {keyof typeof ENTITY_CONFIGS} T
 * @typedef {Object} Options
 * @property {Partial<(typeof ENTITY_CONFIGS)[T]["select"]>} [select]
 * @property {string} [filter]
 * @property {number} [top]
 */

/**
 * @template T
 * @typedef {Object} CRMResponse
 * @property {T[]} value
 */

/**
 * @typedef {Object} EntityTypeMap
 * @property {Contact} contacts
 * @property {Incident} incidents
 */

/**
 * Creates an OData request for a CRM query
 * @template {keyof typeof ENTITY_CONFIGS} T
 * @param {T} entity - The entity to query
 * @param {Options<T>} [options]
 * @param {string} cookie - The CrmOwinAuth cookie value
 * @returns {Promise<CRMResponse<EntityTypeMap[T]>>}
 */
async function create_odata_request(entity, cookie, options = {}) {
    const config = ENTITY_CONFIGS[entity];
    if (!config) {
        throw new Error(`Unsupported entity: ${entity}`);
    }

    const selectFields = options.select || config.select;
    const select = Object.keys(selectFields).join(",");
    const filter = options.filter || config.defaultFilter;
    const top = options.top || 1;

    const query = `${entity}?$select=${select}&$filter=${filter}&$top=${top}`;
    console.log("Making OData request:", query);

    const response = await fetch(
        `https://coopcrmprod.crm4.dynamics.com/api/data/v9.0/${query}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Cookie: `CrmOwinAuth=${cookie}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

/**
 * Makes an authenticated request to the CRM API
 * @param {string} cookie - The CrmOwinAuth cookie value
 * @param {string} entityType - The type of entity to search for ('contact' or 'incident')
 * @param {string} searchValue - The value to search for (MMID or ticket number)
 * @returns {Promise<CRMResponse<Contact | Incident>>}
 */
async function makeCRMRequest(cookie, entityType, searchValue) {
    console.log("Making CRM request with cookie:", cookie);
    try {
        const entity = entityType === "contact" ? "contacts" : "incidents";
        const filter =
            entityType === "contact"
                ? `coop_external_customer_id eq '${searchValue}'`
                : `ticketnumber eq '${searchValue}'`;

        const response = await create_odata_request(entity, cookie, {
            filter,
            top: 1,
        });
        console.log("CRM Response:", response);
        return response;
    } catch (error) {
        console.error("Error making CRM request:", error);
        throw error;
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "makeCRMRequest") {
        (async () => {
            try {
                const cookies = await chrome.cookies.get({
                    url: "https://coopcrmprod.crm4.dynamics.com",
                    name: "CrmOwinAuth",
                });

                if (cookies) {
                    const data = await makeCRMRequest(
                        cookies.value,
                        message.entityType,
                        message.searchValue
                    );
                    sendResponse({ data });
                } else {
                    sendResponse({ error: "No CrmOwinAuth cookie found" });
                }
            } catch (error) {
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }
});

// Listen for extension icon clicks

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: "crm-tool.html",
    });
});
