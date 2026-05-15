# Koji Report Pet

Koji Report Pet（中文名：Koji 日报桌宠助手）是一个纯本地的文案组日报桌宠助手。它面向日常工作记录场景：白天随手记录“今天做了什么”，晚上由本地模板和关键词规则整理生成中文日报。

当前版本：**Koji Report Pet v0.4 Electron 桌宠交互版**。

v0.4 将 Koji 从“桌面按钮”升级为真正的桌宠交互中枢：左键快速记录、右键功能菜单、双击打开完整主面板，并新增 `collect / 收集记录` 动作。

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

v0.4 共有 13 个状态：

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

同时支持 `.webp` / `.gif`：例如 `assets/koji/collect.webp`、`assets/koji/collect.gif`。桌宠会按 `png → webp → gif → emoji` 的顺序尝试加载，所以未来只要保持命名一致即可替换正式 Koji 动作差分。

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
pet.html                # 独立桌宠窗口结构和快速记录表单
pet.css                 # 独立桌宠窗口透明 UI、拖动区域、快速记录面板和状态动画
pet.js                  # 独立桌宠窗口状态配置、快速记录、右键菜单触发、双击打开面板和 IPC 移动
README.md               # 项目说明
assets/koji/README.md   # Koji 桌宠素材目录说明
```

## 后续 v0.5 方向

- 正式 Koji 动作差分接入
- 数据迁移到本地 JSON 文件
- 导入 / 导出备份
- 开机启动
- 每日提醒
- 系统托盘菜单
- 更完整的 exe 打包和安装包
