# Koji Report Pet

Koji Report Pet（中文名：Koji 日报桌宠助手）是一个纯本地的文案组日报桌宠助手。它面向日常工作记录场景：白天随手记录“今天做了什么”，晚上由本地模板和关键词规则整理生成中文日报。

当前版本：**Koji Report Pet v0.5.2 Koji 单一台词与文案组标签版**。

v0.5.2 在 v0.5.1 台词库接入版之上，简化 Koji 台词系统为一个统一默认模式，并将默认项目标签更新为更适合文案组日报记录的分类。

## 运行方式

首次运行请安装依赖：

```bash
npm install
```

启动 Electron 桌面应用：

```bash
npm start
```

开发时也可以运行：

```bash
npm run dev
```

## 网页预览方式

普通浏览器预览仍然保留：

```bash
python -m http.server 48763
```

然后打开：

```text
http://localhost:48763
```

网页预览不依赖 `window.kojiDesktop`，没有 Electron IPC 时不会报错；右下角网页 Koji 会作为降级体验保留。Electron 桌面版则隐藏网页 Koji，避免主窗口和独立桌宠同时抢视觉。


## v0.5.2 新增内容

- 简化 Koji 台词系统，只保留一个默认台词模式，不再暴露“标准 Koji / 更贱一点 / 更正经一点 / 中英日混合 / 少说话模式”选择。
- 默认台词模式融合网络梗、中英日混合、抽象梗和安全的 homo 梗风味，同时保持状态反馈清楚、公司内部可用。
- 移除语气风格选择，减少设置复杂度；旧 `dialogueTone` / `kojiTone` 本地字段会被兼容忽略，不影响启动。
- 保留整点报时开关，整点文案改为统一的打工人怪话风格，同一小时仍只提示一次，快速记录时不打断输入。
- 更新默认项目标签为文案组工作分类：默认、Project：X、公司工作、pitch创作、物件包装、玩法包装、资料整理、会议总结、剧本创作、角色包装、文档处理。
- 用户自定义标签继续保留；历史记录中已经存在的旧标签仍按原文本展示，不做强制迁移。

## v0.5.1 新增内容

- 新增 `data/koji-dialogues.js`，使用普通全局变量暴露 `KOJI_DIALOGUES`、`KOJI_HOURLY_DIALOGUES`、`KOJI_MEME_SAFE_POOL` 和 `KOJI_DIALOGUE_META`，兼容 Electron renderer 与普通浏览器预览。
- 正式接入 Koji 台词库：13 个状态在进入时会按当前语气模式随机抽取状态台词，并保留状态默认文案兜底。
- 支持 5 种 Koji 语气风格：标准 Koji、更贱一点、更正经一点、中英日混合、少说话模式；设置会保存到本地并通过 Electron IPC 同步到独立桌宠窗口。
- 支持整点报时文字气泡：默认关闭，只显示 Koji 气泡，不播放真实语音、不使用系统通知；同一小时只提示一次，快速记录框打开时不会打断输入。
- 支持抽象梗安全池低频混入：仅在 `sassy` 模式的部分状态中以低概率出现，不用于 `formal` / `quiet`，也不会替代错误提示。
- 优化独立桌宠气泡换行、高度和快速记录框同时显示时的占位，避免长台词撑破窗口或遮挡输入。
- 保留 `docs/koji-dialogue-library.md` 作为台词源文档；程序实际读取 `data/koji-dialogues.js`。

## v0.5 新增内容

- 新增 `koji-config.js` 统一配置 Koji 角色、13 个状态、台词池、整点报时台词、语气风格和皮肤基础结构。
- 13 个状态进入时会按当前“Koji 语气风格”随机显示状态台词；缺少台词时回退状态默认文案。
- 新增 Koji 语气风格设置：标准 Koji、更贱一点、更正经一点、中英日混合、少说话模式。
- 新增整点报时开关：默认关闭，只显示文字气泡，不播放真实语音；同一小时只报一次，快速记录输入框打开时不打断输入。
- 加强图片素材加载：按 `webp → gif → png → idle 素材 → emoji` 回退，不显示破图。
- 新增 Koji 素材检查面板：显示 13 个状态的专属素材检测结果、实际使用路径、回退说明，并可直接测试动作。
- 新增角色/皮肤配置雏形：当前默认 `koji/default` 继续兼容 `assets/koji/`，未来可扩展到 `assets/characters/koji/default/`、Koji cosplay 皮肤和新角色。
- 优化气泡换行与图片适配，减少长台词撑破窗口或遮挡快速记录输入的风险。

## Koji 角色人格与台词

Koji 在 v0.5 中不是严肃办公助手，而是文案组吉祥物：会耍宝、会轻微吐槽、会用中文 + English + 简单日语混合说怪话，但关键功能反馈保持清楚。角色规范见 [`docs/koji-character-spec.md`](docs/koji-character-spec.md)，台词源文档见 [`docs/koji-dialogue-library.md`](docs/koji-dialogue-library.md)。

v0.5.2 起程序只使用统一默认台词模式；旧版保存在 `kojiReportPet.settings` 中的语气字段会被兼容忽略。设置仍会通过 Electron IPC 同步到独立桌宠窗口；普通浏览器预览没有 IPC 时会安全降级。

## v0.4.1 修复内容

