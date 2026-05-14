const STORAGE_KEYS = {
  records: "kojiReportPet.records",
  settings: "kojiReportPet.settings",
  reports: "kojiReportPet.reports",
};

const defaultTags = ["默认", "Project：X", "毛茸茸骑士", "公司工作", "个人创作", "会议沟通", "资料整理", "功能测试"];
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
  petMinimized: false,
  reportFormat: { ...defaultReportFormat },
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

const petStates = {
  idle: { key: "idle", label: "待机", emoji: "🐾", image: "", message: "来了，今天干啥了？", cssClass: "pet-idle", duration: 0, soundHint: "" },
  wave: { key: "wave", label: "打招呼", emoji: "👋", image: "", message: "嗨，我在右下角盯着日报。", cssClass: "pet-wave", duration: 1800, soundHint: "" },
  record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", image: "", message: "说吧，今天又干啥了？", cssClass: "pet-record-ready", duration: 2200, soundHint: "" },
  success: { key: "success", label: "记录成功", emoji: "✅", image: "", message: "这条我记下了。", cssClass: "pet-success", duration: 2200, soundHint: "" },
  thinking: { key: "thinking", label: "思考", emoji: "🤔", image: "", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking", duration: 1800, soundHint: "" },
  writing: { key: "writing", label: "写日报", emoji: "✍️", image: "", message: "日报我来写！", cssClass: "pet-writing", duration: 2400, soundHint: "" },
  happy: { key: "happy", label: "开心", emoji: "🎉", image: "", message: "复制好了，去交差吧！", cssClass: "pet-happy", duration: 2400, soundHint: "" },
  confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", image: "", message: "今天还啥都没记呢！", cssClass: "pet-confused", duration: 2600, soundHint: "" },
  angry: { key: "angry", label: "催日报", emoji: "😾", image: "", message: "你是不是又忘写日报了？", cssClass: "pet-angry", duration: 3000, soundHint: "" },
  sleep: { key: "sleep", label: "困倦", emoji: "💤", image: "", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep", duration: 2600, soundHint: "" },
  drag: { key: "drag", label: "被拖动", emoji: "🌀", image: "", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag", duration: 0, soundHint: "" },
  error: { key: "error", label: "报错", emoji: "⚠️", image: "", message: "哎呀，本地保存或复制好像失败了。", cssClass: "pet-error", duration: 3200, soundHint: "" },
};

let records = {};
let reports = {};
let settings = { ...defaultSettings };
let selectedHistoryDate = "";
let petTimer = null;
let idleTimer = null;
let toastIndex = 0;

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
  };
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
      <label class="check-line"><input id="animationsInput" type="checkbox" ${settings.animationsEnabled ? "checked" : ""}> 开启 Koji 动画</label>
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
      <h3>Koji 动作测试面板</h3>
      <div id="petActionTester" class="pet-action-grid"></div>
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
  ["usernameInput", "defaultTemplateInput", "animationsInput", "formatTitleInput", "formatPreferenceInput", "formatClosingInput", "includeDateInput", "includePlanInput", "includeIssuesInput", "customTagsInput"].forEach((id) => {
    $(`#${id}`).addEventListener("change", persistSettingsFromPanel);
  });
}

function renderPetActionTester() {
  const panel = $("#petActionTester");
  if (!panel) return;
  panel.innerHTML = Object.values(petStates).map((state) => `<button type="button" class="tiny-btn" data-state="${state.key}">${state.emoji} ${state.label}</button>`).join("");
  panel.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => setPetState(button.dataset.state)));
}

function addRecord() {
  const text = $("#recordText").value.trim();
  const tag = $("#recordTag").value || "默认";
  if (!text) {
    showToast("先写一点今天做了什么吧。", "warning");
    setPetState("confused");
    return;
  }
  const today = getTodayKey();
  const now = new Date();
  const record = { id: String(Date.now()), text, tag, time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, createdAt: now.getTime() };
  records[today] = [...(records[today] || []), record];
  if (saveRecords()) {
    $("#recordText").value = "";
    renderTodayRecords();
    renderHistory();
    showToast("添加成功，Koji 记下来了。", "success");
    setPetState("success");
  }
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
}

function exportReportMarkdown() {
  const content = $("#reportOutput").value.trim();
  if (!content) return warnEmptyReport();
  const markdown = buildMarkdown(getTodayKey(), content, records[getTodayKey()] || []);
  downloadTextFile(`koji-report-${getTodayKey()}.md`, markdown);
  showToast("Markdown 已导出。", "success");
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

function setPetState(stateKey, overrideDuration) {
  const state = petStates[stateKey] || petStates.idle;
  window.kojiDesktop?.setPetState?.(state.key);
  const pet = $("#kojiPet");
  const face = $("#petFace");
  const avatar = $("#petAvatar");
  clearTimeout(petTimer);
  pet.className = `koji-pet ${state.cssClass} ${settings.animationsEnabled ? "" : "pet-no-animation"} ${settings.petMinimized ? "pet-minimized" : ""}`;
  $("#petBubble").textContent = state.message;
  $("#petLabel").textContent = state.label;
  $("#petMiniButton").textContent = state.emoji;
  avatar.className = `pet-avatar ${state.cssClass}`;
  if (state.image) {
    face.innerHTML = `<img src="${state.image}" alt="${state.label}" onerror="this.replaceWith(document.createTextNode('${state.emoji}'))">`;
  } else {
    face.textContent = state.emoji;
  }
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
  settings.animationsEnabled = $("#animationsInput").checked;
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
