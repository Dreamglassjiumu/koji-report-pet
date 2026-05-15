const STORAGE_KEYS = {
  records: "kojiReportPet.records",
  settings: "kojiReportPet.settings",
  reports: "kojiReportPet.reports",
};

const defaultTags = ["默认", "Project：X", "公司工作", "pitch创作", "物件包装", "玩法包装", "资料整理", "会议总结", "剧本创作", "角色包装", "文档处理"];
const defaultReportFormat = {
  title: "",
  includeDate: true,
  includeTomorrowPlan: true,
  includeIssues: true,
  outputPreference: "natural",
  closing: "",
};
const defaultSettings = {
  username: "",
  defaultTemplate: "formal",
  customTags: [],
  animationsEnabled: true,
  kojiMotionLevel: "normal",
  petMinimized: false,
  reportFormat: { ...defaultReportFormat },
  kojiTone: "default",
  dialogueTone: "default",
  hourlyChimeEnabled: false,
  currentCharacter: "koji",
  currentSkin: "default",
  lastHourlyChimeKey: "",
};

const templateNames = {
  formal: "正式日报",
  brief: "简洁日报",
  detailed: "详细日报",
  copywriting: "文案组日报",
  feedback: "问题反馈型日报",
};

const categoryRules = [
  { name: "资料整理", keywords: ["整理", "梳理", "归档", "收集", "资料", "文档", "导入", "索引", "解析", "资料库"] },
  { name: "功能优化", keywords: ["优化", "调整", "完善", "改进", "升级", "迭代", "交互", "界面", "体验", "逻辑", "工具"] },
  { name: "测试验证", keywords: ["测试", "验证", "检查", "验收", "确认", "排查", "复测", "预览", "失败"] },
  { name: "沟通协作", keywords: ["讨论", "沟通", "对齐", "会议", "同步", "反馈", "确认", "评审", "协作"] },
  { name: "文案创作", keywords: ["撰写", "创作", "补充", "设计", "设定", "剧情", "角色", "世界观", "台词", "文本", "脚本", "pitch", "Pitch", "叙事"] },
  { name: "问题修复", keywords: ["修复", "解决", "排查", "处理", "报错", "bug", "Bug", "问题", "异常", "乱码", "阻塞"] },
];

const issueKeywords = ["问题", "异常", "bug", "Bug", "BUG", "乱码", "失败", "修复", "排查", "报错", "阻塞", "错误"];

const kojiConfig = window.KojiConfig;
const stateOrder = kojiConfig.stateOrder;
const petStates = kojiConfig.petStates;
const characterOptions = kojiConfig.characters;

let records = {};
let reports = {};
let settings = { ...defaultSettings };
let selectedHistoryDate = "";
let petTimer = null;
let idleTimer = null;
let toastIndex = 0;
let isApplyingDesktopPetState = false;

const $ = (selector) => document.querySelector(selector);

function init() {
  if (window.kojiDesktop) document.body.classList.add("electron-desktop-mode");
  records = loadRecords();
  reports = loadReports();
  settings = loadSettings();
  selectedHistoryDate = getTodayKey();

  $("#todayDate").textContent = `${formatDate(getTodayKey())} · ${formatWeekday(getTodayKey())}`;
  bindEvents();
  renderTagOptions();
  renderTodayRecords();
  renderHistory();
  renderSettings();
  $("#templateSelect").value = settings.defaultTemplate;
  $("#reportOutput").value = getLatestReport(getTodayKey())?.content || "";
  makePetDraggable();
  applyPetMinimized();
  setPetState("wave");
  setupDesktopBridge();
  setupIdleWatcher();
}

function bindEvents() {
  $("#recordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addRecord();
  });
  $("#recordText").addEventListener("focus", () => setPetState("record_ready"));
  $("#templateSelect").addEventListener("change", (event) => {
    settings.defaultTemplate = event.target.value;
    saveSettings();
    setPetState("thinking");
  });
  $("#generateBtn").addEventListener("click", generateReport);
  $("#generateBriefBtn").addEventListener("click", generateBrief);
  $("#generateWeeklyBtn").addEventListener("click", generateWeeklyMaterial);
  $("#saveReportBtn").addEventListener("click", saveCurrentReport);
  $("#copyReportBtn").addEventListener("click", () => copyReport($("#reportOutput").value));
  $("#copyGptPromptBtn").addEventListener("click", copyGptPrompt);
  $("#exportTxtBtn").addEventListener("click", exportReportTxt);
  $("#exportMarkdownBtn").addEventListener("click", exportReportMarkdown);
  $("#nudgePetBtn").addEventListener("click", () => setPetState("angry"));
  $("#petRecordBtn").addEventListener("click", () => focusRecordBox());
  $("#petNudgeBtn").addEventListener("click", () => setPetState("angry"));
  $("#petToggleBtn").addEventListener("click", togglePetMinimized);
  $("#petMiniButton").addEventListener("click", togglePetMinimized);
  $("#kojiPet").addEventListener("mouseenter", () => !settings.petMinimized && setPetState("wave"));
  $("#kojiPet").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      settings.petMinimized ? togglePetMinimized() : focusRecordBox();
    }
  });
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-");
  return `${year}年${month}月${day}日`;
}

