/**
 * Sprite Picker - Popup Script
 * Shows editor connection status and quick actions.
 */
(function () {
  "use strict";

  const statusEl = document.getElementById("editorStatus");
  const injectBtn = document.getElementById("injectBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  async function checkConnection() {
    statusEl.textContent = "Checking editor connection...";
    statusEl.className = "status disconnected";

    try {
      const resp = await chrome.runtime.sendMessage({ type: "PING_EDITOR" });
      if (resp.connected) {
        statusEl.textContent = "Level Editor connected (tab " + resp.tabId + ")";
        statusEl.className = "status connected";
      } else {
        statusEl.textContent = "Level Editor not found. Open level-editor.html on localhost.";
        statusEl.className = "status disconnected";
      }
    } catch (err) {
      statusEl.textContent = "Error: " + err.message;
      statusEl.className = "status disconnected";
    }
  }

  // Inject content scripts on the current active tab (for non-matching sites)
  injectBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["lib/sprite-detect.js", "content/content.js"],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content/content.css"],
      });
      statusEl.textContent = "Picker injected on current tab!";
      statusEl.className = "status connected";
    } catch (err) {
      statusEl.textContent = "Injection failed: " + err.message;
      statusEl.className = "status disconnected";
    }
  });

  refreshBtn.addEventListener("click", checkConnection);

  checkConnection();
})();
