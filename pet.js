const defaultTags = ["默认", "Project：X", "毛茸茸骑士", "公司工作", "个人创作", "会议沟通", "资料整理", "功能测试"];
const kojiConfig = window.KojiConfig;
const stateOrder = kojiConfig.stateOrder;
const petStates = kojiConfig.petStates;
const defaultPetSettings = { kojiTone: "standard", hourlyChimeEnabled: false, currentCharacter: "koji", currentSkin: "default", lastHourlyChimeKey: "" };

const $ = (selector) => document.querySelector(selector);
let petTimer = null;
let clickTimer = null;
let dragInfo = null;
let suppressClickUntil = 0;
let currentStateKey = "idle";
let quickRecordVisible = false;
let petSettings = loadPetSettings();
let hourlyTimer = null;

function assetCandidates(state) {
  const candidates = [...kojiConfig.getAssetCandidates(state.key, petSettings.currentCharacter, petSettings.currentSkin)];
  if (state.key !== "idle") candidates.push(...kojiConfig.getAssetCandidates("idle", petSettings.currentCharacter, petSettings.currentSkin));
  return candidates;
}

function renderFace(state) {
  const face = $("#petFace");
  const candidates = assetCandidates(state);
  let index = 0;
  const tryNext = () => {
    if (index >= candidates.length) {
      face.innerHTML = "";
      face.textContent = state.emoji;
      return;
    }
    const img = new Image();
    img.alt = state.label;
    img.onload = () => {
      face.innerHTML = "";
      face.appendChild(img);
    };
    img.onerror = () => {
      index += 1;
      tryNext();
    };
    img.src = candidates[index];
  };
  tryNext();
}

function setBubble(message) {
  $("#petBubble").textContent = message;
}

function setPetState(stateKey, overrideDuration) {
  const state = petStates[stateKey] || petStates.idle;
  currentStateKey = state.key;
  const shell = $("#petShell");

  clearTimeout(petTimer);
  shell.className = `pet-shell ${state.cssClass}`;
  setBubble(kojiConfig.getDialogue(state.key, petSettings.kojiTone, state.message));
  $("#petLabel").textContent = state.label;
  renderFace(state);

  const duration = typeof overrideDuration === "number" ? overrideDuration : state.duration;
  if (duration > 0 && state.key !== "idle") {
    petTimer = setTimeout(() => setPetState("idle"), duration);
  }
}

function sendPetState(state) {
  setPetState(state);
  window.kojiDesktop?.setPetState?.(state);
}

function loadPetSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("kojiReportPet.settings") || "{}");
    return {
      ...defaultPetSettings,
      ...stored,
      kojiTone: kojiConfig.normalizeTone(stored.kojiTone),
      hourlyChimeEnabled: Boolean(stored.hourlyChimeEnabled),
      currentCharacter: stored.currentCharacter || "koji",
      currentSkin: stored.currentSkin || "default",
      lastHourlyChimeKey: stored.lastHourlyChimeKey || "",
    };
  } catch (error) {
    return { ...defaultPetSettings };
  }
}

function savePetSettings() {
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem("kojiReportPet.settings") || "{}"); } catch (error) { return {}; }
  })();
  localStorage.setItem("kojiReportPet.settings", JSON.stringify({ ...stored, ...petSettings }));
}

function applyPetSettings(nextSettings = {}) {
  petSettings = {
    ...petSettings,
    ...nextSettings,
    kojiTone: kojiConfig.normalizeTone(nextSettings.kojiTone || petSettings.kojiTone),
    hourlyChimeEnabled: Object.prototype.hasOwnProperty.call(nextSettings, "hourlyChimeEnabled")
      ? Boolean(nextSettings.hourlyChimeEnabled)
      : petSettings.hourlyChimeEnabled,
    currentCharacter: nextSettings.currentCharacter || petSettings.currentCharacter || "koji",
    currentSkin: nextSettings.currentSkin || petSettings.currentSkin || "default",
    lastHourlyChimeKey: nextSettings.lastHourlyChimeKey || petSettings.lastHourlyChimeKey || "",
  };
  if (currentStateKey) setPetState(currentStateKey, currentStateKey === "idle" ? 0 : undefined);
}

function getChimeState(hour) {
  if (hour >= 23 || hour <= 5) return "sleep";
  if (hour === 12) return "happy";
  if (hour >= 17 && hour <= 19) return "angry";
  return "wave";
}

function checkHourlyChime() {
  if (!petSettings.hourlyChimeEnabled || petSettings.kojiTone === "quiet") return;
  const now = new Date();
  if (now.getMinutes() !== 0) return;
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}`;
  if (petSettings.lastHourlyChimeKey === key) return;
  petSettings.lastHourlyChimeKey = key;
  savePetSettings();
  if (quickRecordVisible) return;
  const state = petStates[getChimeState(now.getHours())] || petStates.wave;
  clearTimeout(petTimer);
  currentStateKey = state.key;
  $("#petShell").className = `pet-shell ${state.cssClass}`;
  setBubble(kojiConfig.getHourlyLine(now.getHours(), petSettings.kojiTone));
  $("#petLabel").textContent = `${state.label} · 整点报时`;
  renderFace(state);
  petTimer = setTimeout(() => setPetState("idle"), 7000);
}

function setupHourlyChime() {
  clearInterval(hourlyTimer);
  checkHourlyChime();
  hourlyTimer = setInterval(checkHourlyChime, 30000);
}

function loadTags() {
  let customTags = [];
  try {
    const settings = JSON.parse(localStorage.getItem("kojiReportPet.settings") || "{}");
    customTags = Array.isArray(settings.customTags) ? settings.customTags : [];
  } catch (error) {
    customTags = [];
  }
  const tags = [...new Set([...defaultTags, ...customTags])].filter(Boolean);
  $("#quickRecordTag").innerHTML = tags.map((tag) => `<option value="${tag.replace(/"/g, "&quot;")}" ${tag === "公司工作" ? "selected" : ""}>${tag}</option>`).join("");
}