function formatWeekday(dateKey) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekdays[new Date(`${dateKey}T12:00:00`).getDay()];
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
  const stored = safeReadJson(STORAGE_KEYS.settings, {});
  return {
    ...defaultSettings,
    ...stored,
    reportFormat: { ...defaultReportFormat, ...(stored.reportFormat || {}) },
    kojiTone: "default",
    dialogueTone: "default",
    hourlyChimeEnabled: Boolean(stored.hourlyChimeEnabled),
    kojiMotionLevel: stored.kojiMotionLevel || (stored.animationsEnabled === false ? "off" : "normal"),
    animationsEnabled: stored.kojiMotionLevel ? stored.kojiMotionLevel !== "off" : stored.animationsEnabled !== false,
    currentCharacter: stored.currentCharacter || "koji",
    currentSkin: stored.currentSkin || "default",
    lastHourlyChimeKey: stored.lastHourlyChimeKey || "",
  };
}

function saveSettings() {
  const ok = safeWriteJson(STORAGE_KEYS.settings, settings);
  if (ok) window.kojiDesktop?.broadcastSettings?.(settings);
  return ok;
}

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    console.warn(`读取 ${key} 失败`, error);
    showToast("localStorage 解析失败，已使用默认数据。", "error");
    setPetState("error");
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`保存 ${key} 失败`, error);
    showToast("保存失败，请检查浏览器存储空间。", "error");
    setPetState("error");
    return false;
  }
}

function renderTodayRecords() {
  const today = getTodayKey();
  const list = records[today] || [];
  const container = $("#todayRecords");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><strong>Koji 还没收到今天的记录。</strong><span>先写一条，晚上就不用现编啦。</span></div>`;
    return;
  }

  container.innerHTML = list
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((record) => `
      <article class="record-item">
        <div class="record-time">${escapeHtml(record.time)}</div>
        <div class="record-main">
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
      if (button.dataset.action === "edit") editRecord(button.dataset.id);
      if (button.dataset.action === "delete") deleteRecord(button.dataset.id);
    });
  });
}

function renderHistory() {
  const dates = Array.from(new Set([...Object.keys(records), ...Object.keys(reports)])).sort().reverse();
  const datesContainer = $("#historyDates");
  if (dates.length === 0) {
    datesContainer.innerHTML = `<div class="empty-state"><strong>暂无历史记录。</strong><span>今天新增事项后，这里会出现日期档案。</span></div>`;
    $("#historyDetail").innerHTML = `<div class="empty-state"><strong>还没有可查看的日报。</strong><span>Koji 会把每天的事项和日报一起收好。</span></div>`;
    return;
  }

  if (!dates.includes(selectedHistoryDate)) selectedHistoryDate = dates[0];
  datesContainer.innerHTML = dates.map((date) => renderHistoryDateButton(date)).join("");
  datesContainer.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedHistoryDate = button.dataset.date;
      setPetState("thinking");
      renderHistory();
    });
  });
  renderHistoryDetail(selectedHistoryDate);
}

function renderHistoryDateButton(date) {
  const count = (records[date] || []).length;
  const hasReport = (reports[date] || []).length > 0;
  const activeClass = selectedHistoryDate === date ? " active" : "";
  return `<button class="history-date-btn${activeClass}" type="button" data-date="${date}">
    <strong>${formatDate(date)}</strong>
    <span>${formatWeekday(date)} · ${count} 条事项 · ${hasReport ? "已保存日报" : "未保存日报"}</span>
  </button>`;
}

function renderHistoryDetail(date) {
  const dayRecords = records[date] || [];
  const dayReports = reports[date] || [];
  const latest = dayReports[dayReports.length - 1];
  $("#historyDetail").classList.remove("empty-state");
  $("#historyDetail").innerHTML = `
    <div class="history-detail-head">
      <div>
        <h3>${formatDate(date)}</h3>
        <p>${formatWeekday(date)} · ${dayRecords.length} 条事项 · ${dayReports.length} 份已保存日报</p>
      </div>
    </div>
    <h4>当天事项</h4>
    <div class="record-list compact-list">
      ${dayRecords.length ? dayRecords.map((item) => `<div class="record-item"><span class="record-time">${escapeHtml(item.time)}</span><div class="record-main"><span class="tag-pill">${escapeHtml(item.tag || "默认")}</span><p class="record-text">${escapeHtml(item.text)}</p></div></div>`).join("") : `<div class="empty-state">这一天没有事项记录。</div>`}
    </div>
    <h4>已保存日报</h4>
    <textarea class="history-report" rows="8" readonly>${latest ? escapeHtml(latest.content) : "这一天还没有保存日报。"}</textarea>
    <div class="button-row">
      <button class="secondary-btn" type="button" id="copyHistoryReport" ${latest ? "" : "disabled"}>复制日报</button>
      <button class="secondary-btn" type="button" id="exportHistoryReport" ${latest ? "" : "disabled"}>导出该日日报</button>
      <button class="danger-btn" type="button" id="deleteHistoryDate">删除当日数据</button>
    </div>
  `;
  $("#copyHistoryReport")?.addEventListener("click", () => copyReport(latest.content));
  $("#exportHistoryReport")?.addEventListener("click", () => exportSpecificMarkdown(date, latest.content, dayRecords));
  $("#deleteHistoryDate")?.addEventListener("click", () => deleteDateData(date));
}

