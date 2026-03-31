/**
 * Sprite Picker - Level Editor Bridge
 * Content script injected on localhost level-editor.html.
 * Relays messages between the extension and the page's JS context.
 */
(function () {
  "use strict";

  // Listen for messages from the extension (service worker / popup)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "SPRITE_PICKER_INJECT") {
      // Forward sprite data to page context via postMessage
      window.postMessage(
        {
          source: "sprite-picker-bridge",
          type: "SPRITE_PICKER_INJECT",
          sprites: msg.sprites,
          atlas: msg.atlas,
          mode: msg.mode,
          frameName: msg.frameName,
        },
        "*"
      );
      sendResponse({ success: true });
      return true;
    }

    if (msg.type === "GET_ATLAS_FRAMES") {
      // Request frame list from the page
      const requestId = "sp-" + Date.now();
      window.postMessage(
        {
          source: "sprite-picker-bridge",
          type: "GET_ATLAS_FRAMES",
          requestId: requestId,
        },
        "*"
      );

      // Listen for the response from the page
      const handler = (ev) => {
        if (
          ev.data &&
          ev.data.source === "sprite-picker-page" &&
          ev.data.type === "ATLAS_FRAMES_RESPONSE" &&
          ev.data.requestId === requestId
        ) {
          window.removeEventListener("message", handler);
          sendResponse({ frames: ev.data.frames, atlas: ev.data.atlas });
        }
      };
      window.addEventListener("message", handler);

      // Timeout after 3 seconds
      setTimeout(() => {
        window.removeEventListener("message", handler);
        sendResponse({ error: "Timeout waiting for atlas frames" });
      }, 3000);

      return true; // async response
    }
  });
})();
