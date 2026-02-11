/* ── 受控词表（Controlled Vocabulary） ── */

export type Level = 'national' | 'local' | 'tongji' | 'bank';
export type Category =
  | 'award' | 'grant' | 'loan' | 'workstudy' | 'subsidy'
  | 'waiver' | 'compensation' | 'assessment' | 'channel' | 'other';
export type Stage = 'pre_admission' | 'enrollment_day' | 'after_enrollment' | 'graduation';
export type EducationLevel = 'undergrad' | 'master' | 'phd' | 'vocational' | 'other';
export type Status = 'draft' | 'verified' | 'needs_review' | 'expired' | 'archived';
export type Priority = 'P0' | 'P1' | 'P2';
export type BenefitCoverage = 'tuition' | 'accommodation' | 'living' | 'fees' | 'other';

/* ── Evidence（证据条目） ── */

export interface Evidence {
  source_name: string;
  url: string;
  doc_title: string;
  doc_no: string | null;
  published_date: string;
  verified_date: string;
  scope: string;
  quoted_excerpt: string;
}

/* ── PolicyCard（项目卡片） ── */

export interface ApplyPortal {
  name: string;
  url: string;
}

export interface PolicyCard {
  card_id: string;
  title: string;
  short_title: string;
  priority: Priority;
  level: Level;
  region: string;
  province: string | null;
  stage: Stage[];
  category: Category;
  education_level: EducationLevel[];
  tags: string[];

  /* 适用对象 */
  eligible_text: string;
  requires_financial_assessment: boolean | null;

  /* 资助内容 */
  benefit_summary: string;
  benefit_money_min: number | null;
  benefit_money_max: number | null;
  benefit_coverage: BenefitCoverage[];
  benefit_frequency: string;
  stacking_rules: string;

  /* 申请办理 */
  application_window_text: string;
  application_steps: string[];
  apply_portals: ApplyPortal[];
  materials: string[];
  processing_time: string;
  contact: string;

  /* 同济对接 */
  tongji_mapping_text: string;
  risk_notes: string;

  /* 证据链 */
  evidence_list: Evidence[];

  /* 版本与状态 */
  status: Status;
  valid_from: string;
  valid_to: string;
  last_updated: string;
  change_note: string;
}

/* ── Province ── */

export interface Province {
  name: string;
  slug: string;
  aliases: string[];
  order: number;
}

/* ── SourceSite（来源网站） ── */

export interface SourceSite {
  source_id: string;
  name: string;
  scope_level: string;
  region: string;
  homepage_url: string;
  policy_index_urls: string[];
  contact_urls: string[];
  update_frequency: string;
  priority: Priority;
  notes: string;
}

/* ── FAQ ── */

export interface FAQ {
  q: string;
  a: string;
}

/* ── GlossaryTerm ── */

export interface GlossaryTerm {
  term: string;
  definition: string;
  evidence: Evidence[];
}

/* ── ChangelogEntry ── */

export interface ChangelogEntry {
  date: string;
  type: string;
  summary: string;
  card_ids: string[];
}

/* ── 中文映射常量 ── */

export const STAGE_LABELS: Record<Stage, string> = {
  pre_admission: '入学前（在安徽办）',
  enrollment_day: '报到当天（同济兜底）',
  after_enrollment: '入学后（同济申请）',
  graduation: '毕业与去向',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  award: '奖学金',
  grant: '助学金',
  loan: '贷款',
  workstudy: '勤工助学',
  subsidy: '补助',
  waiver: '减免',
  compensation: '补偿/代偿',
  assessment: '困难认定',
  channel: '绿色通道',
  other: '其他',
};

export const LEVEL_LABELS: Record<Level, string> = {
  national: '国家',
  local: '地方',
  tongji: '同济',
  bank: '银行',
};

export const STATUS_LABELS: Record<Status, string> = {
  draft: '草稿',
  verified: '已核验',
  needs_review: '需复核',
  expired: '已过期',
  archived: '已归档',
};

export const STAGE_ORDER: Stage[] = [
  'pre_admission',
  'enrollment_day',
  'after_enrollment',
  'graduation',
];