function renderSettings() {
  const tagValue = settings.customTags.join("，");
  const format = settings.reportFormat;
  $("#settingsPanel").innerHTML = `
    <div class="setting-box">
      <h3>基础设置</h3>
      <label for="usernameInput">用户名</label>
      <input id="usernameInput" type="text" value="${escapeHtml(settings.username)}" placeholder="例如：小林">
      <label for="defaultTemplateInput">默认模板</label>
      <select id="defaultTemplateInput">
        ${Object.entries(templateNames).map(([key, name]) => `<option value="${key}" ${settings.defaultTemplate === key ? "selected" : ""}>${name}</option>`).join("")}
      </select>
      <label for="kojiMotionLevelInput">Koji 动画强度</label>
      <select id="kojiMotionLevelInput">
        <option value="off" ${settings.kojiMotionLevel === "off" ? "selected" : ""}>关闭</option>
        <option value="subtle" ${settings.kojiMotionLevel === "subtle" ? "selected" : ""}>轻微</option>
        <option value="normal" ${settings.kojiMotionLevel === "normal" ? "selected" : ""}>标准</option>
        <option value="lively" ${settings.kojiMotionLevel === "lively" ? "selected" : ""}>活泼</option>
      </select>
      <label class="check-line"><input id="hourlyChimeInput" type="checkbox" ${settings.hourlyChimeEnabled ? "checked" : ""}> 启用整点报时</label>
      <p>当前版本只显示文字气泡，不播放真实语音；Koji 使用统一默认台词池。</p>
    </div>
    <div class="setting-box">
      <h3>自定义标签</h3>
      <label for="customTagsInput">标签（用逗号或顿号分隔）</label>
      <textarea id="customTagsInput" rows="4" placeholder="例如：世界观，剧情稿，工具验证">${escapeHtml(tagValue)}</textarea>
      <p>保存后会出现在“项目标签”下拉框里。</p>
      <button id="saveSettingsBtn" type="button" class="primary-btn">保存设置</button>
    </div>
    <div class="setting-box wide-setting">
      <h3>自定义日报格式</h3>
      <div class="settings-mini-grid">
        <label>日报开头称呼/标题<input id="formatTitleInput" type="text" value="${escapeHtml(format.title)}" placeholder="例如：今日工作汇报"></label>
        <label>输出偏好<select id="formatPreferenceInput">
          <option value="formal" ${format.outputPreference === "formal" ? "selected" : ""}>更正式</option>
          <option value="brief" ${format.outputPreference === "brief" ? "selected" : ""}>更简洁</option>
          <option value="detailed" ${format.outputPreference === "detailed" ? "selected" : ""}>更详细</option>
          <option value="natural" ${format.outputPreference === "natural" ? "selected" : ""}>更自然</option>
        </select></label>
        <label>常用结尾语<input id="formatClosingInput" type="text" value="${escapeHtml(format.closing)}" placeholder="例如：以上为今日日报。"></label>
      </div>
      <div class="check-grid">
        <label class="check-line"><input id="includeDateInput" type="checkbox" ${format.includeDate ? "checked" : ""}> 包含日期</label>
        <label class="check-line"><input id="includePlanInput" type="checkbox" ${format.includeTomorrowPlan ? "checked" : ""}> 包含明日计划</label>
        <label class="check-line"><input id="includeIssuesInput" type="checkbox" ${format.includeIssues ? "checked" : ""}> 包含问题反馈</label>
      </div>
    </div>
    <div class="setting-box wide-setting">
      <h3>Koji 角色 / 皮肤</h3>
      <p>当前角色：<strong>${escapeHtml(characterOptions.koji.displayName)}</strong> · 当前皮肤：<strong>${escapeHtml(characterOptions.koji.skins.default.displayName)}</strong></p>
      <p>新角色与 Koji cosplay 皮肤系统：预留中。当前保持 <code>assets/koji/</code> 兼容，未来可扩展到 <code>assets/characters/koji/default/</code>。</p>
      <input id="currentCharacterInput" type="hidden" value="${escapeHtml(settings.currentCharacter)}">
      <input id="currentSkinInput" type="hidden" value="${escapeHtml(settings.currentSkin)}">
    </div>
    <div class="setting-box wide-setting">
      <h3>Koji 动作测试与素材检查</h3>
      <div id="petActionTester" class="pet-action-grid"></div>
      <button id="refreshAssetStatusBtn" type="button" class="secondary-btn">刷新素材状态</button>
      <div id="petAssetChecklist" class="pet-asset-checklist"></div>
    </div>
    <div class="setting-box danger-zone">
      <h3>危险操作</h3>
      <p>清空后无法恢复，请确认已自行备份。</p>
      <button id="clearAllBtn" type="button" class="danger-btn">清空全部本地数据</button>
    </div>
  `;

  renderPetActionTester();
  $("#saveSettingsBtn").addEventListener("click", persistSettingsFromPanel);
  $("#clearAllBtn").addEventListener("click", clearAllData);
  $("#refreshAssetStatusBtn")?.addEventListener("click", renderPetActionTester);
  ["usernameInput", "defaultTemplateInput", "kojiMotionLevelInput", "hourlyChimeInput", "formatTitleInput", "formatPreferenceInput", "formatClosingInput", "includeDateInput", "includePlanInput", "includeIssuesInput", "customTagsInput"].forEach((id) => {
    $(`#${id}`).addEventListener("change", persistSettingsFromPanel);
  });
}

