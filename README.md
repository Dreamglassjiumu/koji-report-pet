# Koji Report Pet

Koji Report Pet（中文名：Koji 日报桌宠助手）是一个纯本地的文案组日报桌宠助手。它面向日常工作记录场景：白天随手记录“今天做了什么”，晚上点击按钮后，由本地模板和关键词规则整理生成中文日报。

v0.3 将原本的纯静态网页原型升级为 Electron 桌面应用原型：主窗口继续承载日报记录与生成面板，Koji 则变成一个独立、透明、置顶、可拖动的桌宠窗口。

## 运行方式

### 网页预览方式仍然保留

进入项目目录后运行：

```bash
python -m http.server 48763
```

然后打开：

```text
http://localhost:48763
```

注意：因为用户本地已有很多项目，为避免端口冲突，本项目默认推荐使用 `48763`。不要默认推荐 `3000`、`5173`、`8000`、`8080`、`5000` 等常见端口。

也可以直接打开 `index.html` 进行基础预览，但更推荐使用上面的 Python 本地服务器方式。网页预览时不会依赖 `window.kojiDesktop`，所以没有 Electron 环境也不会报错。

### Electron 桌面版运行方式

首次运行请安装依赖：

```bash
npm install
```

启动桌面应用：

```bash
npm start
```

开发时也可以运行：

```bash
npm run dev
```

### 打包方式

```bash
npm run package
```

当前 `package.json` 使用 `electron-builder`，并优先配置了 Windows `nsis` 打包目标。

## v0.3 新增内容

- Electron 桌面应用：使用 `main.js` 创建主窗口和桌宠窗口。
- 独立 Koji 桌宠窗口：`pet.html`、`pet.css`、`pet.js` 负责桌宠 UI 与状态切换。
- 桌宠置顶：桌宠窗口使用 `alwaysOnTop`，不进入任务栏。
- 桌宠透明窗口：窗口无边框、透明背景，主体使用 emoji / CSS 占位，后续可替换图片素材。
- 桌宠点击打开主窗口：点击 Koji 主体或“面板”按钮可以显示 / 隐藏主窗口，点击“记录”按钮可以打开并聚焦主窗口。
- 主窗口操作触发桌宠状态变化：添加事项为 `success`，生成日报为 `writing`，复制日报或 GPT 润色 prompt 为 `happy`，空记录生成日报为 `confused`。
- IPC 通信：`preload.js` 通过 `contextBridge` 暴露 `window.kojiDesktop`，主窗口和桌宠窗口通过 Electron IPC 传递窗口控制和 Koji 状态。
- 保留现有日报功能：今日事项记录、`localStorage` 本地保存、日报生成、保存日报、复制日报、复制给 GPT 润色、导出 TXT / Markdown、今日简报、周报素材、历史记录、设置和 Koji 状态系统仍然保留。

## 隐私与技术原则

本项目 v0.3 仍然坚持纯本地原则：

- 不接 AI
- 不调用任何 AI API
- 不上传数据
- 不接入任何网络服务
- 不使用外部 CDN
- 不使用 React、Vue、Vite
- 主窗口继续复用现有 HTML / CSS / JavaScript
- 当前数据保存在 Electron 的本地浏览器存储中，也就是 `localStorage`

如果更换浏览器、清理浏览器数据、切换 Electron 用户数据目录或使用无痕 / 临时环境，已保存内容可能无法继续保留。后续 v0.4 可升级为 JSON 文件存储，方便备份和迁移。

## 文件结构说明

```text
package.json            # npm 脚本、Electron 入口和 electron-builder 配置
main.js                 # Electron 主进程：主窗口、桌宠窗口、IPC 和生命周期
preload.js              # 安全暴露 window.kojiDesktop API
index.html              # 主窗口页面结构：日报记录、生成、历史、设置和网页预览 Koji
styles.css              # 主窗口样式：暖色 UI、卡片、按钮、响应式、Toast 和网页 Koji 预览
app.js                  # 主窗口逻辑：localStorage、事项 CRUD、日报生成、导出、设置、历史记录和桌宠状态通知
pet.html                # 独立桌宠窗口结构
pet.css                 # 独立桌宠窗口透明 UI、拖动区域和状态动画
pet.js                  # 独立桌宠窗口状态配置、IPC 接收和快捷按钮行为
README.md               # 项目说明
assets/
  koji/
    README.md           # Koji 桌宠素材目录说明
```

