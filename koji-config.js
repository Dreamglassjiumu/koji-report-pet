(function () {
  const stateOrder = ["idle", "wave", "record_ready", "collect", "success", "thinking", "writing", "happy", "confused", "angry", "sleep", "drag", "error"];

  const petStates = {
    idle: { key: "idle", label: "待机", emoji: "🐾", message: "来了，今天干啥了？", cssClass: "pet-idle", duration: 0 },
    wave: { key: "wave", label: "打招呼", emoji: "👋", message: "嗨，我在这，日报素材别藏。", cssClass: "pet-wave", duration: 1800 },
    record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", message: "说吧，今天干啥了？", cssClass: "pet-record-ready", duration: 0 },
    collect: { key: "collect", label: "收集记录", emoji: "📥", message: "收到，已经塞进日报素材库。", cssClass: "pet-collect", duration: 2400 },
    success: { key: "success", label: "通用成功", emoji: "✅", message: "保存成功，今天不是白干。", cssClass: "pet-success", duration: 2200 },
    thinking: { key: "thinking", label: "思考", emoji: "🤔", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking", duration: 1800 },
    writing: { key: "writing", label: "写日报", emoji: "✍️", message: "我写，我写还不行吗。", cssClass: "pet-writing", duration: 2400 },
    happy: { key: "happy", label: "开心", emoji: "🎉", message: "复制好了，去交差吧！", cssClass: "pet-happy", duration: 2400 },
    confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", message: "你还什么都没说呢。", cssClass: "pet-confused", duration: 2600 },
    angry: { key: "angry", label: "催日报", emoji: "😾", message: "你是不是又忘写日报了？", cssClass: "pet-angry", duration: 3000 },
    sleep: { key: "sleep", label: "困倦", emoji: "💤", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep", duration: 2600 },
    drag: { key: "drag", label: "拖动", emoji: "🌀", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag", duration: 0 },
    error: { key: "error", label: "报错", emoji: "⚠️", message: "哎呀，本地保存或复制好像失败了。", cssClass: "pet-error", duration: 3200 },
  };

  const fallbackDialogues = Object.fromEntries(stateOrder.map((key) => [key, [petStates[key].message]]));
  const dialogues = window.KOJI_DIALOGUES || fallbackDialogues;
  const hourlyDialogues = window.KOJI_HOURLY_DIALOGUES || {};
  const memeSafePool = window.KOJI_MEME_SAFE_POOL || [];
  const dialogueMeta = window.KOJI_DIALOGUE_META || {
    tones: [{ id: "default", label: "默认 Koji" }],
    states: stateOrder.map((key) => ({ key, label: petStates[key].label })),
  };

  const toneOptions = { default: "默认 Koji" };

  const characters = {
    koji: {
      id: "koji",
      displayName: "Koji",
      description: "文案组日报小秘书，也是会耍宝的桌宠吉祥物。",
      skins: {
        default: {
          id: "default",
          displayName: "默认 Koji",
          basePath: "assets/koji/",
          futureBasePath: "assets/characters/koji/default/",
          states: stateOrder.reduce((map, state) => ({ ...map, [state]: state }), {}),
        },
      },
    },
  };

  function normalizeTone() {
    return "default";
  }

  function pickRandom(list) {
    if (!Array.isArray(list) || list.length === 0) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

  function getDialoguePool(stateKey) {
    return dialogues[stateKey] || dialogues.default?.[stateKey] || [];
  }

  function getDialogue(stateKey, tone, fallback) {
    return pickRandom(getDialoguePool(stateKey)) || fallback || petStates[stateKey]?.message || "Koji 在。";
  }

  function getHourlyPool(hour) {
    const hourKey = String(hour).padStart(2, "0");
    return hourlyDialogues[hourKey] || hourlyDialogues.default?.[hourKey] || [];
  }

  function getHourlyLine(hour) {
    const hourNumber = Number(hour);
    return pickRandom(getHourlyPool(hourNumber)) || `现在是 ${hourNumber} 点，Koji 提醒你记一下今日素材。`;
  }

  function getCharacter(characterId = "koji", skinId = "default") {
    const character = characters[characterId] || characters.koji;
    const skin = character.skins[skinId] || character.skins.default;
    return { character, skin };
  }

  function getAssetCandidates(stateKey, characterId = "koji", skinId = "default") {
    const { skin } = getCharacter(characterId, skinId);
    return ["webp", "gif", "png"].map((ext) => `${skin.basePath}${stateKey}.${ext}`);
  }

  window.KojiConfig = {
    stateOrder,
    petStates,
    toneOptions,
    dialogues,
    hourlyDialogues,
    memeSafePool,
    dialogueMeta,
    characters,
    normalizeTone,
    pickRandom,
    getDialoguePool,
    getDialogue,
    getHourlyPool,
    getHourlyLine,
    getCharacter,
    getAssetCandidates,
  };
})();