function renderPetActionTester() {
  const panel = $("#petActionTester");
  if (!panel) return;
  panel.innerHTML = stateOrder.map((stateKey) => {
    const state = petStates[stateKey];
    return `<button type="button" class="tiny-btn" data-state="${state.key}">${state.emoji} ${state.label}</button>`;
  }).join("");
  panel.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => setPetState(button.dataset.state)));
  renderAssetChecklist();
}

async function renderAssetChecklist() {
  const checklist = $("#petAssetChecklist");
  if (!checklist) return;
  checklist.innerHTML = `<strong>Koji 素材检查</strong><p>检测中：优先级 webp &gt; gif &gt; png &gt; idle &gt; emoji。</p>`;
  const rows = await Promise.all(stateOrder.map((stateKey) => resolveAssetForState(stateKey)));
  checklist.innerHTML = `
    <strong>Koji 素材检查</strong>
    <p>优先级：<code>assets/koji/{state}.webp</code> → <code>.gif</code> → <code>.png</code> → <code>idle</code> → emoji。</p>
    <div class="asset-status-grid">
      ${rows.map((row) => `
        <article class="asset-status-card ${row.hasDedicated ? "asset-ok" : "asset-fallback"}">
          <div><strong>${escapeHtml(row.state.key)}</strong><span>${escapeHtml(row.state.label)}</span></div>
          <p>${row.hasDedicated ? "检测到专属素材" : row.path ? "未检测到专属素材" : "未检测到图片素材"}</p>
          <code>${escapeHtml(row.path || row.state.emoji)}</code>
          <small>${escapeHtml(row.note)}</small>
          <button type="button" class="tiny-btn" data-state="${escapeHtml(row.state.key)}">测试动作</button>
        </article>
      `).join("")}
    </div>
  `;
  checklist.querySelectorAll("button[data-state]").forEach((button) => button.addEventListener("click", () => setPetState(button.dataset.state)));
}

async function resolveAssetForState(stateKey) {
  const state = petStates[stateKey] || petStates.idle;
  const dedicated = kojiConfig.getAssetCandidates(state.key, settings.currentCharacter, settings.currentSkin);
  const dedicatedPath = await firstLoadableImage(dedicated);
  if (dedicatedPath) return { state, hasDedicated: true, path: dedicatedPath, note: "使用专属素材" };
  if (state.key !== "idle") {
    const idlePath = await firstLoadableImage(kojiConfig.getAssetCandidates("idle", settings.currentCharacter, settings.currentSkin));
    if (idlePath) return { state, hasDedicated: false, path: idlePath, note: "回退到 idle 素材" };
  }
  return { state, hasDedicated: false, path: "", note: "回退 emoji" };
}

function firstLoadableImage(paths) {
  return new Promise((resolve) => {
    let index = 0;
    const tryNext = () => {
      if (index >= paths.length) return resolve("");
      const img = new Image();
      img.onload = () => resolve(paths[index]);
      img.onerror = () => { index += 1; tryNext(); };
      img.src = paths[index];
    };
    tryNext();
  });
}

function createRecord(text, tag) {
  const now = new Date();
  return {
    id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    text,
    tag,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    createdAt: now.getTime(),
  };
}

function persistRecord(text, tag) {
  const today = getTodayKey();
  const record = createRecord(text, tag || "默认");
  records[today] = [...(records[today] || []), record];
  if (!saveRecords()) return null;
  renderTodayRecords();
  renderHistory();
  return record;
}

function addRecord() {
  const text = $("#recordText").value.trim();
  const tag = $("#recordTag").value || "默认";
  if (!text) {
    showToast("先写一点今天做了什么吧。", "warning");
    setPetState("confused");
    return;
  }
  if (persistRecord(text, tag)) {
    $("#recordText").value = "";
    showToast("添加成功，Koji 记下来了。", "success");
    setPetState("success");
  }
}

function addRecordFromPet(text, tag = "公司工作") {
  const cleanText = String(text || "").trim();
  if (!cleanText) {
    showToast("你还什么都没说呢。", "warning");
    setPetState("confused");
    return { ok: false, message: "你还什么都没说呢。" };
  }
  const record = persistRecord(cleanText, tag || "公司工作");
  if (!record) return { ok: false, message: "保存失败。" };
  showToast("Koji 快速记录成功。", "success");
  setPetState("collect");
  return { ok: true, record };
}