## Electron 窗口说明

### 主窗口

- 默认尺寸：`1100 x 820`
- 最小尺寸：`900 x 680`
- 标题：`Koji Report Pet`
- 加载：`index.html`
- 用途：保留日报记录、生成、历史记录和设置等完整功能

### Koji 桌宠窗口

- 默认尺寸：`220 x 260`
- 无边框：`frame: false`
- 透明背景：`transparent: true`
- 始终置顶：`alwaysOnTop: true`
- 不可缩放：`resizable: false`
- 不显示在任务栏：`skipTaskbar: true`
- 默认位置：主屏幕右下角附近
- 拖动方式：使用 CSS `-webkit-app-region: drag`，按钮区域使用 `-webkit-app-region: no-drag`

## `window.kojiDesktop` API

`preload.js` 在保持 `contextIsolation: true`、不启用不必要 `nodeIntegration` 的前提下暴露安全 API：

```js
window.kojiDesktop = {
  showMainWindow(),
  hideMainWindow(),
  toggleMainWindow(),
  setPetState(state),
  onPetStateChanged(callback)
}
```

v0.3 还额外暴露了 `quitApp()`，供桌宠“退出”按钮和右键退出使用。

## Koji 状态

主窗口和独立桌宠窗口都保留 12 个状态：

```text
idle
wave
record_ready
success
thinking
writing
happy
confused
angry
sleep
drag
error
```

`pet.js` 中的 `petStates` 配置对象包含：

```js
{
  key,
  label,
  emoji,
  image,
  message,
  cssClass,
  duration
}
```

如果 `image` 存在，桌宠会优先显示图片；没有图片或图片加载失败时回落到 emoji / CSS 占位。

## Koji 素材替换说明

后续可以把正式素材放入：

```text
assets/koji/idle.png
assets/koji/wave.png
assets/koji/record_ready.png
assets/koji/success.png
assets/koji/thinking.png
assets/koji/writing.png
assets/koji/happy.png
assets/koji/confused.png
assets/koji/angry.png
assets/koji/sleep.png
assets/koji/drag.png
assets/koji/error.png
```

然后在 `app.js` 或 `pet.js` 的 `petStates` 配置里，把对应状态的 `image` 设置为素材路径即可，例如：

```js
idle: {
  key: "idle",
  label: "待机",
  emoji: "🐾",
  image: "assets/koji/idle.png",
  message: "来了，今天干啥了？",
  cssClass: "pet-idle",
  duration: 0
}
```

## 当前功能说明

- 今日事项记录：支持多行输入、自动记录日期和时间、选择项目标签、本地保存。
- 事项管理：支持编辑、删除，刷新页面后仍可保留。
- 项目标签：内置默认标签，并支持在设置中新增自定义标签。
- 日报生成：支持正式日报、简洁日报、详细日报、文案组日报、问题反馈型日报 5 种模板。
- 本地分类规则：通过关键词将事项粗略归类为资料整理、功能优化、测试验证、沟通协作、文案创作、问题修复和其他工作。
- 日报编辑、保存、复制、GPT 润色 prompt 复制、TXT / Markdown 导出。
- 今日简报与近 7 日周报素材整理。
- 历史记录：按日期倒序显示历史事项和日报，支持复制历史日报、导出历史日报、删除某一天全部数据。
- 设置：支持用户名、默认日报模板、自定义标签、自定义日报格式、Koji 动画开关、清空全部本地数据。
- Koji 桌宠：Electron 桌面版使用独立透明置顶窗口；网页预览版保留弱化后的右下角 Koji 状态预览。

## 后续 v0.4 可做方向

- 数据迁移到本地 JSON，方便备份和迁移
- 托盘图标
- 开机启动
- 更换正式 Koji 图片素材
- 更多动作差分
- 真正透明悬浮桌宠精修
- 自动提醒日报
