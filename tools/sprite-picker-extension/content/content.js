/**
 * Sprite Picker - Content Script
 * Injected on sprite resource sites. Provides:
 * 1. Pick mode toggle to select images for detection
 * 2. Overlay canvas with sprite bounding boxes
 * 3. Selection panel to review and send sprites to level editor
 */
(function () {
  "use strict";

  let pickMode = false;
  let overlayContainer = null;
  let overlayCanvas = null;
  let overlayCtx = null;
  let sourceCanvas = null; // offscreen canvas with the loaded image
  let detected = [];
  let selected = new Set();
  let detectionResult = null; // { bgColor, tolerance, usedKeyOut }
  let panelEl = null;
  let toggleBtn = null;
  let targetImg = null;
  let processing = false;

  // ==================== Toggle Button ====================

  function createToggleButton() {
    toggleBtn = document.createElement("button");
    toggleBtn.className = "sp-toggle-btn";
    toggleBtn.textContent = "\u2295"; // crosshair circle
    toggleBtn.title = "Sprite Picker: Click to enter pick mode";
    toggleBtn.addEventListener("click", () => {
      pickMode = !pickMode;
      toggleBtn.classList.toggle("active", pickMode);
      toggleBtn.title = pickMode
        ? "Sprite Picker: Click an image to detect sprites"
        : "Sprite Picker: Click to enter pick mode";
      document.body.classList.toggle("sp-pick-mode", pickMode);
      if (!pickMode) clearHighlights();
    });
    document.body.appendChild(toggleBtn);
  }

  // ==================== Image Hover Highlighting ====================

  let lastHovered = null;

  document.addEventListener(
    "mouseover",
    (ev) => {
      if (!pickMode) return;
      const img = ev.target.closest("img");
      if (img && img.naturalWidth > 64 && img.naturalHeight > 64) {
        if (lastHovered && lastHovered !== img)
          lastHovered.classList.remove("sp-img-highlight");
        img.classList.add("sp-img-highlight");
        lastHovered = img;
      }
    },
    true
  );

  document.addEventListener(
    "mouseout",
    (ev) => {
      if (!pickMode) return;
      const img = ev.target.closest("img");
      if (img) img.classList.remove("sp-img-highlight");
    },
    true
  );

  function clearHighlights() {
    document.querySelectorAll(".sp-img-highlight").forEach((el) => {
      el.classList.remove("sp-img-highlight");
    });
  }

  // ==================== Image Click -> Detection ====================

  document.addEventListener(
    "click",
    (ev) => {
      if (!pickMode || processing) return;
      const img = ev.target.closest("img");
      if (!img || img.naturalWidth <= 64 || img.naturalHeight <= 64) return;

      ev.preventDefault();
      ev.stopPropagation();
      detectOnImage(img);
    },
    true
  );

  // Listen for context menu "Detect Sprites in This Image"
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "DETECT_IMAGE" && msg.srcUrl) {
      const imgs = document.querySelectorAll("img");
      for (const img of imgs) {
        if (img.src === msg.srcUrl || img.currentSrc === msg.srcUrl) {
          detectOnImage(img);
          return;
        }
      }
      // Image not found as <img> -- try fetching directly
      detectOnUrl(msg.srcUrl);
    }
  });

  async function detectOnImage(img) {
    processing = true;
    targetImg = img;
    clearOverlay();
    showPanel();
    setPanelStatus("loading", "Fetching image...");

    try {
      // Use the service worker to fetch the image (bypasses CORS)
      const resp = await chrome.runtime.sendMessage({
        type: "FETCH_IMAGE",
        url: img.src || img.currentSrc,
      });

      if (resp.error) throw new Error(resp.error);
      await runDetection(resp.dataURL, img);
    } catch (err) {
      setPanelStatus("error", "Detection failed: " + err.message);
    } finally {
      processing = false;
    }
  }

  async function detectOnUrl(url) {
    processing = true;
    targetImg = null;
    clearOverlay();
    showPanel();
    setPanelStatus("loading", "Fetching image...");

    try {
      const resp = await chrome.runtime.sendMessage({
        type: "FETCH_IMAGE",
        url: url,
      });
      if (resp.error) throw new Error(resp.error);
      await runDetection(resp.dataURL, null);
    } catch (err) {
      setPanelStatus("error", "Detection failed: " + err.message);
    } finally {
      processing = false;
    }
  }

  async function runDetection(dataURL, img) {
    setPanelStatus("loading", "Running sprite detection...");

    // Load the image
    const loadedImg = new Image();
    loadedImg.src = dataURL;
    await new Promise((resolve, reject) => {
      loadedImg.onload = resolve;
      loadedImg.onerror = reject;
    });

    const w = loadedImg.naturalWidth;
    const h = loadedImg.naturalHeight;

    // Draw to offscreen canvas
    sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = w;
    sourceCanvas.height = h;
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(loadedImg, 0, 0);

    // Run detection
    const result = window.SpriteDetect.smartDetectSprites(ctx, w, h);
    detected = result.sprites;
    detectionResult = result;
    selected = new Set();

    if (detected.length === 0) {
      setPanelStatus("info", "No sprites detected in this image.");
      return;
    }

    // Create overlay on the image
    if (img) {
      createOverlay(img, w, h);
    }

    drawOverlay();
    updatePanel();
    setPanelStatus(
      "info",
      `Detected ${detected.length} sprites. Click to select.`
    );
  }

  // ==================== Overlay ====================

  function createOverlay(img, naturalW, naturalH) {
    clearOverlay();

    const rect = img.getBoundingClientRect();
    overlayContainer = document.createElement("div");
    overlayContainer.className = "sp-overlay-container";

    // Position overlay exactly over the image
    overlayContainer.style.left = rect.left + window.scrollX + "px";
    overlayContainer.style.top = rect.top + window.scrollY + "px";
    overlayContainer.style.width = rect.width + "px";
    overlayContainer.style.height = rect.height + "px";

    overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = naturalW;
    overlayCanvas.height = naturalH;
    overlayCanvas.style.width = rect.width + "px";
    overlayCanvas.style.height = rect.height + "px";
    overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.imageSmoothingEnabled = false;

    overlayCanvas.addEventListener("click", onOverlayClick);

    overlayContainer.appendChild(overlayCanvas);
    document.body.appendChild(overlayContainer);

    // Reposition on scroll/resize
    const reposition = () => {
      if (!overlayContainer || !img.isConnected) return;
      const r = img.getBoundingClientRect();
      overlayContainer.style.left = r.left + window.scrollX + "px";
      overlayContainer.style.top = r.top + window.scrollY + "px";
      overlayContainer.style.width = r.width + "px";
      overlayContainer.style.height = r.height + "px";
      overlayCanvas.style.width = r.width + "px";
      overlayCanvas.style.height = r.height + "px";
    };
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });
    overlayContainer._cleanup = () => {
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }

  function clearOverlay() {
    if (overlayContainer) {
      if (overlayContainer._cleanup) overlayContainer._cleanup();
      overlayContainer.remove();
      overlayContainer = null;
      overlayCanvas = null;
      overlayCtx = null;
    }
  }

  function onOverlayClick(ev) {
    if (!overlayCanvas || !detected.length) return;
    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width / rect.width;
    const scaleY = overlayCanvas.height / rect.height;
    const x = Math.floor((ev.clientX - rect.left) * scaleX);
    const y = Math.floor((ev.clientY - rect.top) * scaleY);

    const idx = detected.findIndex(
      (s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h
    );

    if (idx >= 0) {
      if (selected.has(idx)) selected.delete(idx);
      else selected.add(idx);
      drawOverlay();
      updatePanel();
    }
  }

  function drawOverlay() {
    if (!overlayCtx || !overlayCanvas) return;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.lineWidth = 1;

    for (let i = 0; i < detected.length; i++) {
      const s = detected[i];
      overlayCtx.strokeStyle = selected.has(i)
        ? "rgba(0,200,0,0.9)"
        : "rgba(255,0,0,0.85)";
      overlayCtx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    }
  }

  // ==================== Selection Panel ====================

  function showPanel() {
    if (panelEl) return;
    panelEl = document.createElement("div");
    panelEl.className = "sp-panel";
    panelEl.innerHTML = `
      <div class="sp-panel-header">
        <span>Sprite Picker</span>
        <button class="sp-panel-close" title="Close">&times;</button>
      </div>
      <div class="sp-thumbs"></div>
      <div class="sp-field">
        <label>Target Atlas</label>
        <select class="sp-atlas-select">
          <option value="game_asset">game_asset</option>
          <option value="game_ui">game_ui</option>
          <option value="title_ui">title_ui</option>
        </select>
      </div>
      <div class="sp-field">
        <label>Mode</label>
        <select class="sp-mode-select">
          <option value="add">Add as new sprites</option>
          <option value="replace">Replace existing frame</option>
        </select>
      </div>
      <div class="sp-field sp-frame-field" style="display:none">
        <label>Frame to replace</label>
        <select class="sp-frame-select">
          <option value="">-- Loading frames --</option>
        </select>
      </div>
      <div style="margin-top:10px">
        <button class="sp-btn sp-btn-primary sp-send-btn">Send to Level Editor</button>
        <button class="sp-btn sp-select-all-btn">Select All</button>
        <button class="sp-btn sp-btn-danger sp-clear-btn">Clear</button>
      </div>
      <div class="sp-status"></div>
    `;

    panelEl.querySelector(".sp-panel-close").addEventListener("click", () => {
      closeAll();
    });

    panelEl.querySelector(".sp-mode-select").addEventListener("change", (ev) => {
      const frameField = panelEl.querySelector(".sp-frame-field");
      frameField.style.display = ev.target.value === "replace" ? "block" : "none";
      if (ev.target.value === "replace") loadFrameList();
    });

    panelEl.querySelector(".sp-atlas-select").addEventListener("change", () => {
      if (panelEl.querySelector(".sp-mode-select").value === "replace") {
        loadFrameList();
      }
    });

    panelEl.querySelector(".sp-send-btn").addEventListener("click", sendToEditor);
    panelEl.querySelector(".sp-select-all-btn").addEventListener("click", () => {
      for (let i = 0; i < detected.length; i++) selected.add(i);
      drawOverlay();
      updatePanel();
    });
    panelEl.querySelector(".sp-clear-btn").addEventListener("click", () => {
      selected.clear();
      drawOverlay();
      updatePanel();
    });

    document.body.appendChild(panelEl);
  }

  function closeAll() {
    clearOverlay();
    if (panelEl) {
      panelEl.remove();
      panelEl = null;
    }
    detected = [];
    selected.clear();
    sourceCanvas = null;
    pickMode = false;
    if (toggleBtn) toggleBtn.classList.remove("active");
    document.body.classList.remove("sp-pick-mode");
  }

  function updatePanel() {
    if (!panelEl) return;
    const thumbsContainer = panelEl.querySelector(".sp-thumbs");
    thumbsContainer.innerHTML = "";

    if (!selected.size) {
      thumbsContainer.innerHTML =
        '<span style="color:#888;font-size:12px">No sprites selected</span>';
      return;
    }

    const sortedIndices = [...selected].sort((a, b) => {
      const sa = detected[a];
      const sb = detected[b];
      if (sa.y !== sb.y) return sa.y - sb.y;
      return sa.x - sb.x;
    });

    sortedIndices.forEach((i) => {
      const s = detected[i];
      const c = document.createElement("canvas");
      c.width = s.w;
      c.height = s.h;
      const cctx = c.getContext("2d");
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(sourceCanvas, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);

      const img = document.createElement("img");
      img.src = c.toDataURL("image/png");
      img.className = "sp-thumb selected";
      img.style.width = Math.min(64, s.w * 2) + "px";
      img.style.height = "auto";
      img.title = `${s.w}x${s.h} @ (${s.x},${s.y})`;
      img.addEventListener("click", () => {
        selected.delete(i);
        drawOverlay();
        updatePanel();
      });
      thumbsContainer.appendChild(img);
    });
  }

  function setPanelStatus(type, msg) {
    if (!panelEl) return;
    const el = panelEl.querySelector(".sp-status");
    if (type === "loading") {
      el.innerHTML = `<span class="sp-spinner"></span>${msg}`;
    } else if (type === "error") {
      el.innerHTML = `<span style="color:#f55">${msg}</span>`;
    } else {
      el.textContent = msg;
    }
  }

  // ==================== Frame List from Editor ====================

  async function loadFrameList() {
    if (!panelEl) return;
    const frameSelect = panelEl.querySelector(".sp-frame-select");
    frameSelect.innerHTML = '<option value="">-- Loading... --</option>';

    try {
      const resp = await chrome.runtime.sendMessage({ type: "GET_ATLAS_FRAMES" });
      if (resp.error) throw new Error(resp.error);

      const frames = resp.frames || [];
      frameSelect.innerHTML = "";
      if (!frames.length) {
        frameSelect.innerHTML =
          '<option value="">-- No frames found --</option>';
        return;
      }
      frames.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        frameSelect.appendChild(opt);
      });
    } catch (err) {
      frameSelect.innerHTML = `<option value="">-- Error: ${err.message} --</option>`;
    }
  }

  // ==================== Send to Level Editor ====================

  async function sendToEditor() {
    if (!selected.size || !sourceCanvas) {
      setPanelStatus("error", "No sprites selected");
      return;
    }

    const atlas = panelEl.querySelector(".sp-atlas-select").value;
    const mode = panelEl.querySelector(".sp-mode-select").value;
    const frameName =
      mode === "replace"
        ? panelEl.querySelector(".sp-frame-select").value
        : null;

    if (mode === "replace" && !frameName) {
      setPanelStatus("error", "Select a frame to replace");
      return;
    }

    setPanelStatus("loading", "Sending to Level Editor...");

    // Extract selected sprites as data URLs
    const selectedBoxes = [...selected]
      .sort((a, b) => {
        const sa = detected[a];
        const sb = detected[b];
        if (sa.y !== sb.y) return sa.y - sb.y;
        return sa.x - sb.x;
      })
      .map((i) => detected[i]);

    const opts = detectionResult?.usedKeyOut
      ? {
          bgColor: detectionResult.bgColor,
          tolerance: detectionResult.tolerance,
        }
      : {};

    const dataURLs = window.SpriteDetect.extractSpriteDataURLs(
      sourceCanvas,
      selectedBoxes,
      opts
    );

    const sprites = Object.entries(dataURLs).map(([key, dataURL], idx) => ({
      name: key,
      dataURL: dataURL,
      w: selectedBoxes[idx].w,
      h: selectedBoxes[idx].h,
    }));

    try {
      const resp = await chrome.runtime.sendMessage({
        type: "SEND_SPRITES",
        sprites,
        atlas,
        mode,
        frameName,
      });

      if (resp.error) throw new Error(resp.error);
      setPanelStatus(
        "info",
        `Sent ${sprites.length} sprite(s) to Atlas Manager.`
      );
    } catch (err) {
      setPanelStatus("error", "Send failed: " + err.message);
    }
  }

  // ==================== Init ====================

  createToggleButton();
})();
