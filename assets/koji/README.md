# Koji 桌宠素材目录

这里用于放置 Koji 桌宠动作素材。Koji Report Pet v0.4 默认仍可使用 emoji / CSS 占位，不需要真实图片素材，也不会联网加载外部资源。

## v0.4 状态列表

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

## 推荐素材命名

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

完整路径示例：

```text
assets/koji/idle.png
assets/koji/wave.png
assets/koji/record_ready.png
assets/koji/collect.png
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

同名 `.webp` / `.gif` 也支持，例如：

```text
assets/koji/collect.webp
assets/koji/collect.gif
```

## 加载与回退规则

`app.js` 和 `pet.js` 中每个 `petStates` 状态都有 `image` 字段，并会按以下顺序尝试加载：

1. `assets/koji/<state>.png`
2. `assets/koji/<state>.webp`
3. `assets/koji/<state>.gif`
4. emoji / CSS 占位

因此未来只要把素材文件放入 `assets/koji/` 并保持命名一致，桌宠和主窗口动作测试面板就能自动显示正式素材；素材缺失时不会显示破图。
