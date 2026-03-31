/**
 * Sprite Picker - Background Service Worker
 * Handles: CORS image proxy, tab messaging, context menus
 */

// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detect-sprites",
    title: "Detect Sprites in This Image",
    contexts: ["image"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-sprites" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "DETECT_IMAGE",
      srcUrl: info.srcUrl,
    });
  }
});

// Message router
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FETCH_IMAGE") {
    fetchImageAsDataURL(msg.url).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true; // async response
  }

  if (msg.type === "SEND_SPRITES") {
    sendSpritesToLevelEditor(msg).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (msg.type === "PING_EDITOR") {
    findLevelEditorTab().then((tab) => {
      sendResponse({ connected: !!tab, tabId: tab?.id || null });
    });
    return true;
  }

  if (msg.type === "GET_ATLAS_FRAMES") {
    getAtlasFramesFromEditor().then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }
});

/** Fetch a cross-origin image and return it as a data URL */
async function fetchImageAsDataURL(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ dataURL: reader.result });
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

/** Find the level editor tab */
async function findLevelEditorTab() {
  const tabs = await chrome.tabs.query({ url: "http://localhost:*/*" });
  return tabs.find((t) => t.url && t.url.includes("level-editor")) || null;
}

/** Send sprites to the level editor via the bridge content script */
async function sendSpritesToLevelEditor(msg) {
  const tab = await findLevelEditorTab();
  if (!tab || !tab.id) throw new Error("Level editor tab not found. Open level-editor.html on localhost first.");

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {
      type: "SPRITE_PICKER_INJECT",
      sprites: msg.sprites,
      atlas: msg.atlas,
      mode: msg.mode,
      frameName: msg.frameName,
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

/** Ask the level editor for its current atlas frame list */
async function getAtlasFramesFromEditor() {
  const tab = await findLevelEditorTab();
  if (!tab || !tab.id) throw new Error("Level editor not found");

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_ATLAS_FRAMES" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || { frames: [] });
      }
    });
  });
}
