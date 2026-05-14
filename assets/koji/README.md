# Koji 桌宠素材目录

这里用于放置 Koji 桌宠素材。v0.2 默认仍然使用 emoji / CSS 占位，不需要真实图片素材，也不会联网加载外部资源。

建议素材命名：

```text
idle.png
wave.png
record_ready.png
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

完整路径示例：

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

也可以使用 `webp` / `gif`，但请在根目录 `app.js` 的 `petStates` 配置中写入对应 `image` 路径。

素材替换方式：

1. 把图片放到 `assets/koji/`。
2. 打开 `app.js`。
3. 找到 `petStates` 中对应状态。
4. 保留 `emoji` 作为兜底显示，把 `image` 改成图片路径，例如 `assets/koji/wave.png`。
5. 打开页面设置区的“Koji 动作测试面板”，逐个点击 12 个状态检查显示效果。

应用显示逻辑：如果 `image` 存在且加载成功，则优先显示图片；如果图片不存在或加载失败，会自动回退到 emoji / CSS 占位，避免出现破图。
