# Jewelina · Job Search Dashboard

求职 dashboard，按 4 phase 时间线管理 2027 暑期 intern → 2028/29 postdoc → 业界 Research Scientist / Startup 长期路径。

> Forked structurally from [JsnDg/job-search](https://github.com/JsnDg/job-search)（致谢丁老师），完全重写内容与数据 schema。

**Owner**: Shaoyue Wen (温少越, [@jewelina95](https://github.com/jewelina95)) · Imperial College London Hamlyn Centre PhD Y1 (Burdet + Ma)
**研究方向**: Video reasoning · Multi-Agent Healthcare (AD wearable glove) · Voice Analysis / Voice Interaction
**今天**: 2026-05-14 · **下一关键 cycle**: 2026-09 (2027 summer intern apps 开放)

Dev: `npm install && npm start`（端口 3000）· Build: `npm run build`

---

## 页面结构 (3 tabs)

1. 🎯 **定位分析** (`#positioning`) — 三方向 × 四阶段 × 冲刺/匹配/保底 + 推荐人蓝图
2. 📅 **时间轴 / 策略** (`#timeline`) — PhD Y1 → Postdoc → Industry RS 五年时间轴 + 各 phase 关键 deadline
3. 💼 **岗位 Dashboard** (`#jobs`) — 世界地图 + phase 分组 + tier/subcategory/days_ago 多维筛选

---

## 数据文件

- `src/data/jobs.ts` — 所有岗位 (按 phase 分组: `internJobs` / `postdocJobs` / `industryRsJobs` / `startupJobs`) + `connections` 人脉
- `src/data/cityCoords.ts` — 世界地图城市坐标 (US Bay Area + PNW + East coast + UK London + EU)
- `public/world-countries-50m.json` — Natural Earth 50m TopoJSON (d3-geo 渲染)
- `src/types.ts` — `Job` schema (含 `phase` 主轴 + `direction` 三方向 + `return_offer_signal` intern→FTE 指标)

---

## 4 Phase 定义

| Phase | 时间窗 | 内容 |
|---|---|---|
| 1. Intern | now → 2027-05 | 2027 summer research intern (apps 2026-09 高峰) |
| 2. Postdoc | 2027-09 → 2028-08 | apply Stanford/CMU/MIT/Berkeley + US Top 30 postdoc; 2028 fall start |
| 3. Industry RS | 2028 → 2031+ | postdoc 出口或并行；Google DeepMind / MSR / Apple AIML / Adobe / TRI |
| 4. Startup | 2028+ | 平行路线：Hippocratic / Abridge / Sunday Robotics / Reka / Anthropic London 等 |

---

## URL 硬性规则 (沿用丁老师标准)

每个 `Job.url` 必须**同时满足**：

**① URL 是具体 job posting 或 PI lab 页面**
不是 careers 门户 / talents 索引 / 学院新闻 / lab 整体 opportunities landing。

**② URL 实际内容匹配 entry 的 title/subcategory**
WebFetch 验证页面标题与 entry title 指向同一 position。

**③ URL 不能 404 / broken redirect / 需 JS 渲染看不到内容**

任何不符的 entry 必须移到 `connections` (人脉/watchlist) 或彻底移除。

---

## Tier 评级标准（针对 Imperial PhD Y1 + CHI 2024 + VBVR + AD glove profile）

- **Tier 1 — 冲刺 (reach)**: 胜率 5-20%，需 warm referral + 顶会 paper；冲刺四大 + 顶级 lab
- **Tier 2 — 匹配 (match)**: 胜率 20-50%，主战场；中型 lab + 大厂中等 team
- **Tier 3 — 保底 (safety)**: 胜率 >50% 或 backup；如 startup 工程岗 / 国内 R1 / 风险 lab

---

## Return-offer signal 含义

- `verified` — public program 数据有 conversion 率 (Anthropic Fellows 25-50% / OpenAI Residency ~80%)
- `likely` — pipeline 历史活跃 + publishing 文化支持
- `unclear` — 没足够公开信号
- `rare` — 转化历史薄 (Apple publication restrictions) 或 pipeline 断 (IBM Research 2025-12 大裁员后)
