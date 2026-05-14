const STORAGE_KEYS = {
  records: "kojiReportPet.records",
  settings: "kojiReportPet.settings",
  reports: "kojiReportPet.reports",
};

const defaultTags = ["默认", "Project：X", "毛茸茸骑士", "公司工作", "个人创作", "会议沟通", "资料整理", "功能测试"];
const defaultSettings = {
  username: "",
  defaultTemplate: "formal",
  customTags: [],
  animationsEnabled: true,
};

const templateNames = {
  formal: "正式日报",
  brief: "简洁日报",
  detailed: "详细日报",
  copywriting: "文案组日报",
  feedback: "问题反馈型日报",
};

const categoryRules = [
  { name: "资料整理", keywords: ["整理", "梳理", "归档", "收集", "资料", "文档", "导入", "索引"] },
  { name: "功能优化", keywords: ["优化", "调整", "完善", "改进", "升级", "迭代", "交互", "界面", "体验", "逻辑"] },
  { name: "测试验证", keywords: ["测试", "验证", "检查", "验收", "确认", "排查", "复测", "预览"] },
  { name: "沟通协作", keywords: ["讨论", "沟通", "对齐", "会议", "同步", "反馈", "确认", "评审"] },
  { name: "文案创作", keywords: ["撰写", "创作", "补充", "设计", "设定", "剧情", "角色", "世界观", "台词", "文本", "脚本", "pitch", "Pitch"] },
  { name: "问题修复", keywords: ["修复", "解决", "排查", "处理", "报错", "bug", "Bug", "问题", "异常", "乱码"] },
];

const petStates = {
  idle: { key: "idle", label: "待机", emoji: "🐾", message: "来了，今天干啥了？", cssClass: "pet-idle" },
  wave: { key: "wave", label: "打招呼", emoji: "👋", message: "嗨，我在右下角盯着日报。", cssClass: "pet-wave" },
  record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", message: "说吧，今天又干啥了？", cssClass: "pet-record-ready" },
  success: { key: "success", label: "记录成功", emoji: "✅", message: "这条我记下了。", cssClass: "pet-success" },
  thinking: { key: "thinking", label: "思考", emoji: "🤔", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking" },
  writing: { key: "writing", label: "写日报", emoji: "✍️", message: "日报我来写！", cssClass: "pet-writing" },
  happy: { key: "happy", label: "开心", emoji: "🎉", message: "复制好了，去交差吧！", cssClass: "pet-happy" },
  confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", message: "今天还啥都没记呢！", cssClass: "pet-confused" },
  angry: { key: "angry", label: "催日报", emoji: "😾", message: "你是不是又忘写日报了？", cssClass: "pet-angry" },
  sleep: { key: "sleep", label: "困倦", emoji: "💤", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep" },
  drag: { key: "drag", label: "被拖动", emoji: "🌀", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag" },
  error: { key: "error", label: "报错", emoji: "⚠️", message: "哎呀，本地保存或复制好像失败了。", cssClass: "pet-error" },
};

let records = {};
let reports = {};
let settings = { ...defaultSettings };
let selectedHistoryDate = "";
let petTimer = null;
let idleTimer = null;

const $ = (selector) => document.querySelector(selector);

function init() {
  records = loadRecords();
  reports = loadReports();
  settings = loadSettings();
  selectedHistoryDate = getTodayKey();

  $("#todayDate").textContent = formatDate(getTodayKey());
  initEventListeners();
  renderTagOptions();
  renderTodayRecords();
  renderHistory();
  renderSettings();
  $("#templateSelect").value = settings.defaultTemplate;
  $("#reportOutput").value = getLatestReport(getTodayKey())?.content || "";
  applyAnimationSetting();
  makePetDraggable();
  setPetState("wave", 2200);
  setupIdleWatcher();
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadRecords() {
  return safeReadJson(STORAGE_KEYS.records, {});
}

function saveRecords() {
  return safeWriteJson(STORAGE_KEYS.records, records);
}

function loadReports() {
  return safeReadJson(STORAGE_KEYS.reports, {});
}

function saveReports() {
  return safeWriteJson(STORAGE_KEYS.reports, reports);
}

function loadSettings() {
  return { ...defaultSettings, ...safeReadJson(STORAGE_KEYS.settings, {}) };
}

function saveSettings() {
  return safeWriteJson(STORAGE_KEYS.settings, settings);
}

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    console.warn(`读取 ${key} 失败`, error);
    showToast("本地数据读取失败，已使用默认数据。", true);
    setPetState("error", 2600);
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`保存 ${key} 失败`, error);
    showToast("本地保存失败，请检查浏览器存储空间。", true);
    setPetState("error", 3200);
    return false;
  }
}

function initEventListeners() {
  $("#recordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addRecord();
  });
  $("#recordText").addEventListener("focus", () => setPetState("record_ready"));
  $("#templateSelect").addEventListener("change", (event) => {
    settings.defaultTemplate = event.target.value;
    saveSettings();
    setPetState("thinking", 1600);
  });
  $("#generateBtn").addEventListener("click", generateReport);
  $("#saveReportBtn").addEventListener("click", saveCurrentReport);
  $("#copyReportBtn").addEventListener("click", () => copyReport($("#reportOutput").value));
  $("#nudgePetBtn").addEventListener("click", () => setPetState("angry", 3000));

  const pet = $("#kojiPet");
  pet.addEventListener("mouseenter", () => setPetState("wave", 1600));
  pet.addEventListener("click", () => {
    $("#recordText").focus();
    setPetState("record_ready", 2200);
  });
  pet.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $("#recordText").focus();
      setPetState("record_ready", 2200);
    }
  });
}

