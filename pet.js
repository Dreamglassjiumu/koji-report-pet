const defaultTags = ["默认", "Project：X", "毛茸茸骑士", "公司工作", "个人创作", "会议沟通", "资料整理", "功能测试"];
const successMessages = [
  "记下了，晚上我帮你整理。",
  "收到，已经塞进日报素材库。",
  "好，这条看起来像正经工作。",
  "已记录，今天不是白干。",
  "放心，这条我替你存好了。",
];

const stateOrder = ["idle", "wave", "record_ready", "collect", "success", "thinking", "writing", "happy", "confused", "angry", "sleep", "drag", "error"];
const petStates = {
  idle: { key: "idle", label: "待机", emoji: "🐾", image: "assets/koji/idle.png", message: "来了，今天干啥了？", cssClass: "pet-idle", duration: 0 },
  wave: { key: "wave", label: "打招呼", emoji: "👋", image: "assets/koji/wave.png", message: "嗨，我在桌面陪你记日报。", cssClass: "pet-wave", duration: 1800 },
  record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", image: "assets/koji/record_ready.png", message: "说吧，今天干啥了？", cssClass: "pet-record-ready", duration: 0 },
  collect: { key: "collect", label: "收集记录", emoji: "📥", image: "assets/koji/collect.png", message: "收到，已经收进日报素材库。", cssClass: "pet-collect", duration: 2400 },
  success: { key: "success", label: "通用成功", emoji: "✅", image: "assets/koji/success.png", message: "这条我记下了。", cssClass: "pet-success", duration: 2200 },
  thinking: { key: "thinking", label: "思考", emoji: "🤔", image: "assets/koji/thinking.png", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking", duration: 1800 },
  writing: { key: "writing", label: "写日报", emoji: "✍️", image: "assets/koji/writing.png", message: "日报我来写！", cssClass: "pet-writing", duration: 2400 },
  happy: { key: "happy", label: "开心", emoji: "🎉", image: "assets/koji/happy.png", message: "复制好了，去交差吧！", cssClass: "pet-happy", duration: 2400 },
  confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", image: "assets/koji/confused.png", message: "你还什么都没说呢。", cssClass: "pet-confused", duration: 2600 },
  angry: { key: "angry", label: "催日报", emoji: "😾", image: "assets/koji/angry.png", message: "你是不是又忘写日报了？", cssClass: "pet-angry", duration: 3000 },
  sleep: { key: "sleep", label: "困倦", emoji: "💤", image: "assets/koji/sleep.png", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep", duration: 2600 },
  drag: { key: "drag", label: "拖动", emoji: "🌀", image: "assets/koji/drag.png", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag", duration: 0 },
  error: { key: "error", label: "报错", emoji: "⚠️", image: "assets/koji/error.png", message: "哎呀，好像哪里失败了。", cssClass: "pet-error", duration: 3200 },
};

const $ = (selector) => document.querySelector(selector);
let petTimer = null;
let clickTimer = null;
let dragInfo = null;
let suppressClickUntil = 0;
let currentStateKey = "idle";

function assetCandidates(state) {
  return ["png", "webp", "gif"].map((ext) => `assets/koji/${state.key}.${ext}`);
}

function renderFace(state) {
  const face = $("#petFace");
  const candidates = assetCandidates(state);
  let index = 0;
  const tryNext = () => {
    if (index >= candidates.length) {
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
  setBubble(state.message);
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
  loadTags();
  sendPetState("record_ready");
  const panel = $("#quickRecordForm");
  panel.hidden = false;
  $("#quickRecordText").focus();
}

function hideQuickRecord(nextState = "idle") {
  $("#quickRecordForm").hidden = true;
  $("#quickRecordText").value = "";
  sendPetState(nextState);
}

async function submitQuickRecord() {
  const text = $("#quickRecordText").value.trim();
  const tag = $("#quickRecordTag").value || "公司工作";
  if (!text) {
    setBubble("你还什么都没说呢。");
    sendPetState("confused");
    $("#quickRecordText").focus();
    return;
  }

  try {
    const result = await window.kojiDesktop?.submitQuickRecord?.(text, tag);
    if (result && result.ok === false) throw new Error(result.message || "记录失败");
    $("#quickRecordForm").hidden = true;
    $("#quickRecordText").value = "";
    sendPetState("collect");
    setBubble(successMessages[Math.floor(Math.random() * successMessages.length)]);
  } catch (error) {
    console.error(error);
    setBubble("记录失败了，打开面板再试试。 ");
    sendPetState("error");
  }
}

function handleSingleClick() {
  if (Date.now() < suppressClickUntil || dragInfo?.moved) return;
  showQuickRecord();
}

function handleDoubleClick() {
  clearTimeout(clickTimer);
  $("#quickRecordForm").hidden = true;
  sendPetState("wave");
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
      setPetState("idle");
    }
  };
  body.addEventListener("pointerup", finishDrag);
  body.addEventListener("pointercancel", finishDrag);
}

function bindPetEvents() {
  const body = $("#petBody");
  body.addEventListener("mouseenter", () => currentStateKey === "idle" && setPetState("wave"));
  body.addEventListener("click", () => {
    if (Date.now() < suppressClickUntil || dragInfo?.moved) return;
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
  $("#quickOpenBtn").addEventListener("click", () => window.kojiDesktop?.showMainWindow?.());

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    window.kojiDesktop?.showPetContextMenu?.();
  });

  window.kojiDesktop?.onPetStateChanged?.((state) => setPetState(state));
  window.kojiDesktop?.onPetCommand?.((command) => {
    if (command === "quick-record") showQuickRecord();
  });
  bindManualDrag();
}

function init() {
  stateOrder.forEach((stateKey) => {
    if (!petStates[stateKey]) console.warn(`缺少 Koji 状态：${stateKey}`);
  });
  bindPetEvents();
  loadTags();
  setPetState("idle");
}

document.addEventListener("DOMContentLoaded", init);
