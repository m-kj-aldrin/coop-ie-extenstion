/// <reference path="./types.js" />

// Handle messages from the sandbox iframe
window.addEventListener('message', async (event) => {
    if (event.data.type === 'backgroundRequest') {
        try {
            const response = await chrome.runtime.sendMessage(event.data.data);
            event.source.postMessage({
                type: 'backgroundResponse',
                data: response
            }, '*');
        } catch (error) {
            event.source.postMessage({
                type: 'backgroundResponse',
                error: error.message
            }, '*');
        }
    }
});