function renderTodayRecords() {
  const today = getTodayKey();
  const list = records[today] || [];
  const container = $("#todayRecords");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">Koji 还没收到今天的记录。先写一条，晚上就不用现编啦。</div>`;
    return;
  }

  container.innerHTML = list
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((record) => `
      <article class="record-item">
        <div class="record-time">${escapeHtml(record.time)}</div>
        <div>
          <span class="tag-pill">${escapeHtml(record.tag || "默认")}</span>
          <p class="record-text">${escapeHtml(record.text)}</p>
        </div>
        <div class="record-actions">
          <button class="tiny-btn" type="button" data-action="edit" data-id="${record.id}">编辑</button>
          <button class="tiny-btn danger-btn" type="button" data-action="delete" data-id="${record.id}">删除</button>
        </div>
      </article>
    `)
    .join("");

  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      if (button.dataset.action === "edit") editRecord(id);
      if (button.dataset.action === "delete") deleteRecord(id);
    });
  });
}

function renderHistory() {
  const dates = Array.from(new Set([...Object.keys(records), ...Object.keys(reports)])).sort().reverse();
  const datesContainer = $("#historyDates");
  if (dates.length === 0) {
    datesContainer.innerHTML = `<div class="empty-state">暂无历史记录。</div>`;
    $("#historyDetail").innerHTML = "选择一个日期，查看事项与日报。";
    return;
  }

  datesContainer.innerHTML = dates
    .map((date) => {
      const count = (records[date] || []).length;
      const hasReport = (reports[date] || []).length > 0;
      return `<button class="history-date-btn" type="button" data-date="${date}">
        <strong>${formatDate(date)}</strong>
        <span>${count} 条事项 · ${hasReport ? "已有日报" : "未生成日报"}</span>
      </button>`;
    })
    .join("");

  datesContainer.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedHistoryDate = button.dataset.date;
      setPetState("thinking", 1600);
      renderHistoryDetail(selectedHistoryDate);
    });
  });

  if (!dates.includes(selectedHistoryDate)) selectedHistoryDate = dates[0];
  renderHistoryDetail(selectedHistoryDate);
}

function renderHistoryDetail(date) {
  const dayRecords = records[date] || [];
  const dayReports = reports[date] || [];
  const latest = dayReports[dayReports.length - 1];
  $("#historyDetail").innerHTML = `
    <h3>${formatDate(date)}</h3>
    <p>${dayRecords.length} 条事项，${dayReports.length} 份已保存日报。</p>
    <div class="record-list">
      ${dayRecords.length ? dayRecords.map((item) => `<div class="record-item"><span class="record-time">${escapeHtml(item.time)}</span><div><span class="tag-pill">${escapeHtml(item.tag || "默认")}</span><p class="record-text">${escapeHtml(item.text)}</p></div></div>`).join("") : `<div class="empty-state">这一天没有事项记录。</div>`}
    </div>
    <textarea class="history-report" rows="7" readonly>${latest ? escapeHtml(latest.content) : "这一天还没有保存日报。"}</textarea>
    <div class="button-row">
      <button class="secondary-btn" type="button" id="copyHistoryReport" ${latest ? "" : "disabled"}>复制历史日报</button>
      <button class="danger-btn" type="button" id="deleteHistoryDate">删除这一天数据</button>
    </div>
  `;
  $("#copyHistoryReport")?.addEventListener("click", () => copyReport(latest.content));
  $("#deleteHistoryDate")?.addEventListener("click", () => deleteDateData(date));
}