function editRecord(id) {
  const today = getTodayKey();
  const list = records[today] || [];
  const target = list.find((item) => item.id === id);
  if (!target) return;
  const nextText = prompt("编辑这条事项：", target.text);
  if (nextText === null) return;
  target.text = nextText.trim() || target.text;
  if (saveRecords()) {
    renderTodayRecords();
    renderHistory();
    showToast("事项已更新。", "success");
    setPetState("success");
  }
}

function deleteRecord(id) {
  const today = getTodayKey();
  records[today] = (records[today] || []).filter((item) => item.id !== id);
  if (records[today].length === 0) delete records[today];
  if (saveRecords()) {
    renderTodayRecords();
    renderHistory();
    showToast("事项已删除。", "info");
    setPetState("thinking");
  }
}

function generateReport() {
  const todayRecords = records[getTodayKey()] || [];
  if (todayRecords.length === 0) {
    showToast("今天还没有记录，先添加事项再生成日报。", "warning");
    setPetState("confused");
    return;
  }
  setPetState("writing");
  const template = $("#templateSelect").value;
  const grouped = groupRecordsByCategory(todayRecords);
  const categories = Object.keys(grouped);
  const issues = detectIssues(todayRecords);
  const format = settings.reportFormat;
  let report = "";

  if (template === "brief") {
    report = `${generateSummaryOpening(categories, todayRecords)}${categories.map((category) => generateCategorySentence(category, grouped[category])).join("；")}。`;
  } else if (template === "detailed") {
    report = `今日重点：\n${generateSummaryOpening(categories, todayRecords)}\n\n具体推进：\n${categories.map((category) => `- ${category}：${grouped[category].map(formatRecordText).join("；")}`).join("\n")}`;
    if (format.includeTomorrowPlan) report += `\n\n后续计划：\n${generateFollowUpPlan(todayRecords)}`;
  } else if (template === "copywriting") {
    report = `今天主要围绕${categories.join("、")}推进文案组相关工作，重点放在叙事资料整理、内容生产、设定对齐和工具验证上。\n\n${categories.map((category) => `- ${category}：${generateCategorySentence(category, grouped[category])}`).join("\n")}`;
    if (format.includeTomorrowPlan) report += `\n\n后续会继续补齐关键资料、同步设定口径，并根据验证结果调整后续文本生产节奏。`;
  } else if (template === "feedback") {
    const normalRecords = todayRecords.filter((record) => !issues.includes(record));
    report = `今日完成：\n${normalRecords.length ? groupRecordsByCategory(normalRecords, true).map(([category, list]) => `- ${category}：${list.map(formatRecordText).join("；")}`).join("\n") : "- 今日主要精力集中在问题排查与验证。"}`;
    if (format.includeIssues) report += `\n\n发现问题：\n${issues.length ? issues.map((item) => `- ${formatRecordText(item)}`).join("\n") : "- 暂无明显阻塞问题。"}`;
    if (format.includeTomorrowPlan) report += `\n\n后续计划：\n${generateFollowUpPlan(todayRecords)}`;
  } else {
    report = `${generateSummaryOpening(categories, todayRecords)}\n\n${categories.map((category) => generateCategorySentence(category, grouped[category])).join("\n")}`;
    if (format.includeIssues && issues.length) report += `\n\n过程中同步关注到 ${issues.length} 项问题或验证事项，已纳入后续排查与跟进。`;
    if (format.includeTomorrowPlan) report += `\n\n${generateFollowUpPlan(todayRecords)}`;
  }

  report = applyReportFormat(report, template);
  $("#reportOutput").value = report;
  showToast("日报已生成，可以继续手动微调。", "success");
}

function generateBrief() {
  const todayRecords = records[getTodayKey()] || [];
  if (todayRecords.length === 0) {
    showToast("没有记录，暂时生成不了今日简报。", "warning");
    setPetState("confused");
    return;
  }
  const grouped = groupRecordsByCategory(todayRecords);
  const bullets = Object.keys(grouped).slice(0, 5).map((category) => `- ${category}：${grouped[category].slice(0, 2).map(formatRecordText).join("；")}`);
  $("#reportOutput").value = `【今日简报】\n${bullets.join("\n")}`;
  showToast("今日简报已生成。", "success");
  setPetState("happy");
}

function generateWeeklyMaterial() {
  const today = new Date(`${getTodayKey()}T12:00:00`);
  const recentKeys = [];
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    recentKeys.push(day.toISOString().slice(0, 10));
  }
  const weeklyRecords = recentKeys.flatMap((date) => (records[date] || []).map((record) => ({ ...record, date })));
  if (weeklyRecords.length === 0) {
    $("#reportOutput").value = "【近 7 日工作素材】\n最近 7 天还没有记录到足够素材。先坚持随手记录，Koji 才能帮你攒周报。";
    showToast("最近 7 天没有足够记录。", "warning");
    setPetState("confused");
    return;
  }
  const grouped = groupRecordsByCategory(weeklyRecords);
  const sections = Object.entries(grouped).map(([category, list], index) => `${toChineseNumber(index + 1)}、${category}\n${list.map((record) => `- ${record.date.slice(5)}：${formatRecordText(record)}`).join("\n")}`);
  $("#reportOutput").value = `【近 7 日工作素材】\n${sections.join("\n\n")}`;
  showToast("周报素材已生成。", "success");
  setPetState("happy");
}

