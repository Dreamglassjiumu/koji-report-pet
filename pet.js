const defaultTags = ["默认", "Project：X", "公司工作", "pitch创作", "物件包装", "玩法包装", "资料整理", "会议总结", "剧本创作", "角色包装", "文档处理"];
const kojiConfig = window.KojiConfig;
const stateOrder = kojiConfig.stateOrder;
const petStates = kojiConfig.petStates;
const defaultPetSettings = { kojiTone: "default", dialogueTone: "default", hourlyChimeEnabled: false, currentCharacter: "koji", currentSkin: "default", lastHourlyChimeKey: "", kojiMotionLevel: "normal" };

const $ = (selector) => document.querySelector(selector);
let petTimer = null;
let clickTimer = null;
let dragInfo = null;
let dragReturnStateKey = "idle";
let suppressClickUntil = 0;
let currentStateKey = "idle";
let quickRecordVisible = false;
let petSettings = loadPetSettings();
let hourlyTimer = null;
let faceRenderId = 0;

function assetCandidates(state) {
  const candidates = [...kojiConfig.getAssetCandidates(state.key, petSettings.currentCharacter, petSettings.currentSkin)];
  if (state.key !== "idle") candidates.push(...kojiConfig.getAssetCandidates("idle", petSettings.currentCharacter, petSettings.currentSkin));
  return candidates;
}

function setVisualMode(mode) {
  const body = $("#petBody");
  body.classList.toggle("is-image-mode", mode === "image");
  body.classList.toggle("is-emoji-mode", mode === "emoji");
}

function renderFace(state) {
  const face = $("#petFace");
  const candidates = assetCandidates(state);
  const renderId = ++faceRenderId;
  let index = 0;

  setVisualMode("image");

  const tryNext = () => {
    if (renderId !== faceRenderId) return;
    if (index >= candidates.length) {
      face.innerHTML = "";
      face.textContent = state.emoji;
      setVisualMode("emoji");
      return;
    }
    const img = new Image();
    img.alt = state.label;
    img.onload = () => {
      if (renderId !== faceRenderId) return;
      face.innerHTML = "";
      face.appendChild(img);
      setVisualMode("image");
    };
    img.onerror = () => {
      if (renderId !== faceRenderId) return;
      index += 1;
      tryNext();
    };
    img.src = candidates[index];
  };
  tryNext();
}

function pickRandom(list) {
  return kojiConfig.pickRandom?.(list) || (Array.isArray(list) && list.length ? list[Math.floor(Math.random() * list.length)] : "");
}

function getCurrentTone() {
  return "default";
}

function maybePickMemeLine(stateKey) {
  const memeStates = new Set(["wave", "collect", "happy", "angry", "writing", "idle"]);
  if (!memeStates.has(stateKey)) return null;
  if (Math.random() > 0.1) return null;
  return pickRandom(kojiConfig.memeSafePool || window.KOJI_MEME_SAFE_POOL || []);
}

function getDialogueForState(stateKey) {
  const memeLine = maybePickMemeLine(stateKey);
  if (memeLine) return memeLine;
  const pool = kojiConfig.getDialoguePool?.(stateKey)
    || window.KOJI_DIALOGUES?.[stateKey]
    || window.KOJI_DIALOGUES?.default?.[stateKey]
    || [];
  const state = petStates[stateKey] || petStates.idle;
  return pickRandom(pool) || state.message || "Koji 在。";
}

function getHourlyDialogue(hour) {
  const hourKey = String(hour).padStart(2, "0");
  const pool = kojiConfig.getHourlyPool?.(hour)
    || window.KOJI_HOURLY_DIALOGUES?.[hourKey]
    || window.KOJI_HOURLY_DIALOGUES?.default?.[hourKey]
    || [];
  return pickRandom(pool) || `现在是 ${Number(hour)} 点，Koji 提醒你记一下今日素材。`;
}