function renderSettings() {
  $("#settingsPanel").innerHTML = `
    <div class="setting-box">
      <label for="usernameInput">用户名</label>
      <input id="usernameInput" type="text" value="${escapeHtml(settings.username)}" placeholder="例如：小林">
      <p>生成日报时可用于署名或本地记录。</p>
    </div>
    <div class="setting-box">
      <label for="defaultTemplateSelect">默认日报模板</label>
      <select id="defaultTemplateSelect">
        ${Object.entries(templateNames).map(([value, label]) => `<option value="${value}" ${settings.defaultTemplate === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <p>下次打开页面会保留这个模板。</p>
    </div>
    <div class="setting-box">
      <label for="customTagInput">新增自定义标签</label>
      <div class="form-row">
        <input id="customTagInput" type="text" placeholder="例如：海外宣发">
        <button id="addTagBtn" type="button" class="secondary-btn">新增</button>
      </div>
      <p>当前自定义：${settings.customTags.length ? settings.customTags.map(escapeHtml).join("、") : "暂无"}</p>
    </div>
    <div class="setting-box">
      <label class="checkbox-row"><input id="animationToggle" type="checkbox" ${settings.animationsEnabled ? "checked" : ""}> 开启 Koji 动画</label>
      <p>关闭后仍会切换状态，但不播放明显动画。</p>
    </div>
    <div class="setting-box">
      <button id="resetDataBtn" type="button" class="danger-btn">清空全部本地数据</button>
      <p>会删除事项、日报和设置，需要二次确认。</p>
    </div>
  `;

  $("#usernameInput").addEventListener("change", (event) => {
    settings.username = event.target.value.trim();
    saveSettings();
    showToast("用户名已保存。");
  });
  $("#defaultTemplateSelect").addEventListener("change", (event) => {
    settings.defaultTemplate = event.target.value;
    $("#templateSelect").value = event.target.value;
    saveSettings();
  });
  $("#addTagBtn").addEventListener("click", addCustomTag);
  $("#animationToggle").addEventListener("change", (event) => {
    settings.animationsEnabled = event.target.checked;
    saveSettings();
    applyAnimationSetting();
  });
  $("#resetDataBtn").addEventListener("click", resetAllData);
}

function addRecord() {
  const text = $("#recordText").value.trim();
  if (!text) {
    setPetState("confused", 2400);
    showToast("先写一点事项内容吧。", true);
    return;
  }
  const now = new Date();
  const date = getTodayKey();
  const record = {
    id: `record-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    text,
    tag: $("#recordTag").value || "默认",
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
  records[date] = records[date] || [];
  records[date].push(record);
  if (saveRecords()) {
    $("#recordText").value = "";
    renderTodayRecords();
    renderHistory();
    setPetState("success", 2200);
    showToast("事项已保存到本地。");
  }
}

function editRecord(id) {
  const date = getTodayKey();
  const record = (records[date] || []).find((item) => item.id === id);
  if (!record) return;
  setPetState("thinking", 1800);
  const nextText = prompt("编辑事项内容：", record.text);
  if (nextText === null) return;
  const trimmed = nextText.trim();
  if (!trimmed) {
    showToast("事项内容不能为空。", true);
    return;
  }
  const nextTag = prompt("编辑项目标签：", record.tag || "默认");
  record.text = trimmed;
  record.tag = (nextTag || record.tag || "默认").trim();
  record.updatedAt = Date.now();
  if (saveRecords()) {
    renderTagOptions();
    renderTodayRecords();
    renderHistory();
    showToast("事项已更新。");
  }
}

function deleteRecord(id) {
  const date = getTodayKey();
  if (!confirm("确定删除这条事项吗？")) return;
  records[date] = (records[date] || []).filter((item) => item.id !== id);
  if (records[date].length === 0) delete records[date];
  if (saveRecords()) {
    renderTodayRecords();
    renderHistory();
    showToast("事项已删除。");
  }
}

function generateReport() {
  const date = getTodayKey();
  const todayRecords = records[date] || [];
  if (todayRecords.length === 0) {
    setPetState("confused", 3200);
    showToast("今天还没有记录，暂时不能生成日报。", true);
    return;
  }
  setPetState("writing", 1800);
  const template = $("#templateSelect").value;
  const grouped = groupRecordsByCategory(todayRecords);
  const report = buildReport(template, todayRecords, grouped, date);
  $("#reportOutput").value = report;
  saveReportContent(report, template, date);
  showToast("日报已生成并保存到本地。");
  setTimeout(() => setPetState("idle"), 1900);
}

function copyReport(content) {
  const text = (content || "").trim();
  if (!text) {
    setPetState("confused", 2400);
    showToast("没有可复制的日报内容。", true);
    return;
  }
  const fallbackCopy = () => {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand("copy");
    helper.remove();
    return ok;
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      setPetState("happy", 2600);
      showToast("日报已复制。");
    }).catch(() => {
      if (fallbackCopy()) {
        setPetState("happy", 2600);
        showToast("日报已复制。");
      } else {
        setPetState("error", 3000);
        showToast("复制失败，请手动复制。", true);
      }
    });
  } else if (fallbackCopy()) {
    setPetState("happy", 2600);
    showToast("日报已复制。");
  } else {
    setPetState("error", 3000);
    showToast("复制失败，请手动复制。", true);
  }
}