function copyReport(content = $("#reportOutput").value) {
  const text = content.trim();
  if (!text) {
    showToast("没有可复制的日报内容。", "warning");
    setPetState("confused");
    return;
  }
  copyText(text, "复制成功。", () => setPetState("happy"));
}

function copyGptPrompt() {
  const todayRecords = records[getTodayKey()] || [];
  const draft = $("#reportOutput").value.trim();
  if (todayRecords.length === 0 && !draft) {
    showToast("先添加事项或生成日报，再复制润色提示词。", "warning");
    setPetState("confused");
    return;
  }
  const grouped = groupRecordsByCategory(todayRecords);
  const promptText = `请根据以下信息，帮我润色一版中文工作日报。\n要求：\n1. 不要编造不存在的工作内容。\n2. 保留事实，但可以优化表达。\n3. 语气适合公司内部日报。\n4. 输出不要太夸张，不要像宣传稿。\n5. 使用我选择的模板风格：${templateNames[$("#templateSelect").value]}。\n\n【日期】\n${formatDate(getTodayKey())}\n\n【用户名】\n${settings.username || "未填写"}\n\n【今日事项】\n${todayRecords.length ? todayRecords.map((record) => `- ${record.time} ${record.tag || "默认"} ${record.text}`).join("\n") : "- 未填写事项，仅根据系统初稿润色"}\n\n【分类结果】\n${Object.entries(grouped).map(([category, list]) => `- ${category}：${list.map(formatRecordText).join("；")}`).join("\n") || "暂无分类"}\n\n【系统初稿】\n${draft || "暂无初稿"}\n\n请输出最终日报。`;
  copyText(promptText, "已复制给 GPT 润色的提示词", () => setPetState("happy"));
}

function exportReportTxt() {
  const content = $("#reportOutput").value.trim();
  if (!content) return warnEmptyReport();
  downloadTextFile(`koji-report-${getTodayKey()}.txt`, content);
  showToast("TXT 已导出。", "success");
  setPetState("success");
}

