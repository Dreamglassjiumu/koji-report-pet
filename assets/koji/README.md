# Koji 桌宠素材目录

这里用于放置 Koji 桌宠素材。

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

也可以使用 `webp` / `gif`。

第一版可以没有真实素材，应用会使用 emoji / CSS 占位显示。

后续替换素材时，请保持状态名一致，并在根目录 `app.js` 的 `petStates` 配置中把对应状态从 `emoji` 改为 `image` 路径。
