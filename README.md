# Koji Report Pet

Koji Report Pet（中文名：Koji 日报桌宠助手）是一个纯本地的文案组日报桌宠助手。它面向文案组成员的日常工作记录场景：白天随手记录“今天做了什么”，晚上点击按钮后，由本地模板和关键词规则整理生成中文日报。

Koji 是文案组吉祥物，也是日报小秘书、日报催收员、摸鱼观察员和项目记录小助手。第一版使用 emoji / CSS 占位桌宠，不需要任何正式图片素材。

## 隐私说明

本项目第一版是纯静态网页：

- 不联网
- 不接 AI
- 不调用任何 AI API
- 不上传数据
- 不使用后端服务
- 所有事项、日报和设置都保存在当前浏览器的 `localStorage`

如果更换浏览器、清理浏览器数据或使用无痕模式，已保存内容可能无法继续保留。

## 本地预览方式

进入项目目录后运行：

```bash
python -m http.server 48763
```

然后打开：

```text
http://localhost:48763
```

注意：因为用户本地已有很多项目，为避免端口冲突，本项目默认推荐使用 `48763`。不要默认推荐 `3000`、`5173`、`8000`、`8080`、`5000` 等常见端口。

也可以直接打开 `index.html` 进行基础预览，但更推荐使用上面的 Python 本地服务器方式。

## 文件结构说明

```text
index.html              # 页面结构：顶部、今日记录、日报生成、历史记录、设置和 Koji 桌宠
styles.css              # 页面样式：暖色 UI、卡片、按钮、响应式和 Koji 动画
app.js                  # 本地交互逻辑：localStorage、事项 CRUD、日报生成、历史记录、设置和桌宠状态
README.md               # 项目说明
assets/
  koji/
    README.md           # Koji 桌宠素材目录说明
```

## 如何替换 Koji 素材

后续可以把正式素材放入：

```text
assets/koji/
```

例如：

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

然后在 `app.js` 的 `petStates` 配置里，把对应状态的 `emoji` 替换为 `image` 路径即可，例如：

```js
idle: {
  key: "idle",
  label: "待机",
  image: "assets/koji/idle.png",
  message: "来了，今天干啥了？",
  cssClass: "pet-idle"
}
```

这样后续替换 PNG / WebP / GIF / 序列帧素材时，不需要改动主要业务逻辑。

## 当前版本功能说明

- 今日事项记录：支持多行输入、自动记录日期和时间、选择项目标签、本地保存。
- 事项管理：支持编辑、删除，刷新页面后仍可保留。
- 项目标签：内置默认标签，并支持在设置中新增自定义标签。
- 日报生成：支持正式日报、简洁日报、详细日报、文案组日报、问题反馈型日报 5 种模板。
- 本地分类规则：通过关键词将事项粗略归类为资料整理、功能优化、测试验证、沟通协作、文案创作、问题修复和其他工作。
- 日报编辑与复制：生成后的日报显示在可编辑文本框中，可手动修改、保存和一键复制。
- 历史记录：按日期倒序显示历史事项和日报，支持复制历史日报、删除某一天全部数据。
- 设置：支持用户名、默认日报模板、自定义标签、Koji 动画开关、清空全部本地数据。
- Koji 桌宠：固定显示在右下角，可拖动，支持 12 个状态：待机、打招呼、准备记录、记录成功、思考、写日报、开心、疑惑、催日报、困倦、被拖动、报错。

## 后续可扩展方向

- Electron 桌面版
- 透明悬浮桌宠
- 更多动作差分
- 自定义日报模板
- 导出 TXT / Markdown
- 多皮肤 Koji