function exportReportMarkdown() {
  const content = $("#reportOutput").value.trim();
  if (!content) return warnEmptyReport();
  const markdown = buildMarkdown(getTodayKey(), content, records[getTodayKey()] || []);
  downloadTextFile(`koji-report-${getTodayKey()}.md`, markdown);
  showToast("Markdown 已导出。", "success");
  setPetState("success");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function classifyRecord(record) {
  const text = `${record.tag || ""} ${record.text || ""}`;
  const matched = categoryRules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  return matched ? matched.name : "其他工作";
}

function groupRecordsByCategory(list, asEntries = false) {
  const grouped = list.reduce((acc, record) => {
    const category = classifyRecord(record);
    acc[category] = acc[category] || [];
    acc[category].push(record);
    return acc;
  }, {});
  return asEntries ? Object.entries(grouped) : grouped;
}

function generateSummaryOpening(categories, list) {
  const username = settings.username ? `${settings.username}今日` : "今日";
  const scope = categories.length > 1 ? categories.slice(0, 3).join("、") : (categories[0] || "日常工作");
  const preference = settings.reportFormat.outputPreference;
  if (preference === "brief") return `${username}主要推进了${scope}等工作，共记录 ${list.length} 项事项，整体进展平稳。`;
  if (preference === "formal") return `${username}围绕${scope}有序推进相关工作，共完成和跟进 ${list.length} 项事项，重点覆盖执行落地、沟通对齐与结果确认。`;
  return `${username}的工作重心集中在${scope}，一边推进具体产出，一边同步处理过程中的确认与验证。`;
}

function generateCategorySentence(category, list) {
  const samples = list.map(formatRecordText);
  const joined = samples.slice(0, 3).join("；");
  const suffix = samples.length > 3 ? `等 ${samples.length} 项内容` : "";
  const leadMap = {
    资料整理: "资料侧主要完成",
    功能优化: "功能与体验侧推进",
    测试验证: "测试验证方面跟进",
    沟通协作: "沟通协作方面完成",
    文案创作: "文案与叙事内容方面推进",
    问题修复: "问题处理方面重点跟进",
    其他工作: "其他工作同步处理",
  };
  return `${leadMap[category] || `${category}方面推进`}${joined}${suffix ? `，并覆盖${suffix}。` : "。"}`;
}

function generateFollowUpPlan(list) {
  const grouped = groupRecordsByCategory(list);
  const categories = Object.keys(grouped).slice(0, 3);
  if (categories.length === 0) return "明日继续补充事项记录，并根据优先级推进后续工作。";
  return `后续计划继续围绕${categories.join("、")}做收尾确认，优先补齐未闭环内容，并把需要同步的问题及时反馈给相关同事。`;
}

function detectIssues(list) {
  return list.filter((record) => issueKeywords.some((keyword) => `${record.tag || ""} ${record.text}`.includes(keyword)));
}

function formatRecordText(record) {
  const text = (record.text || "").replace(/\s+/g, " ").trim();
  return `${record.time ? `${record.time} ` : ""}${record.tag && record.tag !== "默认" ? `【${record.tag}】` : ""}${text}`;
}

function getPetAssetCandidates(state) {
  return kojiConfig.getAssetCandidates(state.key, settings.currentCharacter, settings.currentSkin);
}

function renderPetFace(face, state) {
  const candidates = [...getPetAssetCandidates(state)];
  if (state.key !== "idle") candidates.push(...kojiConfig.getAssetCandidates("idle", settings.currentCharacter, settings.currentSkin));
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

function getMotionLevel(level = settings.kojiMotionLevel) {
  return ["off", "subtle", "normal", "lively"].includes(level) ? level : "normal";
}

function setPetState(stateKey, overrideDuration) {
  const state = petStates[stateKey] || petStates.idle;
  if (!isApplyingDesktopPetState) window.kojiDesktop?.setPetState?.(state.key);
  const pet = $("#kojiPet");
  const face = $("#petFace");
  const avatar = $("#petAvatar");
  clearTimeout(petTimer);
  pet.className = `koji-pet ${state.cssClass} state-${state.key.replace(/_/g, "-")} motion-${getMotionLevel()} ${settings.petMinimized ? "pet-minimized" : ""}`;
  $("#petBubble").textContent = kojiConfig.getDialogue(state.key, "default", state.message);
  $("#petLabel").textContent = state.label;
  $("#petMiniButton").textContent = state.emoji;
  avatar.className = `pet-avatar ${state.cssClass}`;
  renderPetFace(face, state);
  const duration = typeof overrideDuration === "number" ? overrideDuration : state.duration;
  if (duration > 0 && state.key !== "idle") {
    petTimer = setTimeout(() => setPetState("idle"), duration);
  }
}

function makePetDraggable() {
  const pet = $("#kojiPet");
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startRight = 0;
  let startBottom = 0;

  pet.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startRight = parseFloat(getComputedStyle(pet).right) || 20;
    startBottom = parseFloat(getComputedStyle(pet).bottom) || 20;
    pet.setPointerCapture(event.pointerId);
    setPetState("drag", 0);
  });
  pet.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const bounds = pet.getBoundingClientRect();
    const maxRight = Math.max(8, window.innerWidth - bounds.width - 8);
    const maxBottom = Math.max(8, window.innerHeight - bounds.height - 8);
    const nextRight = Math.max(8, Math.min(maxRight, startRight - (event.clientX - startX)));
    const nextBottom = Math.max(8, Math.min(maxBottom, startBottom - (event.clientY - startY)));
    pet.style.right = `${nextRight}px`;
    pet.style.bottom = `${nextBottom}px`;
  });
  pet.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    setPetState("idle");
  });
}

