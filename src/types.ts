export interface Placement {
  name: string;          // e.g., "Xiang Li (李想)"
  year: string;          // e.g., "2026 RS" / "2024 AP" / "2025 Postdoc"
  phd: string;           // e.g., "CMU HCII (Bigham)" — keep <30 chars
  pre_stop?: string;     // e.g., "direct" / "MSR intern" / "Stanford postdoc"
  area: string;          // e.g., "video reasoning" / "voice UI" — keep <25 chars
  citations?: number;
  h_index?: number;
  note?: string;
}

export interface Job {
  id: string;
  title: string;
  organization: string;
  location: string;
  url: string;
  posted_date: string;
  days_ago: number;
  description: string;

  // phase 是 Jewelina dashboard 的主轴（时间阶段）；category 是兼容字段，与 phase 协同
  phase: "intern" | "postdoc" | "industry-rs" | "startup";
  category: "industry" | "academia";
  subcategory?: "startup" | "bigtech" | "researchlab" | "ai-lab" | "midsize" | "faculty" | "postdoc" | "teaching" | "intern";
  region?: "us" | "uk" | "eu" | "international" | "china" | "hk" | "sg" | "me";

  deadline?: string;
  salary?: string;
  start_date?: string;
  company_info?: string;
  fit_tier?: 1 | 2 | 3; // 1=冲刺 (reach), 2=匹配 (match), 3=保底 (safety)
  tags: string[];

  direction?: "video" | "healthcare" | "voice" | "robotics" | "cross"; // 三大方向
  return_offer_signal?: "verified" | "likely" | "unclear" | "rare"; // intern → FTE pipeline

  recent_placements?: Placement[];
  bar_summary?: string;
}

export interface Fellowship {
  id: string;
  name: string;             // 全名
  provider: string;         // Google Research / Royal Society / 等
  stage: "phd-year-1" | "phd-year-2-3" | "postdoc" | "any";
  annual_value: string;     // 描述性: "~$30K + tuition + travel"
  duration: string;         // "2 years" / "5+3 years" / "rolling"
  eligibility: string;      // 关键 filter (国籍 / venue / 申请方式)
  deadline_window: string;  // "Mar-Apr" / "Sept-Oct" / "rolling"
  fit_tier: 1 | 2 | 3;
  url: string;
  notes: string;            // leverage / 推荐何时申
  tags: string[];
}

export interface Connection {
  id: string;
  name: string;
  title: string;
  organization: string;
  research_area: string;
  url: string;
  hiring_info: string;
  tags: string[];
}

export type TabType =
  | "all"
  | "intern"           // 实习 (industry + occasional academic visiting)
  | "intern-us"
  | "intern-uk"
  | "postdoc"          // 学术 postdoc
  | "postdoc-us"
  | "postdoc-intl"
  | "industry-rs"      // 业界长期 RS
  | "startup"          // startup 路线
  | "connections";
export type SortType = "days_ago" | "organization" | "title" | "tier";