- 修复左键快速记录框被 pet 窗口底部裁切的问题，提示文案、输入框、项目标签下拉框和底部按钮完整显示。
- 快速记录时 `petWindow` 会从 compact 小尺寸临时展开到 quickInput 尺寸，避免表单被窗口边界遮挡。
- 关闭、取消、打开面板或成功记录后，`petWindow` 会恢复 compact 小尺寸，默认待机状态不臃肿。
- 展开 quickInput 时会检查屏幕可用工作区，靠近屏幕底部或右侧时自动回收窗口位置，确保桌宠完整可见。
- 优化单击 / 双击 / 拖动的交互冲突：单击延迟显示快速记录，双击取消单击任务，拖动和右键不会误触发快速记录。
- 保持右键菜单和 Koji 动作菜单可用，桌宠透明背景和无黑底效果不变。

## v0.4 新增内容

- 修复 Koji 桌宠无法拖动：独立桌宠窗口使用 `-webkit-app-region: drag` 提供大面积拖动区域，Koji 主体补充 IPC 窗口移动方案，输入框和按钮使用 `no-drag` 避免交互被吞掉。
- 修复透明背景 / 黑底问题：桌宠窗口使用无边框透明窗口，`html` / `body` / 根容器保持透明，不再出现整块黑色背景。
- 隐藏 Electron 默认菜单栏：主窗口不再显示 File / Edit / View / Window / Help。
- 左键点击 Koji 快速记录：弹出轻量输入框，提示“说吧，今天干啥了？”。
- 快速记录支持标签选择：默认选中“公司工作”，并兼容主窗口自定义标签。
- 记录成功触发 `collect` 收集动作：新记录会保存进今日事项，Koji 随机显示成功文案。
- 右键点击 Koji 弹出 Electron 原生功能菜单。
- 右键菜单支持打开 / 隐藏面板、查看今日记录、生成日报、复制日报、复制给 GPT 润色、导出 TXT / Markdown、生成今日简报、生成周报素材、动作测试、设置和退出。
- 双击 Koji 打开完整面板，避免误触发两次快速记录。
- 桌宠默认 UI 更简洁，不再常驻底部“记录 / 面板 / 退出”按钮。
- 13 个 Koji 状态与动作素材路径：新增 `collect`。
- 素材缺失自动回退 emoji / CSS 占位，不显示破图。

## Koji 交互方式

- 左键单击 Koji 主体：显示快速记录输入框。
- 右键单击 Koji：显示功能菜单。
- 左键双击 Koji：打开或聚焦完整主面板。
- 拖动 Koji 主体、气泡或空白区域：移动桌宠位置。
- 快速记录成功：Koji 切换到 `collect / 收集记录`。

## Koji 状态

v0.5 共有 13 个状态：

```text
idle          待机
wave          打招呼
record_ready  准备记录
collect       收集记录
success       通用成功
thinking      思考
writing       写日报
happy         开心
confused      疑惑
angry         催日报
sleep         困倦
drag          拖动
error         报错
```

## Koji 素材替换方式

把素材放入 `assets/koji/`，命名为：

```text
idle.png
wave.png
record_ready.png
collect.png
success.png
thinking.png
writing.png
happy.png
confused.png
angry.png
sleep.png
drag.png
error.png
```

同时支持 `.webp` / `.gif`：例如 `assets/koji/collect.webp`、`assets/koji/collect.gif`。桌宠会按 `webp → gif → png → idle 素材 → emoji` 的顺序尝试加载，所以只要保持命名一致即可替换正式 Koji 动作差分；如果用户当前只放了 `idle.png`，其他状态也会回退显示 idle 素材。

## 隐私与技术原则

- 不接 AI API
- 不联网
- 不上传数据
- 不使用外部 CDN
- 不使用 React / Vue / Vite
- 用户日报内容保存在本地 `localStorage`
- 主窗口继续复用原生 HTML / CSS / JavaScript

如果更换浏览器、清理浏览器数据、切换 Electron 用户数据目录或使用无痕 / 临时环境，已保存内容可能无法继续保留。

## 文件结构说明

```text
package.json            # npm 脚本、Electron 入口和 electron-builder 配置
main.js                 # Electron 主进程：主窗口、透明桌宠窗口、原生右键菜单、IPC 和生命周期
preload.js              # 安全暴露 window.kojiDesktop API
index.html              # 主窗口页面结构：日报记录、生成、历史、设置和网页预览 Koji
styles.css              # 主窗口样式：暖色 UI、卡片、按钮、响应式、Toast 和网页 Koji 预览
app.js                  # 主窗口逻辑：localStorage、事项 CRUD、日报生成、导出、设置、历史记录和桌宠命令处理
koji-config.js          # Koji 状态、单一默认台词读取兜底、整点报时、角色/皮肤配置雏形
data/koji-dialogues.js  # v0.5.2 程序可读取单一台词配置：状态台词、整点报时、安全梗池和元信息
pet.html                # 独立桌宠窗口结构和快速记录表单
pet.css                 # 独立桌宠窗口透明 UI、拖动区域、快速记录面板和状态动画
pet.js                  # 独立桌宠窗口状态配置、快速记录、右键菜单触发、双击打开面板和 IPC 移动
README.md               # 项目说明
assets/koji/README.md   # Koji 桌宠素材目录说明
docs/koji-character-spec.md # Koji 角色设定与桌宠规范
docs/koji-dialogue-library.md # Koji 台词源文档，整理依据与禁用方向
```

## 后续方向

- 更多 Koji cosplay 皮肤：例如 `assets/characters/koji/samurai-cosplay/`。
- 更多新角色：例如 `assets/characters/new-character/default/`。
- 数据迁移到本地 JSON 文件、导入 / 导出备份、开机启动、系统托盘菜单和更完整的安装包。
