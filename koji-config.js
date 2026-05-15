(function () {
  const stateOrder = ["idle", "wave", "record_ready", "collect", "success", "thinking", "writing", "happy", "confused", "angry", "sleep", "drag", "error"];

  const petStates = {
    idle: { key: "idle", label: "待机", emoji: "🐾", message: "来了，今天干啥了？", cssClass: "pet-idle", duration: 0 },
    wave: { key: "wave", label: "打招呼", emoji: "👋", message: "嗨，我在这，日报素材别藏。", cssClass: "pet-wave", duration: 1800 },
    record_ready: { key: "record_ready", label: "准备记录", emoji: "📝", message: "说吧，今天干啥了？", cssClass: "pet-record-ready", duration: 0 },
    collect: { key: "collect", label: "收集记录", emoji: "📥", message: "收到，已经塞进日报素材库。", cssClass: "pet-collect", duration: 2400 },
    success: { key: "success", label: "通用成功", emoji: "✅", message: "保存成功，今天不是白干。", cssClass: "pet-success", duration: 2200 },
    thinking: { key: "thinking", label: "思考", emoji: "🤔", message: "我琢磨一下怎么归档。", cssClass: "pet-thinking", duration: 1800 },
    writing: { key: "writing", label: "写日报", emoji: "✍️", message: "我写，我写还不行吗。", cssClass: "pet-writing", duration: 2400 },
    happy: { key: "happy", label: "开心", emoji: "🎉", message: "复制好了，去交差吧！", cssClass: "pet-happy", duration: 2400 },
    confused: { key: "confused", label: "疑惑", emoji: "😵‍💫", message: "你还什么都没说呢。", cssClass: "pet-confused", duration: 2600 },
    angry: { key: "angry", label: "催日报", emoji: "😾", message: "你是不是又忘写日报了？", cssClass: "pet-angry", duration: 3000 },
    sleep: { key: "sleep", label: "困倦", emoji: "💤", message: "太晚了，日报写完就收工吧。", cssClass: "pet-sleep", duration: 2600 },
    drag: { key: "drag", label: "拖动", emoji: "🌀", message: "别拎我耳朵，放这也行。", cssClass: "pet-drag", duration: 0 },
    error: { key: "error", label: "报错", emoji: "⚠️", message: "哎呀，本地保存或复制好像失败了。", cssClass: "pet-error", duration: 3200 },
  };

  const toneOptions = {
    standard: "标准 Koji",
    sassy: "更贱一点",
    serious: "更正经一点",
    mixed: "中英日混合",
    quiet: "少说话模式",
  };

  const dialogues = {
    standard: {
      idle: ["来了，今天干啥了？", "白天随手记，晚上 Koji 帮你整。", "Koji 待机中，日报素材请投喂。", "今天也要假装很有条理。", "今日 task，submit 了吗？"],
      wave: ["嗨，我在这，日报素材别藏。", "Koji 上线，摸鱼也要留痕。", "哈喽，今天的工作痕迹呢？", "我挥手了，你记录了吗？", "文案组吉祥物，闪亮登场。"],
      record_ready: ["说吧，今天干啥了？", "来，把素材交出来。", "慢慢说，我记着呢。", "今日工作痕迹，提交。", "Koji on duty，开始记录。"],
      collect: ["记下了，晚上我帮你整理。", "收到，已经塞进日报素材库。", "好，这条看起来像正经工作。", "已记录，今天不是白干。", "この素材，いただきました。"],
      success: ["保存成功，稳。", "搞定，这条有证据了。", "OK，Koji 已经收好。", "成功了，可以小小得意一下。", "Done，交给我保管。"],
      thinking: ["我琢磨一下怎么归档。", "让我想想，这算哪类活。", "脑内整理中，稍等。", "Koji 思考中，CPU 冒烟版。", "这事儿我给它找个好位置。"],
      writing: ["我写，我写还不行吗。", "正在把碎片工作缝成日报。", "Report generation，启动。", "让我把这些事说得像正经推进。", "处理中，别催 Koji。"],
      happy: ["漂亮，今天能交差。", "复制好了，去交差吧！", "Nice，日报体面起来了。", "Koji 开心，因为你终于记了。", "よし，今天有成果。"],
      confused: ["你还什么都没说呢。", "空白？这是空气日报吗。", "先给我一点素材，please。", "Koji 看不懂，因为你没写。", "输入为空，记录失败哦。"],
      angry: ["你是不是又忘写日报了？", "工作做了，痕迹呢？", "别等下班前才想起我。", "日报不是召唤兽，自己不会出现。", "Koji 催你一下，轻轻的。"],
      sleep: ["太晚了，日报写完就收工吧。", "Koji 要待机了，你也差不多。", "眼睛闭上前，先保存。", "晚安，但日报别明天补。", "ねむい，记录完就睡。"],
      drag: ["别拎我耳朵，放这也行。", "搬家中，Koji 有点晕。", "这个位置可以，风水不错。", "拖慢点，我只是桌宠。", "はいはい，移动服务。"],
      error: ["哎呀，好像哪里失败了。", "本地保存或复制失败了，检查一下。", "Koji 摔了一跤，但没联网。", "操作失败，请再试一次。", "Error desu，问题不大。"],
    },
    sassy: {
      idle: ["来了，又准备让 Koji 收拾残局？", "素材没有，日报倒是想要。", "今天也在努力显得很忙吗？", "Koji 待机，等你投喂一点真东西。", "今日 task，别只存在脑海里。"],
      wave: ["哟，日报界临时抱佛脚选手。", "我挥手，不代表我会替你回忆。", "Koji 上线，来查工作痕迹。", "别看我，看输入框。", "你好，素材呢？"],
      record_ready: ["说吧，别让我猜谜。", "来，呈上你的工作证据。", "慢慢编……不是，慢慢说。", "今日痕迹，别装失忆。", "Koji on duty，少废话多记录。"],
      collect: ["记下了，终于有东西可写。", "收到，这条居然挺像工作。", "已入库，今天暂时不是 0 产出。", "好，日报素材 +1。", "この素材，Koji 勉强认可。"],
      success: ["成功了，别太感动。", "搞定，Koji 还是靠谱的。", "保存好了，你欠我一杯奶茶。", "OK，比空白强很多。", "Done，体面值 +1。"],
      thinking: ["我想想怎么把它写得高级点。", "正在给平凡工作镀金。", "Koji 脑内会议中。", "这活儿分类有点抽象。", "等下，我在消化你的表述。"],
      writing: ["我写，我真的在写，别盯。", "正在把碎片缝成看起来很忙的日报。", "Report magic，启动。", "把普通推进写成有效推进中。", "处理中，催也不会更快。"],
      happy: ["可以，今天看起来像上班了。", "复制完毕，快去交差。", "Nice，日报有内味了。", "Koji 高兴，因为不用硬编了。", "よし，勉强过关。"],
      confused: ["空的？你在考验我的想象力？", "什么都没有，Koji 也救不了。", "先打字，再点记录，基础操作。", "这份空气素材很空灵。", "输入为空，别闹。"],
      angry: ["日报呢？你别装没看见。", "工作痕迹消失术是吧。", "再拖就变成明日考古。", "Koji 催稿，不接受已读不回。", "别逼我喵喵叫着催你。"],
      sleep: ["太晚了，连 Koji 都想下班。", "还不睡？日报有这么刺激吗。", "写完保存，别梦里补。", "Koji 先困为敬。", "ねむい，明天别怪今天的你。"],
      drag: ["别薅我，我有工伤风险。", "搬来搬去，你桌面风水大师？", "放这可以，别再晃了。", "Koji 被迫位移中。", "はいはい，您开心就好。"],
      error: ["翻车了，但锅不一定是我的。", "保存/复制失败，先别甩锅。", "Koji 卡了一下，请重试。", "操作失败，现实很残酷。", "Error desu，别慌。"],
    },
    serious: {
      idle: ["Koji 待机中，可随时记录事项。", "请记录今日工作内容。", "白天记录事项，便于晚间生成日报。", "今日记录会保存在本地。", "准备好后请添加事项。"],
      wave: ["Koji 已就绪。", "欢迎使用日报记录。", "可开始记录今日事项。", "需要时可打开完整面板。", "右键可查看功能菜单。"],
      record_ready: ["请输入今日事项。", "请填写工作内容。", "记录内容会保存在本地。", "请选择标签并提交。", "Koji 正在等待输入。"],
      collect: ["记录成功，已保存到本地。", "事项已加入日报素材库。", "记录已完成。", "已保存，可继续添加。", "本条事项已记录。"],
      success: ["操作成功。", "保存成功。", "已完成。", "内容已更新。", "处理成功。"],
      thinking: ["正在整理内容。", "正在分析事项分类。", "请稍候。", "正在准备输出。", "Koji 正在处理。"],
      writing: ["正在生成日报。", "正在整理今日记录。", "日报生成中。", "正在组合日报内容。", "请稍候，正在处理。"],
      happy: ["操作已完成。", "内容已复制。", "日报已准备好。", "处理完成。", "可以继续下一步。"],
      confused: ["输入为空，请补充内容。", "暂无可处理记录。", "请先添加事项。", "未检测到有效内容。", "请填写后再提交。"],
      angry: ["请及时补充今日记录。", "建议现在整理日报素材。", "尚未完成日报记录。", "请检查今日事项是否完整。", "需要生成日报时请先添加事项。"],
      sleep: ["已进入休息提示状态。", "建议保存后结束工作。", "夜间请注意休息。", "日报完成后即可收工。", "Koji 正在待机。"],
      drag: ["正在移动 Koji。", "位置调整中。", "拖动完成后将返回待机。", "Koji 窗口移动中。", "正在更新桌宠位置。"],
      error: ["操作失败，请重试。", "本地保存或复制失败。", "发生错误，请检查输入。", "处理失败，请稍后再试。", "未能完成操作。"],
    },
    mixed: {
      idle: ["Koji standby，今日 task 投喂 please。", "お待ちしてます，素材在哪里？", "Daily report mode，ready。", "今天也要 keep organized。", "Koji idle 中，submit 你的痕迹。"],
      wave: ["Hello，Koji 参上。", "やっほ，今天的工作 log 呢？", "Wave wave，日报别 missing。", "Hi，Koji on desktop。", "こんにちは，开始记录吧。"],
      record_ready: ["Tell me，今天干啥了？", "素材ください，Koji 记着。", "Work log，please submit。", "慢慢说，I am listening。", "Koji on duty，はじめ。"],
      collect: ["Recorded，素材いただきました。", "收到，work log saved。", "OK，日报素材庫 +1。", "已记录，nice job desu。", "この素材，Koji 收下了。"],
      success: ["Success，保存完了。", "Done，だいじょうぶ。", "OK，Koji got it。", "保存成功，nice。", "Mission clear。"],
      thinking: ["Thinking 中，ちょっと待って。", "Let me sort it，稍等。", "Koji brain loading。", "分類しています，别急。", "Processing idea desu。"],
      writing: ["Writing report，起動。", "日报 generation 中。", "Koji writes，少々お待ち。", "把 task 变成 report，magic。", "Report mode，がんばります。"],
      happy: ["Nice，完了です。", "Copied，去 submit 吧。", "よし，今天安全。", "Great，report ready。", "Happy Koji says OK。"],
      confused: ["Empty desu，先输入。", "No content，Koji 困惑。", "何もない？请写一点。", "Input missing，please。", "空记录，だめだよ。"],
      angry: ["Report まだ？快记录。", "やばい，工作痕迹呢？", "Deadline feeling，来了。", "Koji reminder，别拖。", "Daily report，逃げないで。"],
      sleep: ["ねむい，save and sleep。", "Good night，日报别忘。", "Late desu，快收工。", "Koji sleep mode。", "おつかれ，明天再战。"],
      drag: ["Moving desu，别晃。", "Drag mode，Koji 搬家。", "はい，位置调整中。", "Place me here? OK。", "Koji relocation complete soon。"],
      error: ["Error desu，请重试。", "Save failed，ちょっと检查。", "Copy failed，again please。", "Koji bug? maybe。", "Oops，処理失败。"],
    },
    quiet: {
      idle: ["待机。", "可记录。", "投喂素材。", "日报素材？", "Koji 在。"],
      wave: ["嗨。", "我在。", "开始吧。", "你好。", "Ready。"],
      record_ready: ["请说。", "开始记录。", "写内容。", "我记着。", "提交素材。"],
      collect: ["已记录。", "收到了。", "已保存。", "素材 +1。", "OK。"],
      success: ["成功。", "已完成。", "保存了。", "OK。", "Done。"],
      thinking: ["思考中。", "整理中。", "稍等。", "处理中。", "归档中。"],
      writing: ["写日报。", "生成中。", "整理中。", "Report。", "稍等。"],
      happy: ["完成。", "已复制。", "很好。", "OK。", "交差。"],
      confused: ["空的。", "请填写。", "没内容。", "先记录。", "无效。"],
      angry: ["写日报。", "别忘。", "记录一下。", "补素材。", "该整理了。"],
      sleep: ["晚安。", "休息。", "收工。", "困了。", "保存。"],
      drag: ["移动中。", "别晃。", "放这里。", "搬家。", "OK。"],
      error: ["失败。", "重试。", "出错。", "未保存。", "检查。"],
    },
  };

  const hourlyLines = {
    standard: [
      "零点了。今日已寄？不，Koji 还可以抢救一下。", "一点，夜猫子模式。记完就睡。", "两点，Koji 建议停止和日报互相折磨。", "三点，san-ji desu。此时写日报很有宿命感。", "四点，天快亮了，素材别散。", "五点，早鸟或没睡？Koji 不评价。", "六点，早安，先活过来。", "七点，开机准备，今天别空白。", "Eight o'clock，はちじ，Koji 上班了。你也差不多该启动了。", "九点，工作日正式加载。", "十点，上午进度可以留个痕。", "十一点，快午饭了，先记一条。", "十二点，lunch time。Koji 建议：先吃饭，再整理。", "一点，午后重启中。", "两点，下午场开始，别让素材蒸发。", "三点，san-ji desu。你今天的工作痕迹在哪里？", "四点，差不多该收拢今日推进了。", "五点，日报素材盘点时间。", "六点了。理论上下班，实际上日报还没写。", "七点，晚间模式，先保存再摸鱼。", "八点，别让 Koji 陪你加班太久。", "九点，今日事项可以开始收尾。", "十点，夜间提醒：日报别拖到梦里。", "十一点，やばい。再不写，明天的你会恨今天的你。"
    ],
    quiet: ["零点。", "一点。", "两点。", "三点。", "四点。", "五点。", "六点。", "七点。", "八点。", "九点。", "十点。", "十一点。", "十二点。", "十三点。", "十四点。", "十五点。", "十六点。", "十七点。", "十八点。", "十九点。", "二十点。", "二十一点。", "二十二点。", "二十三点。"],
  };
  hourlyLines.sassy = hourlyLines.standard.map((line) => `${line} 嗯？素材呢。`);
  hourlyLines.serious = ["零点，请注意休息。", "一点，请尽快结束工作。", "两点，建议保存并休息。", "三点，夜间工作请注意健康。", "四点，建议整理后休息。", "五点，新一天即将开始。", "六点，早安。", "七点，请准备今日记录。", "八点，工作日开始。", "九点，请记录上午事项。", "十点，可补充阶段进展。", "十一点，请整理上午内容。", "十二点，请注意午休。", "十三点，下午工作开始。", "十四点，请持续记录事项。", "十五点，请检查今日进展。", "十六点，请收拢阶段内容。", "十七点，请准备日报素材。", "十八点，请检查日报是否完成。", "十九点，请保存重要内容。", "二十点，请整理晚间事项。", "二十一点，请确认今日记录。", "二十二点，请尽快收尾。", "二十三点，请完成日报并休息。"];
  hourlyLines.mixed = ["Zero o'clock，Koji 还在。", "One o'clock，ねむい。", "Two o'clock，sleep please。", "Three，san-ji desu。", "Four，夜明け前。", "Five，早すぎ。", "Six，おはよう。", "Seven，startup。", "Eight o'clock，はちじ，Koji 上班了。", "Nine，work mode。", "Ten，log please。", "Eleven，午饭前记录。", "Twelve，lunch time。", "Thirteen，restart。", "Fourteen，afternoon go。", "Fifteen，san-ji desu，痕迹呢？", "Sixteen，wrap up soon。", "Seventeen，report prep。", "Eighteen，日报まだ？", "Nineteen，save please。", "Twenty，night mode。", "Twenty-one，check logs。", "Twenty-two，finish up。", "Twenty-three，やばい，快写。"];

  const characters = {
    koji: {
      id: "koji",
      displayName: "Koji",
      description: "文案组日报小秘书，也是会耍宝的桌宠吉祥物。",
      skins: {
        default: {
          id: "default",
          displayName: "默认 Koji",
          basePath: "assets/koji/",
          futureBasePath: "assets/characters/koji/default/",
          states: stateOrder.reduce((map, state) => ({ ...map, [state]: state }), {}),
        },
      },
    },
  };

  function normalizeTone(tone) { return toneOptions[tone] ? tone : "standard"; }
  function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function getDialogue(stateKey, tone, fallback) {
    const normalizedTone = normalizeTone(tone);
    const pool = dialogues[normalizedTone]?.[stateKey] || dialogues.standard[stateKey];
    return Array.isArray(pool) && pool.length ? pickRandom(pool) : fallback;
  }
  function getHourlyLine(hour, tone) {
    const normalizedTone = normalizeTone(tone);
    const pool = hourlyLines[normalizedTone] || hourlyLines.standard;
    return pool[hour] || hourlyLines.standard[hour] || "整点了，记录一下。";
  }
  function getCharacter(characterId = "koji", skinId = "default") {
    const character = characters[characterId] || characters.koji;
    const skin = character.skins[skinId] || character.skins.default;
    return { character, skin };
  }
  function getAssetCandidates(stateKey, characterId = "koji", skinId = "default") {
    const { skin } = getCharacter(characterId, skinId);
    return ["webp", "gif", "png"].map((ext) => `${skin.basePath}${stateKey}.${ext}`);
  }

  window.KojiConfig = { stateOrder, petStates, toneOptions, dialogues, hourlyLines, characters, normalizeTone, getDialogue, getHourlyLine, getCharacter, getAssetCandidates };
})();
