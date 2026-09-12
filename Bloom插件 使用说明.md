# Bloom — 使用说明

> 一个温柔、简洁的 Obsidian 个人仪表盘插件：Dashboard / Tasks / Calendar / Trackers 四合一。
> 设计理念：**单线程，一次只做一件事。**

---

## 一、安装

### 方式 A：手动安装（推荐）
1. 从 GitHub Release 下载三个文件：`main.js`、`styles.css`、`manifest.json`
2. 放入你的 vault：`<你的vault>/.obsidian/plugins/bloom/`（没有就新建 bloom 文件夹）
3. 重启 Obsidian → 设置 → 社区插件 → 启用 **Bloom**

### 方式 B：BRAT 安装（适合体验新版）
1. 安装社区插件 **BRAT**
2. `Add a beta plugin` → 粘贴 `https://github.com/shuixiande/bloom-obsidian-plugin`
3. 启用 Bloom，重启

### 方式 C：源码构建
```bash
git clone https://github.com/shuixiande/bloom-obsidian-plugin.git
cd bloom-obsidian-plugin
npm install && npm run build
# 然后把 main.js / styles.css / manifest.json 复制到插件目录
```

---

## 二、启动

- 重启后左侧 ribbon 会出现 **Bloom 仪表盘图标**（网格状）
- 或命令面板（Ctrl+P）搜 **Open Bloom dashboard**

---

## 三、界面总览

左侧 248px 侧边栏 8 项导航：

| 导航 | 视图 | 作用 |
|---|---|---|
| Home | 极简首页 | **今天最重要的一件事**大卡片 + 剩余任务数 |
| Today | 占位 | 预留 |
| Tasks | 任务看板 | To Do / In Progress / Done 三列 |
| Calendar | 全宽月历 | 每日事件卡 + 农历 + 节日横幅 |
| Trackers | 数据追踪 | 体重趋势 / 记账 / 周期 / 本月统计 |
| Learning / Books / Projects | 占位 | 预留 |

右上角：搜索框（过滤任务板）、明暗主题开关、设置（齿轮）。

---

## 四、Home — 今天的 #1 任务

- 大卡片显示 **topTask**，来自当日笔记 frontmatter：
  `12-Calendar/Daily Notes/2026-08-18.md` 顶部写 `topTask: "写周报"`
- 没设置时自动回退到 `11-Todo/Daily Tasks.md` 第一条未勾选任务
- 点击右上角圆形 ✓ 按钮 → 标记完成并**回写**到源文件

---

## 五、Tasks — 任务看板

| 列 | 数据来源 | 格式 |
|---|---|---|
| To Do / Done | `11-Todo/Daily Tasks.md` / `Study Tasks.md` / `Project Tasks.md` | `- [ ] 任务` / `- [x] 任务` |
| In Progress | `10-Projects/Project Dashboard.md` 的 `## Active Projects` | `### 1. 名称` + `<progress value="60">` |

- **+ New task** 按钮：弹窗输入任务名 → 写入 `11-Todo/Daily Tasks.md`，并即时插入 To Do 列
- 列内任务多时，**列内出现滚动条**（表头固定）
- 搜索框可实时过滤任务卡片

---

## 六、Calendar — 月历

- 7×6 全宽网格，**整月一屏显示**
- 每格内容：日期 + **农历**（如 "18 (初六)"）+ 节日铜色横幅（教师节/中秋节/国庆节等自动识别）+ 彩色事件点列表
- 今天：粉色高亮 + 左侧 accent 条
- 顶部 **Today** 按钮 → 跳回当前月；◀ ▶ 翻月（2026–2035）
- 事件来自每日笔记的 `## ⏰ Schedule` 表格：

```markdown
## ⏰ Schedule
| Time | Event | Color | Notes |
|------|-------|-------|-------|
| 8pm  | Medication (Time Blocking) | 🟣 |  |
| 9pm  | Reading | 🔵 |  |
```

---

## 七、Trackers — 数据追踪

| 卡片 | 数据来源 |
|---|---|
| Weight Trend | `13-Trackers/Weight Tracker.md` 的 `## Daily Weight Log` |
| Expense Overview | `13-Trackers/Expense Tracker.md` 的 `## Daily Expense Log` |
| Cycle Tracker | `13-Trackers/Period Tracker.md` 的 `## Current Cycle` |
| This Month | 上述汇总 |

---

## 八、设置（齿轮）

- **Dark mode**：即时切换明暗并持久保存
- **Default view**：重启后默认打开的视图（Home/Tasks/Calendar/Trackers）
- **Refresh from vault**：手动重新读取 vault 数据（改完笔记不用重启）

---

## 九、数据约定（重要）

- 任务勾选/新增/完成会**真实写回** Markdown 文件
- 事件与 topTask 必须在**每日笔记**（`12-Calendar/Daily Notes/YYYY-MM-DD.md`）里维护
- 文件缺失/改名时插件自动回退静态数据，不会白屏
- 详细 vault 结构见仓库 `VAULT-SETUP.md`

---

## 十、常见问题

| 问题 | 解决 |
|---|---|
| 图标/页面不显示 | 完整重启 Obsidian；确认插件已启用；控制台看 `[Bloom]` 日志 |
| 日历没有事件 | 在对应日期的 Daily Note 填 `## ⏰ Schedule` 表 |
| 数据没刷新 | 设置 → Refresh from vault |
| 想换默认视图 | 设置 → Default view |

---

## 十一、版本更新说明

### v0.1.4（2026-08-19）
- **记账（Trackers）**：支出总览卡新增 **+ Add** 按钮，弹窗填写日期/类别/品名/金额，明细写入 Expense Tracker，环形图与月度总额实时刷新
- **书单（Books）**：页面从占位改为真实分类书单，支持 **+ Add book** 新增书目（分类/书名/作者/状态）
- **学习（Learning）**：新增今日学习任务清单，支持勾选（状态回写文件）与 **+ Add study task**
- **修复**：所有输入改用原生模态窗口，解决 Obsidian 沙箱下浏览器弹窗被拦截导致按钮无反应的问题

### v0.1.3（2026-08-18）
- **日历左对齐**：主区域突破限宽，日历全宽显示
- **整月一屏**：压缩行高，一个月完整显示不再滚动
- **看板优化**：任务列内容超高时出现列内独立滚动条
- **细节修复**：星期表头与日期行间距过大问题
- 新增本使用说明文档

### v0.1.2（2026-08-18）
- **日历重构**：每个日期格变为事件卡——公历日号 + 农历 + 节日横幅（教师节等）+ 定时日程事件（彩色圆点 + 时间 + 事项）
- **首页极简化**：改为单张「今日第一要务」大卡片，勾选即完成并写回文件
- **修复**：多列 Schedule 表解析、非法定节日横幅补全

### v0.1.1（2026-08-17）
- **首个开源版本**：Dashboard / Tasks / Calendar / Trackers 四合一仪表盘
- 任务看板真实读写 vault 中的 Markdown 文件（勾选、新增、完成状态回写）
- 设置面板：浅色/深色主题切换、默认视图、Refresh from vault
- 侧边栏图标与文字左对齐

---

*Made with 💕 — Keep it simple, keep it yours.*