function showQuickRecord() {
  clearTimeout(clickTimer);
  if (dragInfo?.moved || Date.now() < suppressClickUntil) return;

  quickRecordVisible = true;
  loadTags();
  sendPetState("record_ready");
  window.kojiDesktop?.setPetWindowMode?.("quickInput");

  const panel = $("#quickRecordForm");
  panel.hidden = false;
  requestAnimationFrame(() => $("#quickRecordText").focus());
}

function hideQuickRecord(nextState = "idle") {
  clearTimeout(clickTimer);
  quickRecordVisible = false;
  $("#quickRecordForm").hidden = true;
  $("#quickRecordText").value = "";
  window.kojiDesktop?.setPetWindowMode?.("compact");
  sendPetState(nextState);
}

async function submitQuickRecord() {
  const text = $("#quickRecordText").value.trim();
  const tag = $("#quickRecordTag").value || "公司工作";
  if (!text) {
    sendPetState("confused");
    $("#quickRecordText").focus();
    return;
  }

  try {
    const result = await window.kojiDesktop?.submitQuickRecord?.(text, tag);
    if (result && result.ok === false) throw new Error(result.message || "记录失败");
    quickRecordVisible = false;
    $("#quickRecordForm").hidden = true;
    $("#quickRecordText").value = "";
    window.kojiDesktop?.setPetWindowMode?.("compact");
    sendPetState("collect");
  } catch (error) {
    console.error(error);
    sendPetState("error");
  }
}

function handleSingleClick() {
  if (Date.now() < suppressClickUntil || dragInfo?.moved) return;
  showQuickRecord();
}

function handleDoubleClick() {
  clearTimeout(clickTimer);
  suppressClickUntil = Date.now() + 320;
  if (quickRecordVisible) {
    hideQuickRecord("wave");
  } else {
    sendPetState("wave");
  }
  window.kojiDesktop?.showMainWindow?.();
}

function bindManualDrag() {
  const body = $("#petBody");
  body.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragInfo = { x: event.screenX, y: event.screenY, lastX: event.screenX, lastY: event.screenY, moved: false };
    body.setPointerCapture(event.pointerId);
  });

  body.addEventListener("pointermove", (event) => {
    if (!dragInfo) return;
    const totalX = event.screenX - dragInfo.x;
    const totalY = event.screenY - dragInfo.y;
    if (!dragInfo.moved && Math.hypot(totalX, totalY) < 5) return;
    dragInfo.moved = true;
    if (currentStateKey !== "drag") setPetState("drag", 0);
    const deltaX = event.screenX - dragInfo.lastX;
    const deltaY = event.screenY - dragInfo.lastY;
    dragInfo.lastX = event.screenX;
    dragInfo.lastY = event.screenY;
    window.kojiDesktop?.movePetWindow?.(deltaX, deltaY);
  });

  const finishDrag = () => {
    if (!dragInfo) return;
    const wasDragging = dragInfo.moved;
    dragInfo = null;
    if (wasDragging) {
      suppressClickUntil = Date.now() + 260;
      setPetState(quickRecordVisible ? "record_ready" : "idle");
    }
  };
  body.addEventListener("pointerup", finishDrag);
  body.addEventListener("pointercancel", finishDrag);
}

function bindPetEvents() {
  const body = $("#petBody");
  body.addEventListener("mouseenter", () => currentStateKey === "idle" && setPetState("wave"));
  body.addEventListener("click", (event) => {
    if (event.button !== 0 || Date.now() < suppressClickUntil || dragInfo?.moved) return;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(handleSingleClick, 220);
  });
  body.addEventListener("dblclick", handleDoubleClick);

  $("#quickRecordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuickRecord();
  });
  $("#quickRecordText").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuickRecord();
    }
  });
  $("#quickCancelBtn").addEventListener("click", () => hideQuickRecord("idle"));
  $("#quickOpenBtn").addEventListener("click", () => {
    hideQuickRecord("wave");
    window.kojiDesktop?.showMainWindow?.();
  });

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    clearTimeout(clickTimer);
    suppressClickUntil = Date.now() + 260;
    window.kojiDesktop?.showPetContextMenu?.();
  });

  window.kojiDesktop?.onPetStateChanged?.((state) => setPetState(state));
  window.kojiDesktop?.onPetCommand?.((command) => {
    if (command === "quick-record") showQuickRecord();
  });
  window.kojiDesktop?.onSettingsChanged?.((nextSettings) => {
    applyPetSettings(nextSettings);
    setupHourlyChime();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "kojiReportPet.settings") {
      applyPetSettings(loadPetSettings());
      setupHourlyChime();
    }
  });
  bindManualDrag();
}

function init() {
  stateOrder.forEach((stateKey) => {
    if (!petStates[stateKey]) console.warn(`缺少 Koji 状态：${stateKey}`);
  });
  bindPetEvents();
  petSettings = loadPetSettings();
  loadTags();
  window.kojiDesktop?.setPetWindowMode?.("compact");
  setPetState("idle");
  setupHourlyChime();
}

document.addEventListener("DOMContentLoaded", init);