function showToast(message, type = "info") {
  const container = $("#toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.dataset.id = String(toastIndex += 1);
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function saveCurrentReport() {
  const content = $("#reportOutput").value.trim();
  if (!content) return warnEmptyReport();
  const today = getTodayKey();
  reports[today] = [...(reports[today] || []), { id: String(Date.now()), content, template: $("#templateSelect").value, createdAt: Date.now() }];
  if (saveReports()) {
    renderHistory();
    showToast("日报已保存。", "success");
    setPetState("success");
  }
}

function renderTagOptions() {
  const tags = [...new Set([...defaultTags, ...settings.customTags])].filter(Boolean);
  $("#recordTag").innerHTML = tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("");
}

function persistSettingsFromPanel() {
  settings.username = $("#usernameInput").value.trim();
  settings.defaultTemplate = $("#defaultTemplateInput").value;
  settings.kojiMotionLevel = getMotionLevel($("#kojiMotionLevelInput")?.value);
  settings.animationsEnabled = settings.kojiMotionLevel !== "off";
  settings.dialogueTone = "default";
  settings.kojiTone = "default";
  settings.hourlyChimeEnabled = Boolean($("#hourlyChimeInput")?.checked);
  settings.currentCharacter = $("#currentCharacterInput")?.value || "koji";
  settings.currentSkin = $("#currentSkinInput")?.value || "default";
  settings.customTags = $("#customTagsInput").value.split(/[，,、\n]/).map((tag) => tag.trim()).filter(Boolean);
  settings.reportFormat = {
    title: $("#formatTitleInput").value.trim(),
    includeDate: $("#includeDateInput").checked,
    includeTomorrowPlan: $("#includePlanInput").checked,
    includeIssues: $("#includeIssuesInput").checked,
    outputPreference: $("#formatPreferenceInput").value,
    closing: $("#formatClosingInput").value.trim(),
  };
  if (saveSettings()) {
    renderTagOptions();
    $("#templateSelect").value = settings.defaultTemplate;
    showToast("设置保存成功。", "success");
    setPetState("success");
  }
}

function applyReportFormat(report, template) {
  const format = settings.reportFormat;
  const lines = [];
  if (format.title) lines.push(format.title);
  if (format.includeDate) lines.push(`日期：${formatDate(getTodayKey())}`);
  if (lines.length) lines.push("");
  let body = report.trim();
  if (template === "brief" || format.outputPreference === "brief") body = body.replace(/\n+/g, " ");
  if (format.closing) body += `\n\n${format.closing}`;
  return `${lines.join("\n")}${body}`.trim();
}

function buildMarkdown(date, content, list) {
  return `# Koji 日报 ${date}\n\n## 今日日报\n\n${content}\n\n## 今日事项\n\n${list.length ? list.map((record) => `- ${record.time} ${record.tag || "默认"} ${record.text}`).join("\n") : "- 暂无事项记录"}\n`;
}

function exportSpecificMarkdown(date, content, list) {
  if (!content) return warnEmptyReport();
  downloadTextFile(`koji-report-${date}.md`, buildMarkdown(date, content, list));
  showToast("历史日报已导出。", "success");
  setPetState("happy");
}

function deleteDateData(date) {
  const confirmed = confirm(`确定删除 ${formatDate(date)} 的事项和日报吗？此操作不可恢复。`);
  if (!confirmed) return;
  setPetState("thinking");
  delete records[date];
  delete reports[date];
  saveRecords();
  saveReports();
  selectedHistoryDate = getTodayKey();
  renderTodayRecords();
  renderHistory();
  showToast("当日数据已删除。", "success");
  setPetState("success");
}

function clearAllData() {
  if (!confirm("确定清空全部本地数据吗？此操作不可恢复。")) return;
  records = {};
  reports = {};
  settings = loadSettings();
  localStorage.removeItem(STORAGE_KEYS.records);
  localStorage.removeItem(STORAGE_KEYS.reports);
  renderTodayRecords();
  renderHistory();
  $("#reportOutput").value = "";
  showToast("全部事项和日报已清空。", "success");
  setPetState("success");
}

function getLatestReport(date) {
  const list = reports[date] || [];
  return list[list.length - 1];
}

function focusRecordBox() {
  if (settings.petMinimized) togglePetMinimized();
  $("#recordText").focus();
  setPetState("record_ready");
}

function togglePetMinimized() {
  settings.petMinimized = !settings.petMinimized;
  saveSettings();
  applyPetMinimized();
  setPetState(settings.petMinimized ? "sleep" : "wave");
}

function applyPetMinimized() {
  $("#kojiPet").classList.toggle("pet-minimized", Boolean(settings.petMinimized));
  $("#petToggleBtn").textContent = settings.petMinimized ? "展开" : "收起";
}

function setupDesktopBridge() {
  window.kojiDesktop?.onQuickRecord?.((payload) => {
    const result = addRecordFromPet(payload?.text, payload?.tag);
    window.kojiDesktop?.sendQuickRecordResult?.(payload?.id, result);
  });
  window.kojiDesktop?.onDesktopCommand?.((command) => handleDesktopCommand(command));
  window.kojiDesktop?.onPetStateChanged?.((state) => {
    if (!petStates[state]) return;
    isApplyingDesktopPetState = true;
    setPetState(state);
    isApplyingDesktopPetState = false;
  });
}

function handleDesktopCommand(command) {
  const actions = {
    "focus-today": () => scrollToSection("todayRecordTitle"),
    "focus-settings": () => scrollToSection("settingsTitle"),
    "generate-report": generateReport,
    "copy-report": () => copyReport($("#reportOutput").value),
    "copy-gpt-prompt": copyGptPrompt,
    "export-txt": exportReportTxt,
    "export-markdown": exportReportMarkdown,
    "generate-brief": generateBrief,
    "generate-weekly": generateWeeklyMaterial,
  };
  if (!actions[command]) return;
  try {
    actions[command]();
  } catch (error) {
    console.error("桌宠命令执行失败", command, error);
    showToast("桌宠命令执行失败。", "error");
    setPetState("error");
  }
}

function scrollToSection(id) {
  const target = $(`#${id}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupIdleWatcher() {
  ["mousemove", "keydown", "click"].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setPetState("sleep"), 1000 * 60 * 8);
    });
  });
}

function copyText(text, successMessage, onSuccess) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage, "success");
      onSuccess?.();
    }).catch(() => fallbackCopy(text, successMessage, onSuccess));
  } else {
    fallbackCopy(text, successMessage, onSuccess);
  }
}

function fallbackCopy(text, successMessage, onSuccess) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast(successMessage, "success");
    onSuccess?.();
  } catch (error) {
    console.error("复制失败", error);
    showToast("复制失败，请手动选择文本。", "error");
    setPetState("error");
  } finally {
    textarea.remove();
  }
}

function warnEmptyReport() {
  showToast("请先生成或填写日报内容。", "warning");
  setPetState("confused");
}

function toChineseNumber(number) {
  return ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][number] || String(number);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

document.addEventListener("DOMContentLoaded", init);
