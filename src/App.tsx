import React, { useState, useMemo } from "react";
import { industryJobs, academiaJobs, connections } from "./data/jobs";
import { Job, Connection, TabType, SortType } from "./types";
import { WorldMap } from "./WorldMap";
import "./App.css";

function getDaysAgoLabel(days: number): { text: string; className: string } {
  if (days < 0) return { text: `还有${-days}天开放`, className: "badge-recent" };
  if (days <= 3) return { text: `${days}天 - NEW!`, className: "badge-new" };
  if (days <= 7) return { text: `${days}天`, className: "badge-recent" };
  if (days <= 30) return { text: `${days}天`, className: "badge-normal" };
  return { text: `${days}天`, className: "badge-old" };
}

function JobCard({ job }: { job: Job }) {
  const badge = getDaysAgoLabel(job.days_ago);
  const isNew = job.tags.some((t) => t.startsWith("🆕"));
  const isJustPosted = job.tags.some((t) => t.startsWith("🔥"));
  return (
    <div className={`job-card${isJustPosted ? " job-card-just-posted" : isNew ? " job-card-new" : ""}`}>
      <div className="job-card-header">
        <div className="job-title-row">
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-title">
            {job.title}
          </a>
          <span className={`days-badge ${badge.className}`}>{badge.text}</span>
        </div>
        <div className="job-org-row">
          <span className="job-org">{job.organization}</span>
          {job.fit_tier && (
            <span className={`tier-tag tier-${job.fit_tier}`}>
              {job.fit_tier === 1 ? "冲刺" : job.fit_tier === 2 ? "匹配" : "保底"}
            </span>
          )}
          {job.subcategory && (
            <span className={`subcategory-tag ${job.subcategory}`}>
              {job.subcategory === "startup" ? "创业/中型" :
               job.subcategory === "bigtech" ? "大厂" :
               job.subcategory === "researchlab" ? "Research Lab" :
               job.subcategory === "faculty" ? "Faculty" :
               job.subcategory === "postdoc" ? "Postdoc" :
               job.subcategory === "teaching" ? "教学岗" : job.subcategory}
            </span>
          )}
          {job.region && (
            <span className={`region-tag ${job.region}`}>
              {job.region === "us" ? "美国"
                : job.region === "china" ? "中国大陆"
                : job.region === "hk" ? "香港"
                : job.region === "sg" ? "新加坡"
                : job.region === "me" ? "中东"
                : "国际"}
            </span>
          )}
        </div>
      </div>
      <div className="job-meta">
        <span className="job-location">{job.location}</span>
        {job.salary && <span className="job-salary">{job.salary}</span>}
        {job.start_date && <span className="job-start">入职：{job.start_date}</span>}
        {job.deadline && <span className="job-deadline">截止：{job.deadline}</span>}
      </div>
      <p className="job-desc">{job.description}</p>
      {job.company_info && <p className="job-company-info">{job.company_info}</p>}
      {job.recent_placements && job.recent_placements.length > 0 && (
        <div className="placements-block">
          <div className="placements-title">Recent placements — bar 校准</div>
          <table className="placements-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Name</th>
                <th>PhD (advisor)</th>
                <th>Pre-stop</th>
                <th>Area</th>
                <th>Cites</th>
              </tr>
            </thead>
            <tbody>
              {job.recent_placements.map((p, idx) => (
                <tr key={idx} className={p.note?.includes("Jason") ? "placement-jason-comp" : ""}>
                  <td>{p.year}</td>
                  <td>
                    {p.name}
                    {p.note && <span className="placement-note">{p.note}</span>}
                  </td>
                  <td>{p.phd}</td>
                  <td>{p.pre_stop || "direct"}</td>
                  <td>{p.area}</td>
                  <td>{p.citations != null ? `${p.citations}${p.h_index ? ` / h${p.h_index}` : ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {job.bar_summary && <div className="bar-summary">{job.bar_summary}</div>}
        </div>
      )}
      <div className="job-tags">
        <span className={`category-tag ${job.category}`}>
          {job.category === "industry" ? "业界" : "学界"}
        </span>
        {job.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ conn }: { conn: Connection }) {
  return (
    <div className="connection-card">
      <div className="conn-header">
        <a href={conn.url} target="_blank" rel="noopener noreferrer" className="conn-name">
          {conn.name}
        </a>
      </div>
      <div className="conn-title">{conn.title}</div>
      <div className="conn-org">{conn.organization}</div>
      <p className="conn-area">{conn.research_area}</p>
      {conn.hiring_info && (
        <div className="conn-hiring">{conn.hiring_info}</div>
      )}
      <div className="job-tags">
        {conn.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

type SubcategoryFilter = "all" | "startup" | "bigtech" | "researchlab" | "ai-lab" | "midsize" | "faculty" | "postdoc" | "teaching" | "intern";
type TierFilter = 0 | 1 | 2 | 3; // 0 = all

const REGION_ORDER: Array<Job["region"] | "other"> = ["us", "china", "hk", "sg", "me", "international", "other"];
const REGION_LABELS: Record<string, string> = {
  us: "🇺🇸 美国 / 加拿大",
  china: "🇨🇳 中国大陆",
  hk: "🇭🇰 香港",
  sg: "🇸🇬 新加坡",
  me: "🕌 中东 (UAE)",
  international: "🌏 其他国际",
  other: "❓ 未分类",
};

function GroupedJobs({ jobs }: { jobs: Job[] }) {
  // Preserve the upstream sort order within each region bucket.
  const buckets = new Map<string, Job[]>();
  for (const j of jobs) {
    const key = j.region ?? "other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(j);
  }
  const ordered = REGION_ORDER.filter((k) => buckets.has(k as string));
  return (
    <>
      {ordered.map((key) => {
        const group = buckets.get(key as string)!;
        return (
          <section key={key as string} className="region-section">
            <div className={`region-section-header region-${key}`}>
              <span className="region-section-label">{REGION_LABELS[key as string]}</span>
              <span className="region-section-count">{group.length} 个岗位</span>
            </div>
            <div className="region-section-body">
              {group.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}

type PageView = "positioning" | "timeline" | "jobs";

function App() {
  const [pageView, setPageView] = useState<PageView>(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "timeline" || hash === "jobs") return hash;
    return "positioning";
  });
  // Keep URL hash in sync so a refresh keeps the view and users can share/bookmark.
  React.useEffect(() => {
    if (window.location.hash.replace("#", "") !== pageView) {
      window.history.replaceState(null, "", `#${pageView}`);
    }
  }, [pageView]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortType>("days_ago");
  const searchQuery: string = "";
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [subcategoryFilter, setSubcategoryFilter] = useState<SubcategoryFilter>("all");
  const [maxDaysAgo, setMaxDaysAgo] = useState<number>(20);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [tierFilter, setTierFilter] = useState<TierFilter>(0);

  const allJobs = useMemo(() => [...industryJobs, ...academiaJobs], []);

  // Jewelina 主轴 = phase (intern / postdoc / industry-rs / startup)
  const internAll = useMemo(() => allJobs.filter((j) => j.phase === "intern"), [allJobs]);
  const internUS = useMemo(() => internAll.filter((j) => j.region === "us"), [internAll]);
  const internUK = useMemo(() => internAll.filter((j) => j.region === "uk" || j.region === "eu"), [internAll]);
  const postdocAll = useMemo(() => allJobs.filter((j) => j.phase === "postdoc"), [allJobs]);
  const postdocUS = useMemo(() => postdocAll.filter((j) => j.region === "us"), [postdocAll]);
  const postdocIntl = useMemo(() => postdocAll.filter((j) => j.region === "uk" || j.region === "eu" || j.region === "international"), [postdocAll]);
  const industryRsAll = useMemo(() => allJobs.filter((j) => j.phase === "industry-rs"), [allJobs]);
  const startupAll = useMemo(() => allJobs.filter((j) => j.phase === "startup"), [allJobs]);

  const filteredJobs = useMemo(() => {
    let jobs: Job[];
    switch (activeTab) {
      case "all": jobs = [...allJobs]; break;
      case "intern": jobs = [...internAll]; break;
      case "intern-us": jobs = [...internUS]; break;
      case "intern-uk": jobs = [...internUK]; break;
      case "postdoc": jobs = [...postdocAll]; break;
      case "postdoc-us": jobs = [...postdocUS]; break;
      case "postdoc-intl": jobs = [...postdocIntl]; break;
      case "industry-rs": jobs = [...industryRsAll]; break;
      case "startup": jobs = [...startupAll]; break;
      case "connections": jobs = []; break;
      default: jobs = [...allJobs];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.organization.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (showNewOnly) {
      jobs = jobs.filter((j) => j.days_ago <= 14);
    }

    if (maxDaysAgo > 0) {
      jobs = jobs.filter((j) => j.days_ago <= maxDaysAgo || j.tags.some((t) => t.startsWith("🆕")));
    }

    if (subcategoryFilter !== "all") {
      jobs = jobs.filter((j) => j.subcategory === subcategoryFilter);
    }

    if (hasDeadline) {
      jobs = jobs.filter((j) => j.deadline);
    }

    if (tierFilter > 0) {
      jobs = jobs.filter((j) => j.fit_tier === tierFilter);
    }

    // 未开放的岗位（days_ago < 0）一律排到最后，无论按什么排
    const sortDays = (j: Job) => (j.days_ago < 0 ? Number.POSITIVE_INFINITY : j.days_ago);
    const isOpen = (j: Job) => j.days_ago >= 0;
    const tierOf = (j: Job) => j.fit_tier ?? 9;
    // 类别优先级（仅作为同 fit_tier 内的次要排序）：postdoc/faculty 最前，bigtech 最后
    const categoryRank = (j: Job): number => {
      if (j.subcategory === "postdoc") return 0;
      if (j.subcategory === "faculty") return 1;
      if (j.subcategory === "teaching") return 2;
      if (j.category === "academia") return 3;
      if (j.subcategory === "researchlab") return 4;
      if (j.subcategory === "startup") return 5;
      if (j.subcategory === "bigtech") return 6;
      return 9;
    };
    jobs.sort((a, b) => {
      // 全局规则：🆕 NEW 永远置顶
      const an = a.tags.some((t) => t.startsWith("🆕"));
      const bn = b.tags.some((t) => t.startsWith("🆕"));
      if (an !== bn) return an ? -1 : 1;
      // 全局规则：未开放（days_ago<0）永远沉底
      const ao = isOpen(a);
      const bo = isOpen(b);
      if (ao !== bo) return ao ? -1 : 1;

      if (sortBy === "tier") {
        // 真"按匹配度"：fit_tier 优先，再按类别，再按新鲜度
        const ta = tierOf(a);
        const tb = tierOf(b);
        if (ta !== tb) return ta - tb;
        const ca = categoryRank(a);
        const cb = categoryRank(b);
        if (ca !== cb) return ca - cb;
        return sortDays(a) - sortDays(b);
      }
      if (sortBy === "days_ago") return sortDays(a) - sortDays(b);
      if (sortBy === "organization") return a.organization.localeCompare(b.organization);
      return a.title.localeCompare(b.title);
    });

    return jobs;
  }, [allJobs, internAll, internUS, internUK, postdocAll, postdocUS, postdocIntl, industryRsAll, startupAll, activeTab, searchQuery, sortBy, showNewOnly, subcategoryFilter, maxDaysAgo, hasDeadline, tierFilter]);

  const filteredConnections = useMemo(() => {
    if (activeTab !== "connections") return [];
    if (!searchQuery) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.research_area.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [activeTab, searchQuery]);

  const stats = useMemo(() => {
    const recentJobs = allJobs.filter((j) => j.days_ago <= 14).length;
    return {
      total: allJobs.length,
      intern: internAll.length,
      internUS: internUS.length,
      internUK: internUK.length,
      postdoc: postdocAll.length,
      postdocUS: postdocUS.length,
      postdocIntl: postdocIntl.length,
      industryRs: industryRsAll.length,
      startup: startupAll.length,
      connections: connections.length,
      recentJobs,
    };
  }, [allJobs, internAll, internUS, internUK, postdocAll, postdocUS, postdocIntl, industryRsAll, startupAll]);

  const mainTabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "全部", count: stats.total },
    { key: "intern", label: "Phase 1 · Intern", count: stats.intern },
    { key: "intern-us", label: " ↳ US (Bay/Seattle/NYC)", count: stats.internUS },
    { key: "intern-uk", label: " ↳ UK/EU (London)", count: stats.internUK },
    { key: "postdoc", label: "Phase 2 · Postdoc", count: stats.postdoc },
    { key: "postdoc-us", label: " ↳ US (四大 + Top 30)", count: stats.postdocUS },
    { key: "postdoc-intl", label: " ↳ UK/EU (Imperial · UCL · ETH)", count: stats.postdocIntl },
    { key: "industry-rs", label: "Phase 3 · Industry RS", count: stats.industryRs },
    { key: "startup", label: "Phase 4 · Startup", count: stats.startup },
    { key: "connections", label: "人脉网络", count: stats.connections },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Jewelina · 求职 Dashboard</h1>
          <p className="header-subtitle">Video Reasoning · Multi-Agent Healthcare · Voice Interaction · Intern → Postdoc → Industry RS / Startup</p>
          <p className="header-subtitle" style={{ fontSize: '0.82em', color: '#94a3b8', marginTop: '0.3em' }}>
            <b style={{ color: '#3b82f6' }}>最近更新</b>：2026-05-14（首次构建。4 个 research agent 汇总 ~80 个 entries 覆盖 4 phase × 3 方向 × tier 1/2/3。所有 URL 当日 verify。Today = PhD Y1 Q2 末。下一个 cycle = 2027 summer intern apps 2026-09 开放。）
          </p>
          <div className="stats-row">
            <div className="stat">
              <span className="stat-num">{stats.total}</span>
              <span className="stat-label">总数</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.intern}</span>
              <span className="stat-label">Intern</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.postdoc}</span>
              <span className="stat-label">Postdoc</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.industryRs}</span>
              <span className="stat-label">Industry RS</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.startup}</span>
              <span className="stat-label">Startup</span>
            </div>
            <div className="stat">
              <span className="stat-num">{stats.connections}</span>
              <span className="stat-label">人脉</span>
            </div>
            <div className="stat highlight">
              <span className="stat-num">{stats.recentJobs}</span>
              <span className="stat-label">≤14天</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="page-nav">
        <button
          className={`page-tab ${pageView === "positioning" ? "active" : ""}`}
          onClick={() => setPageView("positioning")}
        >
          🎯 定位分析 <span className="page-tab-sub">三方向 × 四阶段</span>
        </button>
        <button
          className={`page-tab ${pageView === "timeline" ? "active" : ""}`}
          onClick={() => setPageView("timeline")}
        >
          📅 时间轴 / 策略 <span className="page-tab-sub">PhD Y1 → Postdoc → RS</span>
        </button>
        <button
          className={`page-tab ${pageView === "jobs" ? "active" : ""}`}
          onClick={() => setPageView("jobs")}
        >
          💼 岗位 Dashboard <span className="page-tab-sub">{stats.total} 个岗位 + 地图</span>
        </button>
      </nav>


      {pageView === "positioning" && (
      <section className="positioning-card">
        <h2>定位 Summary — 三方向 × 四阶段 × 冲刺/匹配/保底</h2>
        <p className="tier-meta">
          基于 <a href="https://jewelina95.github.io/JewelinaWen/" target="_blank" rel="noopener noreferrer">jewelina95.github.io/JewelinaWen</a> 公开 profile + 当前在研项目（VBVR · AD multi-agent glove · AdaptiveVoice 系列）汇总。
        </p>

        <div className="tier-summary">
          <p>
            <b>👤 履历 snapshot</b>：Imperial College London Hamlyn Centre 一年级 PhD（advisor: <b>Etienne Burdet + Liyun Ma</b>）；NYU Master's GPA 3.97；U Liverpool BEng First Class Hons。<b>9 篇论文</b>（CHI 2024 / IEEE VR 2025 / IJHCI 2023 / JMIR 2021 / VR 2022 + 4 under review）。<b>VBVR — 百万规模 video reasoning dataset</b> 2026.02 发布。<b>CHI 2026 Session Chair</b>。
          </p>
          <p>
            <b>🎯 三大研究方向</b>（所有目标公司/lab/PI 必须命中至少一条）：
          </p>
          <ol style={{ margin: "0.5em 0 0.5em 1.5em" }}>
            <li><b>Video reasoning</b> — VBVR 是主作品；对接 VLM / video LLM / clinical video reasoning。<i>fit signal</i>: 已有 dataset + benchmark 实证产出。</li>
            <li><b>Multi-agent healthcare</b> — AD wearable glove 的 7-agent 流水线（Analyzer + Physio/Behavior/Clinical Agent + Narrator）；对接 agentic clinical AI / wearable monitoring / healthcare LLM。<i>fit signal</i>: 已有 generator (n=112 校准) + pipeline 实现 + Imperial Hamlyn 医工背景背书。</li>
            <li><b>Voice analysis / voice interaction</b> — AdaptiveVoice (CHI 2024) + AdaptiveCopilot (IEEE VR 2025) 系列；对接 conversational AI / voice UI / cognitive-load-aware speech ML。<i>fit signal</i>: CHI 顶会 anchor + adaptive interaction 系统化方法论。</li>
          </ol>
          <p>
            <b>🏫 学校定位</b>：Imperial College London = QS 全球 #2 / EECS Top 10；Hamlyn Centre 是 surgical robotics / medical HCI 世界顶尖 lab。Burdet 是 neuro-rehab + haptics 领域标杆。对 US/UK hiring committee 的 brand weight = upper tier R1，与 Stanford/CMU/MIT 同档对话。<b>Hamlyn × NYU × Liverpool 三段海外训练</b>叠加 video + voice + wearable healthcare 跨学科 — 在同年级 HCI PhD 里属于<b>稀缺差异化 profile</b>。
          </p>
          <p>
            <b>⚠ 时间错位提醒</b>：今天 2026-05-14，PhD Y1 第一学期末；预计 2028 夏或 2029 春毕业。
            <b>当前 cycle 不是 Postdoc / TT cycle，是 Intern cycle</b> — 2026 暑期已过；目标 = 2027 summer intern（apps Sept-Dec 2026 开放）+ 2028 summer intern。
            Postdoc cycle 真正开始是 2027 fall（毕业前 1 年），现在重点 = 多发 paper × 实习串联 × 找未来 letter writer。
          </p>
        </div>

        <h3>📊 四阶段策略（按时间线展开）</h3>

        <div className="tier-summary tier-1-card">
          <h4>🟦 Phase 1 — 2027 Summer Intern（apps 2026-09 开放，<b>主战场就在 4 个月后</b>）</h4>
          <p>
            <b>Target</b>: 大厂 PhD research intern · AI lab research intern · healthcare startup research intern。地点 = Bay Area / London / Seattle / Cambridge MA。
          </p>
          <p>
            <b>🔴 冲刺档 (Reach)</b>：Google DeepMind Student Researcher (London + MTV)、Apple AIML Research Intern (Cupertino + Cambridge UK)、Microsoft Research PhD Intern (Redmond / Cambridge UK / NYC)、Meta FAIR Research Intern (London / Menlo Park)、Anthropic Research Intern (SF + London)、OpenAI Research Intern。<b>胜率 5-15%</b>，需要 top tier paper + warm referral。
          </p>
          <p>
            <b>🟢 匹配档 (Match) — 主战场</b>：Adobe Research Intern (Cambridge MA / San Jose / London)、Snap Research、Hugging Face Research、AI2 Young Investigator、IBM Research（注：2025-12 大裁员后 pipeline 不稳，verify mentor 还在）、Bloomberg AI、Salesforce Research、Pinterest Research。<b>胜率 25-50%</b>，是 publication-driven hiring 的最 viable channel — Imperial PhD + CHI 2024 + VBVR = strong fit。
          </p>
          <p>
            <b>🔵 保底档 (Safety)</b>：healthcare-focused startups (Hippocratic AI / Suki AI / Abridge / Open Evidence / Glass Health)、voice-focused startups (Sesame / Cartesia / Eleven Labs)、Imperial 内部 collab lab (Hamlyn × Burdet 网络)、UCL X-Reality Centre。
          </p>
          <p>
            <b>Return-offer pipeline 评级</b>（公开信息）：
            <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li><b>非常强</b>: Google Research / DeepMind student researcher → SWE-RS conversion 路径成熟；Adobe Research intern → RS 是历史长 pipeline。</li>
              <li><b>强</b>: MSR PhD intern → RS (Redmond / Cambridge UK)；Apple AIML intern → AIML researcher。</li>
              <li><b>中</b>: Snap Research / Pinterest / Bloomberg — 转化但 headcount 有限。</li>
              <li><b>弱/不确定</b>: Anthropic（不走传统 PhD intern→RS 模式）、OpenAI（混乱）、Meta FAIR（多轮裁员）、IBM Research（2025-12 大裁员）。</li>
            </ul>
          </p>
        </div>

        <div className="tier-summary tier-2-card">
          <h4>🟪 Phase 2 — 2028/29 Postdoc（apps 2027-09 开放，目标 2028 fall start）</h4>
          <p>
            <b>Target</b>: US Top 30 CS/EECS/iSchool postdoc，<b>四大优先</b> = Stanford / CMU / MIT / Berkeley。
          </p>
          <p>
            <b>🔴 冲刺档 — 四大顶级 lab</b>：
            <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li><b>Stanford</b>: Jeffrey Hancock (Comm)、James Landay (HCI)、Michael Bernstein (HCI/CSCW)、Diyi Yang (NLP+HCI)、Fei-Fei Li (video)、Serena Yeung (med imaging)、Nick Haber、HAI Fellow Program。</li>
              <li><b>CMU HCII</b>: Jeff Bigham、Jodi Forlizzi、Jason Hong、Mayank Goel (sensing health)、Aniket Kittur、Ken Holstein、Geoff Kaufman。</li>
              <li><b>MIT</b>: Pattie Maes (Fluid Interfaces)、Cynthia Breazeal (HRI)、Marzyeh Ghassemi (clinical ML)、Regina Barzilay (clinical NLP)、SERC Postdoc Program。</li>
              <li><b>Berkeley</b>: Bjoern Hartmann、Niloufar Salehi、Marti Hearst (iSchool)、Pieter Abbeel (robotics)。</li>
            </ul>
            <b>胜率 5-15%</b>。冲刺策略 = 2027 summer 前完成 CHI Best Paper 候选 + Imperial Hamlyn × 四大 lab 任意合作论文 + Burdet warm intro。
          </p>
          <p>
            <b>🟢 匹配档 — Top R1 sweet spot</b>：UW (Sean Munson / Jeff Heer / James Fogarty / Tim Althoff)、Cornell Tech (<b>Tanzeem Choudhury — digital health wearables ⭐ 最对口 AD glove</b> / Deborah Estrin)、UMich (Walter Lasecki / Nikola Banovic)、GaTech (Munmun De Choudhury / Wendy Rogers)、UCSD (<b>Nadir Weibel — health HCI ⭐</b>)、Northwestern (Bryan Pardo — audio)、UIUC iSchool、Penn (Annenberg)。
          </p>
          <p>
            <b>🔵 保底档</b>：Imperial 内部 postdoc continuation（Burdet/Ma 续聘）、UCL Interaction Centre、Edinburgh Informatics、ETH Zürich、EPFL CHILI。
          </p>
        </div>

        <div className="tier-summary tier-3-card">
          <h4>🟧 Phase 3 — 2030+ Industry RS（postdoc 出口）</h4>
          <p>
            <b>Target</b>: 业界长期 Research Scientist。<b>四个真正适配的方向组</b>：
            <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li><b>video reasoning</b> → Google DeepMind / Meta FAIR / Adobe Research (CIL)。</li>
              <li><b>multi-agent healthcare</b> → Verily / Microsoft Health Futures / Hippocratic AI / Google Health。</li>
              <li><b>voice / conversational AI</b> → Apple AIML (Siri research) / Google Assistant team / Sesame / Cartesia。</li>
              <li><b>HCI/wearables broad</b> → MSR HCI group (Redmond + Cambridge UK)、Snap Research、Pinterest、TRI HCAI Division。</li>
            </ul>
          </p>
          <p>
            <b>⚠ 风险信号 (2024-2026)</b>：IBM Research (2025-12 大裁员，pipeline 断)、Meta FAIR (多轮裁员)、Reality Labs (压缩)。<b>稳定增长</b>: Google DeepMind、Adobe Research、TRI、AI2、MSR (Cambridge UK + Redmond)。
          </p>
        </div>

        <div className="tier-summary tier-startup-card">
          <h4>🟨 Phase 4 — Startup 路线（可平行 postdoc，也可代替 industry RS）</h4>
          <p>
            <b>Target</b>: 有真 research track 的早期 AI/robotics/healthcare startup。
            <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li><b>Robotics</b>: Sunday Robotics、Dyna Robotics、Physical Intelligence (Pi)、Skild AI、Figure、1X — 适配 Hamlyn surgical robotics 背景。</li>
              <li><b>Healthcare voice/agent</b>: Hippocratic AI、Suki AI、Abridge、Open Evidence、Glass Health — 适配 AD multi-agent + voice 三角。</li>
              <li><b>Voice/audio</b>: Sesame、Cartesia、Eleven Labs — 适配 AdaptiveVoice line。</li>
              <li><b>LLM platform</b>: Anthropic、Mistral (Paris/London)、Cohere、Decagon、Sierra — 适配 multi-agent 工作。</li>
            </ul>
          </p>
          <p>
            <b>成长路径 (公开 pattern)</b>：fresh PhD 通常进 applied research 或 research engineering 岗；research lead 通常被 ex-DeepMind / ex-FAIR / 前 faculty 占据。要走"创业 → research lead"路径，最 viable 入口是
            <ol style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li>postdoc 期间 advise 创始团队（很多 robotics startup 创始人是前 academic）；</li>
              <li>3-4 年 postdoc 完成后以 senior researcher 进入。</li>
            </ol>
            <i>纯 startup 早期 fresh PhD 进去当 "research scientist" 通常实质是 ML engineer — verify JD scope</i>。
          </p>
        </div>

        <h3>🌐 推荐人 / Letter writers 蓝图（毕业前 2 年要锁定）</h3>
        <div className="tier-summary">
          <p>
            <b>四位推荐人组合</b>（参考 Jason Ding 的 "跨 affiliation + 跨 stage" 设计）：
            <ol style={{ margin: "0.3em 0 0.3em 1.5em" }}>
              <li><b>Etienne Burdet</b> (PhD advisor, Imperial Hamlyn) — academic anchor + medical robotics + Burdet 是 Nature/Science 级 brand。</li>
              <li><b>Liyun Ma</b> (PhD co-advisor) — clinical / wearable 背景背书。</li>
              <li><b>暑期 mentor 1 (2027 intern)</b> — 工业 research 背书，最好来自 Google/MSR/Adobe。</li>
              <li><b>暑期 mentor 2 (2028 intern, 选)</b> 或 <b>VBVR 合作者 / CHI 2026 Session 关系 PI</b> — letter diversity。</li>
            </ol>
            策略：每次 intern 前 6 个月 cold email 目标 mentor + 留下 1 篇 co-authored paper 是 letter quality 的根本。
          </p>
        </div>

      </section>
      )}

      {pageView === "timeline" && (
      <section className="positioning-card">
        <h2>📅 PhD Y1 → Postdoc → Industry RS · 5 年时间轴</h2>
        <p className="tier-meta">
          今天 = <b>2026-05-14</b>（PhD Y1 第 2 学期）· 预计毕业 = 2028 夏 / 2029 春 · 目标 postdoc 开始 = 2028 fall / 2029 fall。
        </p>

        <div className="tier-summary">
          <h3>🔑 关键 deadline 表（按 cycle 倒推）</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92em", marginTop: "0.5em" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ textAlign: "left", padding: "0.4em" }}>时间</th>
                <th style={{ textAlign: "left", padding: "0.4em" }}>动作</th>
                <th style={{ textAlign: "left", padding: "0.4em" }}>目标</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: "0.3em" }}><b>2026-05 → 08</b></td><td>VBVR paper 投 NeurIPS / ICLR；AD glove pipeline 投 CHI 2027 / UbiComp 2026</td><td>2027 intern apps 前要有 1 篇 first-author 顶会接收 / 投稿中</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2026-09 → 12</b></td><td><b>2027 summer intern 申请高峰</b>：Google / MSR / Apple / Meta / Adobe / Snap / AI2</td><td>同时投 8-12 家；warm referrer ≥ 3 家</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2027-01 → 05</b></td><td>intern offer 谈判 + 论文打磨 + CHI 2027 投稿</td><td>锁 1 家 intern offer (优先 return-offer 强的)</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2027-06 → 08</b></td><td><b>2027 summer intern 上班</b></td><td>产出 1 篇 co-authored paper + 锁 mentor 推荐信</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2027-09 → 12</b></td><td>2028 summer intern apps（第二轮）；Postdoc cold-email round 1（探口风）</td><td>第二段 intern 偏 healthcare/clinical；postdoc 预订 letter writer</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2028-01 → 06</b></td><td>毕业冲刺；postdoc 正式申请（Stanford HAI / MIT SERC / Berkeley / CMU 各自 cycle）</td><td>3-5 家正式 postdoc apps</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2028-07 → 10</b></td><td>毕业 / 答辩；postdoc onsite + 谈判</td><td>锁 1 家 postdoc offer（四大优先）</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2028-11 → 2031</b></td><td>3-4 年 postdoc</td><td>累积 8-12 篇 first-author / senior-author paper + 申 NSF/NIH funding 经验</td></tr>
              <tr><td style={{ padding: "0.3em" }}><b>2031+</b></td><td>Industry RS / Faculty / Startup co-founder cycle</td><td>三轨并行选 best fit</td></tr>
            </tbody>
          </table>
        </div>

        <div className="tier-summary tier-1-card">
          <h3>🟦 Phase 1 (now → 2027-05) — Intern 准备 + 投递</h3>
          <p><b>目标</b>: 锁定 1 家 2027 summer research intern offer，优先 return-offer 强的（Google / MSR / Adobe / Apple AIML）。</p>
          <p><b>关键动作</b>：</p>
          <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
            <li><b>2026-05~08 (now)</b>：VBVR 论文化（投 NeurIPS 2026 main / D&B track，6 月底 deadline）；AD glove paper 投 CHI 2027 (Sept deadline) 或 UbiComp 2026 (Feb deadline 已过 → 改投 UbiComp 2027)。</li>
            <li><b>2026-06</b>: 起草 intern apps 材料 — 1-pager research statement (3 个 thrust)、updated CV、GitHub portfolio 整理（jewelina95 公开 repo 现在已经 28 个，重点突出 ad-glove / ad-mind-pipeline / ad-synthetic-generator / VBVR）。</li>
            <li><b>2026-07</b>: 8-12 位目标 mentor cold email round 1（intro + 单页 research summary + 提出 mentor 关心的具体问题，非泛泛"很想加入"）。</li>
            <li><b>2026-09~10</b>: Google / Apple / MSR / Meta 大厂 PhD intern apps 通常 9-10 月开放，<b>第一周内必须投完</b>（rolling review，越早越好）。</li>
            <li><b>2026-11~12</b>: Adobe Research / Snap / Pinterest / AI2 / startup intern apps；第一轮 phone screen。</li>
            <li><b>2027-01~03</b>: onsite / virtual final round；offer 谈判。</li>
            <li><b>2027-04~05</b>: 接 offer + visa 准备（J-1 / H-1B intern）；CHI 2027 if accepted。</li>
          </ul>
        </div>

        <div className="tier-summary tier-2-card">
          <h3>🟪 Phase 2 (2027-06 → 2028-12) — Intern × 2 + Postdoc 申请</h3>
          <p><b>目标</b>: 2027 summer intern 产出 paper + 锁 return offer 候选；2028 summer 第二段 intern（healthcare / clinical 方向偏移）；2028 fall 正式 postdoc apply。</p>
          <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
            <li><b>2027 summer</b>: intern 上班期间 — week 1-3 确定 paper 课题，week 4-10 实验，week 11-12 draft；目标 = submission-ready by intern 结束。</li>
            <li><b>2027-09</b>: 同步申第二段 intern（如方向想 pivot 到 healthcare AI，目标 Verily / Hippocratic AI / Microsoft Health Futures）。</li>
            <li><b>2027-09~11</b>: <b>Postdoc cold-email round 1</b> — 给四大目标 PI 发 intro + 提出具体 collaboration idea，看口风 (不是正式申请，是探"你 2028 fall 有 slot 吗")。</li>
            <li><b>2027-12 → 2028-02</b>: MIT SERC / Stanford HAI / Berkeley CITRIS / CMU CMD-IT Diversifying-LEAP / Princeton CITP 这种 named postdoc 通常 12 月-1 月 deadline，单独整理一份 list。</li>
            <li><b>2028-03~05</b>: 答辩准备 + postdoc onsite。</li>
            <li><b>2028-06~08</b>: 毕业 + 第二段 intern (optional)；锁 postdoc offer。</li>
            <li><b>2028-09~12</b>: postdoc 起步；如果 postdoc 在四大之外，<b>同步申 industry RS 作为 backup</b>（Google / MSR / Adobe / Apple）。</li>
          </ul>
        </div>

        <div className="tier-summary tier-3-card">
          <h3>🟧 Phase 3 (2028-11 → 2031) — Postdoc 3-4 年 + 出口准备</h3>
          <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
            <li><b>Year 1</b>: 锁课题 + 出 2 篇 first-author paper；申 NSF GRIP / NIH F32 (如果 PI 支持) 或 EU MSCA postdoc fellowship。</li>
            <li><b>Year 2</b>: independent project；尝试 mentor 1-2 个 MS/PhD student；CHI / UIST / SIGGRAPH program committee 参与。</li>
            <li><b>Year 3</b>: 决策点 — (a) industry RS / (b) faculty cycle / (c) startup。<b>Faculty</b> apps 2031-09 投 (start 2032 fall)；<b>Industry RS</b> 节奏更短，2031 上半年即可。</li>
          </ul>
        </div>

        <div className="tier-summary tier-startup-card">
          <h3>🟨 Phase 4 (2031+) — Industry RS / Faculty / Startup 三轨并行</h3>
          <p><b>三选一时刻</b>：</p>
          <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
            <li><b>Industry RS</b>: 适合 — postdoc 出 strong paper 但 funding/teaching load 不想搞；3-4 个组合上面 Phase 3 已列。</li>
            <li><b>Faculty</b>: 适合 — postdoc 拿到 elite credential + 2 篇 BP 级 paper + funding pipeline 清晰；US R1 / UK/EU R1 / 港新 / 国内同时投。</li>
            <li><b>Startup</b>: 适合 — postdoc 期间已 advise startup 或导师 spin-off；以 founding researcher / research lead 进入，不是 entry-level RS。</li>
          </ul>
        </div>

        <h3>⚠ Dead List（已 stale / 不再投）</h3>
        <div className="tier-summary">
          <ul style={{ margin: "0.3em 0 0.3em 1.5em" }}>
            <li><b>2026 summer intern</b> — 全部 closed，不再追。下一目标直接是 2027 summer。</li>
            <li><b>IBM Research</b> — 2025-12 大裁员，pipeline 不稳，2026-2027 暂不投，等组织稳定再 reassess。</li>
            <li><b>Meta FAIR</b> — 多轮裁员 + Reality Labs 压缩；只在 verify 具体 sub-team 还活跃时才投。</li>
            <li><b>OpenAI / Anthropic full-time research intern</b> — 这两家 PhD intern → RS 路径不通畅（不走传统 academic pipeline），看具体 program 再判断。</li>
            <li><b>ByteDance</b> — 个人方向不符，移除。</li>
          </ul>
        </div>

      </section>
      )}

      {pageView === "jobs" && (<>
      <div className="controls">
        <div className="tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="filters">
          {activeTab !== "connections" && (
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
            >
              <option value="days_ago">排序：最新发布 (默认)</option>
              <option value="tier">排序：按匹配度</option>
              <option value="organization">排序：按机构</option>
              <option value="title">排序：按标题</option>
            </select>
          )}
        </div>
        {activeTab !== "connections" && (
          <div className="filter-row">
            <select
              className="filter-select"
              value={tierFilter}
              onChange={(e) => setTierFilter(Number(e.target.value) as TierFilter)}
            >
              <option value={0}>匹配度：全部</option>
              <option value={1}>仅 冲刺</option>
              <option value={2}>仅 匹配</option>
              <option value={3}>仅 保底</option>
            </select>
            <select
              className="filter-select"
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value as SubcategoryFilter)}
            >
              <option value="all">类型：全部</option>
              <option value="bigtech">仅大厂 (Google/MS/Apple/Meta/NVIDIA)</option>
              <option value="researchlab">仅研究院 (MSR/AI2/Adobe/TRI/Snap)</option>
              <option value="startup">仅 Startup (Anthropic/Hippocratic/Sunday/Reka)</option>
              <option value="postdoc">仅 Postdoc PI lab</option>
              <option value="faculty">仅 Faculty</option>
            </select>
            <select
              className="filter-select"
              value={maxDaysAgo}
              onChange={(e) => setMaxDaysAgo(Number(e.target.value))}
            >
              <option value={0}>发布时间：不限</option>
              <option value={7}>近 7 天</option>
              <option value={14}>近 14 天</option>
              <option value={20}>近 20 天</option>
              <option value={30}>近 30 天</option>
              <option value={60}>近 60 天</option>
              <option value={90}>近 90 天</option>
            </select>
            <label className="new-toggle">
              <input
                type="checkbox"
                checked={hasDeadline}
                onChange={(e) => setHasDeadline(e.target.checked)}
              />
              有截止日期
            </label>
            <label className="new-toggle">
              <input
                type="checkbox"
                checked={showNewOnly}
                onChange={(e) => setShowNewOnly(e.target.checked)}
              />
              仅新岗位（≤14天）
            </label>
          </div>
        )}
      </div>

      <div className="results-count">
        {activeTab === "connections"
          ? `${filteredConnections.length} 位人脉`
          : `${filteredJobs.length} 个岗位`}
      </div>

      {activeTab !== "connections" && filteredJobs.length > 0 && (
        <WorldMap jobs={filteredJobs} />
      )}

      <main className="job-list">
        {activeTab === "connections" ? (
          filteredConnections.length > 0 ? (
            <div className="connections-grid">
              {filteredConnections.map((c) => (
                <ConnectionCard key={c.id} conn={c} />
              ))}
            </div>
          ) : (
            <div className="empty-state">没有匹配的人脉。</div>
          )
        ) : filteredJobs.length > 0 ? (
          <GroupedJobs jobs={filteredJobs} />
        ) : (
          <div className="empty-state">没有匹配的岗位。试试调整筛选条件。</div>
        )}
      </main>
      </>)}

    </div>
  );
}

export default App;