function truncatePetMessage(message) {
  const text = String(message || "Koji 在。").trim();
  const maxLength = 58;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function setPetMessage(message) {
  const bubble = $("#petBubble");
  if (bubble) bubble.textContent = truncatePetMessage(message);
}

function setBubble(message) {
  setPetMessage(message);
}

function getMotionLevel() {
  const level = petSettings.kojiMotionLevel || (petSettings.animationsEnabled === false ? "off" : "normal");
  return ["off", "subtle", "normal", "lively"].includes(level) ? level : "normal";
}

function clearPetAnimationState() {
  const shell = $("#petShell");
  if (!shell) return;
  Object.keys(petStates).forEach((key) => shell.classList.remove(`state-${key.replace(/_/g, "-")}`));
}

function applyPetAnimationState(stateKey) {
  const shell = $("#petShell");
  if (!shell) return;
  clearPetAnimationState();
  shell.classList.add(`state-${stateKey.replace(/_/g, "-")}`);
}

function applyMotionLevel(level = getMotionLevel()) {
  const shell = $("#petShell");
  if (!shell) return;
  ["off", "subtle", "normal", "lively"].forEach((motionLevel) => shell.classList.remove(`motion-${motionLevel}`));
  shell.classList.add(`motion-${["off", "subtle", "normal", "lively"].includes(level) ? level : "normal"}`);
}

function syncMotionSettings(settings = {}) {
  const nextLevel = settings.kojiMotionLevel || (settings.animationsEnabled === false ? "off" : petSettings.kojiMotionLevel || "normal");
  petSettings.kojiMotionLevel = ["off", "subtle", "normal", "lively"].includes(nextLevel) ? nextLevel : "normal";
  petSettings.animationsEnabled = petSettings.kojiMotionLevel !== "off";
  applyMotionLevel(petSettings.kojiMotionLevel);
}

function setPetState(stateKey, options = {}) {
  const normalizedOptions = typeof options === "number" ? { duration: options } : (options || {});
  const state = petStates[stateKey] || petStates.idle;
  currentStateKey = state.key;
  const shell = $("#petShell");

  clearTimeout(petTimer);
  shell.classList.add("pet-shell");
  Object.values(petStates).forEach((petState) => shell.classList.remove(petState.cssClass));
  shell.classList.add(state.cssClass);
  applyPetAnimationState(state.key);
  applyMotionLevel();
  if (!normalizedOptions.silent) {
    setPetMessage(normalizedOptions.message || getDialogueForState(state.key));
  }
  $("#petLabel").textContent = state.label;
  renderFace(state);

  const duration = typeof normalizedOptions.duration === "number" ? normalizedOptions.duration : state.duration;
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
      kojiTone: "default",
      dialogueTone: "default",
      hourlyChimeEnabled: Boolean(stored.hourlyChimeEnabled),
      currentCharacter: stored.currentCharacter || "koji",
      currentSkin: stored.currentSkin || "default",
      lastHourlyChimeKey: stored.lastHourlyChimeKey || "",
      kojiMotionLevel: stored.kojiMotionLevel || (stored.animationsEnabled === false ? "off" : "normal"),
      animationsEnabled: stored.kojiMotionLevel ? stored.kojiMotionLevel !== "off" : stored.animationsEnabled !== false,
    };
  } catch (error) {
    return { ...defaultPetSettings };
  }
}

function savePetSettings() {
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem("kojiReportPet.settings") || "{}"); } catch (error) { return {}; }
  })();
  localStorage.setItem("kojiReportPet.settings", JSON.stringify({ ...stored, ...petSettings, animationsEnabled: petSettings.kojiMotionLevel !== "off", kojiTone: "default", dialogueTone: "default" }));
}

function applyPetSettings(nextSettings = {}) {
  petSettings = {
    ...petSettings,
    ...nextSettings,
    kojiTone: "default",
    dialogueTone: "default",
    hourlyChimeEnabled: Object.prototype.hasOwnProperty.call(nextSettings, "hourlyChimeEnabled")
      ? Boolean(nextSettings.hourlyChimeEnabled)
      : petSettings.hourlyChimeEnabled,
    currentCharacter: nextSettings.currentCharacter || petSettings.currentCharacter || "koji",
    currentSkin: nextSettings.currentSkin || petSettings.currentSkin || "default",
    lastHourlyChimeKey: nextSettings.lastHourlyChimeKey || petSettings.lastHourlyChimeKey || "",
    kojiMotionLevel: nextSettings.kojiMotionLevel || (nextSettings.animationsEnabled === false ? "off" : petSettings.kojiMotionLevel || "normal"),
  };
  syncMotionSettings(petSettings);
  savePetSettings();
  if (currentStateKey) setPetState(currentStateKey, { duration: currentStateKey === "idle" ? 0 : undefined });
}

function getChimeState(hour) {
  if (hour >= 23 || hour <= 5) return "sleep";
  if (hour === 12) return "happy";
  if (hour >= 17 && hour <= 19) return "angry";
  return "wave";
}

function getHourlyChimeKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}`;
}

function shouldSkipHourlyChime() {
  return quickRecordVisible;
}

function markHourlyChimeShown(key) {
  petSettings.lastHourlyChimeKey = key;
  savePetSettings();
}

function checkHourlyChime() {
  if (!petSettings.hourlyChimeEnabled) return;
  const now = new Date();
  if (now.getMinutes() !== 0) return;
  const key = getHourlyChimeKey(now);
  if (petSettings.lastHourlyChimeKey === key) return;
  markHourlyChimeShown(key);
  if (shouldSkipHourlyChime()) return;
  const state = petStates[getChimeState(now.getHours())] || petStates.wave;
  setPetState(state.key, {
    message: getHourlyDialogue(now.getHours()),
    duration: 7600,
  });
  $("#petLabel").textContent = `${state.label} · 整点报时`;
}

function startHourlyChimeTimer() {
  clearInterval(hourlyTimer);
  checkHourlyChime();
  hourlyTimer = setInterval(checkHourlyChime, 30000);
}

function stopHourlyChimeTimer() {
  clearInterval(hourlyTimer);
  hourlyTimer = null;
}

function setupHourlyChime() {
  if (petSettings.hourlyChimeEnabled) startHourlyChimeTimer();
  else stopHourlyChimeTimer();
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
    if (!dragInfo.moved) dragReturnStateKey = currentStateKey === "drag" ? "idle" : currentStateKey;
    dragInfo.moved = true;
    if (currentStateKey !== "drag") setPetState("drag", { duration: 0 });
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
      setPetState(quickRecordVisible ? "record_ready" : (dragReturnStateKey === "drag" ? "idle" : dragReturnStateKey || "idle"));
      dragReturnStateKey = "idle";
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
  syncMotionSettings(petSettings);
  loadTags();
  window.kojiDesktop?.setPetWindowMode?.("compact");
  setPetState("idle");
  setupHourlyChime();
}

document.addEventListener("DOMContentLoaded", init);
