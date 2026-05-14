const petStates = {
  idle: { key: "idle", label: "待机", emoji: "🐾", image: "", message: "来了，今天干啥了？", cssClass: "pet-idle", duration: 0 },
  wave: { key: "wave", label: "打招呼", emoji: "👋", image: "", message: "嗨，我在桌面陪你记日报。", cssClass: "pet-wave", duration: 1800 },
  record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", image: "", message: "打开面板，先记一条吧。", cssClass: "pet-record-ready", duration: 2200 },
  success: { key: "success", label: "记录成功", emoji: "✅", image: "", message: "这条我记下了。", cssClass: "pet-success", duration: 2200 },
  thinking: { key: "thinking", label: "思考", emoji: "🤔", image: "", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking", duration: 1800 },
  writing: { key: "writing", label: "写日报", emoji: "✍️", image: "", message: "日报我来写！", cssClass: "pet-writing", duration: 2400 },
  happy: { key: "happy", label: "开心", emoji: "🎉", image: "", message: "复制好了，去交差吧！", cssClass: "pet-happy", duration: 2400 },
  confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", image: "", message: "今天还啥都没记呢！", cssClass: "pet-confused", duration: 2600 },
  angry: { key: "angry", label: "催日报", emoji: "😾", image: "", message: "你是不是又忘写日报了？", cssClass: "pet-angry", duration: 3000 },
  sleep: { key: "sleep", label: "困倦", emoji: "💤", image: "", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep", duration: 2600 },
  drag: { key: "drag", label: "被拖动", emoji: "🌀", image: "", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag", duration: 0 },
  error: { key: "error", label: "报错", emoji: "⚠️", image: "", message: "哎呀，好像哪里失败了。", cssClass: "pet-error", duration: 3200 },
};

const $ = (selector) => document.querySelector(selector);
let petTimer = null;
let dragStartedAt = 0;

function setPetState(stateKey, overrideDuration) {
  const state = petStates[stateKey] || petStates.idle;
  const shell = $("#petShell");
  const face = $("#petFace");

  clearTimeout(petTimer);
  shell.className = `pet-shell ${state.cssClass}`;
  $("#petBubble").textContent = state.message;
  $("#petLabel").textContent = state.label;

  if (state.image) {
    face.innerHTML = `<img src="${state.image}" alt="${state.label}">`;
    const image = face.querySelector("img");
    image.addEventListener("error", () => {
      face.textContent = state.emoji;
    }, { once: true });
  } else {
    face.textContent = state.emoji;
  }

  const duration = typeof overrideDuration === "number" ? overrideDuration : state.duration;
  if (duration > 0 && state.key !== "idle") {
    petTimer = setTimeout(() => setPetState("idle"), duration);
  }
}

function sendPetState(state) {
  setPetState(state);
  window.kojiDesktop?.setPetState?.(state);
}

function bindPetEvents() {
  $("#petBody").addEventListener("mouseenter", () => sendPetState("wave"));
  $("#petBody").addEventListener("click", () => window.kojiDesktop?.toggleMainWindow?.());
  $("#recordBtn").addEventListener("click", () => {
    sendPetState("record_ready");
    window.kojiDesktop?.showMainWindow?.();
  });
  $("#toggleBtn").addEventListener("click", () => window.kojiDesktop?.toggleMainWindow?.());
  $("#quitBtn").addEventListener("click", () => window.kojiDesktop?.quitApp?.());

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    window.kojiDesktop?.quitApp?.();
  });

  document.addEventListener("pointerdown", () => {
    dragStartedAt = Date.now();
    setPetState("drag", 0);
  });
  document.addEventListener("pointerup", () => {
    if (Date.now() - dragStartedAt > 180) setPetState("idle");
  });

  window.kojiDesktop?.onPetStateChanged?.((state) => setPetState(state));
}

function init() {
  bindPetEvents();
  setPetState("idle");
}

document.addEventListener("DOMContentLoaded", init);