function classifyRecord(text) {
  const hit = categoryRules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  return hit ? hit.name : "其他工作";
}

function groupRecordsByCategory(items) {
  return items.reduce((grouped, record) => {
    const category = classifyRecord(record.text);
    grouped[category] = grouped[category] || [];
    grouped[category].push(record);
    return grouped;
  }, {});
}

function setPetState(stateName, autoBackMs = 0) {
  const state = petStates[stateName] || petStates.idle;
  const pet = $("#kojiPet");
  Object.values(petStates).forEach((item) => pet.classList.remove(item.cssClass));
  pet.classList.add(state.cssClass);
  $("#petFace").innerHTML = state.image ? `<img src="${state.image}" alt="${state.label}">` : state.emoji;
  $("#petLabel").textContent = state.label;
  $("#petBubble").textContent = state.message;
  clearTimeout(petTimer);
  if (autoBackMs > 0 && stateName !== "idle") {
    petTimer = setTimeout(() => setPetState("idle"), autoBackMs);
  }
}

function makePetDraggable() {
  const pet = $("#kojiPet");
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  pet.addEventListener("pointerdown", (event) => {
    dragging = true;
    const rect = pet.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    pet.setPointerCapture(event.pointerId);
    setPetState("drag");
  });

  pet.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const x = Math.min(Math.max(8, event.clientX - offsetX), window.innerWidth - pet.offsetWidth - 8);
    const y = Math.min(Math.max(8, event.clientY - offsetY), window.innerHeight - pet.offsetHeight - 8);
    pet.style.left = `${x}px`;
    pet.style.top = `${y}px`;
    pet.style.right = "auto";
    pet.style.bottom = "auto";
  });

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    setPetState("idle");
  };
  pet.addEventListener("pointerup", stopDragging);
  pet.addEventListener("pointercancel", stopDragging);
}

function buildReport(template, dayRecords, grouped, date) {
  const categories = Object.keys(grouped);
  const categoryText = categories.join("、");
  const name = settings.username ? `${settings.username} ` : "";
  const summary = categories.map((category) => `在${category}方面，${summarizeRecords(grouped[category])}`).join("；");
  const issueItems = grouped["问题修复"] || [];

  if (template === "brief") {
    return `${formatDate(date)}日报：今日主要围绕${categoryText}推进工作，共记录${dayRecords.length}项事项。${summary}。整体工作已按本地记录完成整理，后续将继续跟进未闭环内容。`;
  }
  if (template === "detailed") {
    return `${formatDate(date)} ${name}详细日报\n\n${categories.map((category, index) => `${index + 1}. ${category}\n${grouped[category].map((record) => `- ${record.time}｜${record.tag || "默认"}｜${record.text}`).join("\n")}`).join("\n\n")}\n\n今日共完成/推进 ${dayRecords.length} 项记录，后续将继续根据项目节奏补充细节与验收结果。`;
  }
  if (template === "copywriting") {
    return `${formatDate(date)} 文案组日报：今日工作主要集中在${categoryText}。${summary}。整体推进中重点关注文案表达、设定资料、角色/剧情信息与工具流程的衔接，确保后续交付内容更清晰、可复用，也方便组内继续接力。`;
  }
  if (template === "feedback") {
    return `${formatDate(date)} 问题反馈型日报\n\n一、今日完成事项\n${categories.map((category) => `- ${category}：${summarizeRecords(grouped[category])}`).join("\n")}\n\n二、发现/处理的问题\n${issueItems.length ? issueItems.map((item) => `- ${item.text}`).join("\n") : "- 暂未记录明确问题，后续继续观察项目推进中的异常与反馈。"}\n\n三、后续计划\n- 继续跟进${categoryText}相关事项，补充缺失信息并推动确认闭环。`;
  }
  return `${formatDate(date)} ${name}日报：今日主要围绕${categoryText}等方面展开工作，共记录${dayRecords.length}项事项。${summary}。整体来看，今日已完成相关内容的整理、推进与确认，后续将继续根据项目进展补充细节，并保持与相关同事的同步。`;
}

function summarizeRecords(items) {
  const snippets = items.map((item) => cleanSentence(item.text)).slice(0, 3);
  const suffix = items.length > 3 ? `等${items.length}项内容` : "";
  return `完成/推进了${snippets.join("、")}${suffix}`;
}

function cleanSentence(text) {
  return text.replace(/[。；;\n]+/g, "，").replace(/，$/g, "").trim();
}

function saveCurrentReport() {
  const content = $("#reportOutput").value.trim();
  if (!content) {
    showToast("没有可保存的日报。", true);
    setPetState("confused", 2400);
    return;
  }
  saveReportContent(content, $("#templateSelect").value, getTodayKey());
  showToast("日报已保存。");
}

function saveReportContent(content, template, date) {
  reports[date] = reports[date] || [];
  reports[date].push({ id: `report-${Date.now()}`, date, template, content, createdAt: Date.now() });
  if (saveReports()) renderHistory();
}

function getLatestReport(date) {
  const dayReports = reports[date] || [];
  return dayReports[dayReports.length - 1];
}

function deleteDateData(date) {
  if (!confirm(`确定删除 ${formatDate(date)} 的全部事项和日报吗？`)) return;
  if (!confirm("这是二次确认：删除后只能依赖浏览器备份恢复，确定继续吗？")) return;
  delete records[date];
  delete reports[date];
  saveRecords();
  saveReports();
  if (date === getTodayKey()) $("#reportOutput").value = "";
  renderTodayRecords();
  renderHistory();
  showToast("该日期数据已删除。");
}

function addCustomTag() {
  const input = $("#customTagInput");
  const tag = input.value.trim();
  if (!tag) return;
  const allTags = getAllTags();
  if (allTags.includes(tag)) {
    showToast("这个标签已经存在。", true);
    return;
  }
  settings.customTags.push(tag);
  if (saveSettings()) {
    renderTagOptions();
    renderSettings();
    showToast("自定义标签已新增。");
  }
}

function resetAllData() {
  if (!confirm("确定清空全部本地数据吗？")) return;
  if (!confirm("二次确认：事项、日报和设置都会被删除，确定继续吗？")) return;
  localStorage.removeItem(STORAGE_KEYS.records);
  localStorage.removeItem(STORAGE_KEYS.reports);
  localStorage.removeItem(STORAGE_KEYS.settings);
  records = {};
  reports = {};
  settings = { ...defaultSettings };
  selectedHistoryDate = getTodayKey();
  $("#reportOutput").value = "";
  renderTagOptions();
  renderTodayRecords();
  renderHistory();
  renderSettings();
  applyAnimationSetting();
  setPetState("idle");
  showToast("已恢复初始状态。");
}

function renderTagOptions() {
  const tags = getAllTags();
  $("#recordTag").innerHTML = tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("");
}

function getAllTags() {
  const recordTags = Object.values(records).flat().map((item) => item.tag).filter(Boolean);
  return Array.from(new Set([...defaultTags, ...settings.customTags, ...recordTags]));
}

function applyAnimationSetting() {
  document.body.classList.toggle("pet-animations-on", Boolean(settings.animationsEnabled));
}

function setupIdleWatcher() {
  const resetIdle = () => {
    clearTimeout(idleTimer);
    const hour = new Date().getHours();
    idleTimer = setTimeout(() => setPetState(hour >= 23 || hour < 6 ? "sleep" : "angry"), 1000 * 60 * 30);
  };
  ["click", "keydown", "mousemove", "touchstart"].forEach((eventName) => window.addEventListener(eventName, resetIdle, { passive: true }));
  resetIdle();
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return `${year}年${month}月${day}日`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.background = isError ? "#b74343" : "#3d3025";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

document.addEventListener("DOMContentLoaded", init);
