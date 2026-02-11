import { useState, useMemo } from 'react';
import type { PolicyCard, Stage } from '../types';
import { STAGE_LABELS, STAGE_ORDER } from '../types';
import FilterBar, { DEFAULT_FILTERS, type Filters } from './FilterBar';
import PolicyCardItem from './PolicyCardItem';

interface Props {
  cards: PolicyCard[];
}

const stageIcons: Record<Stage, string> = {
  pre_admission: '\u{1F4CB}',
  enrollment_day: '\u{1F3EB}',
  after_enrollment: '\u{1F4DA}',
  graduation: '\u{1F393}',
};

function getMaxVerifiedDate(cards: PolicyCard[]): string {
  let max = '';
  for (const card of cards) {
    for (const ev of card.evidence_list) {
      if (ev.verified_date && ev.verified_date > max) {
        max = ev.verified_date;
      }
    }
  }
  return max || '未知';
}

function applyFilters(cards: PolicyCard[], filters: Filters): PolicyCard[] {
  return cards.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !c.title.toLowerCase().includes(q) &&
        !c.short_title.toLowerCase().includes(q) &&
        !c.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (filters.identity && !c.stage.includes(filters.identity as Stage)) {
      return false;
    }
    if (filters.concern && !c.benefit_coverage.includes(filters.concern as any)) {
      return false;
    }
    if (filters.category && c.category !== filters.category) {
      return false;
    }
    if (filters.assessmentRequired === 'true' && c.requires_financial_assessment !== true) {
      return false;
    }
    if (filters.assessmentRequired === 'false' && c.requires_financial_assessment !== false) {
      return false;
    }
    if (filters.educationLevel && !c.education_level.includes(filters.educationLevel as any)) {
      return false;
    }
    return true;
  });
}

export default function AnhuiHub({ cards }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const filtered = useMemo(() => applyFilters(cards, filters), [cards, filters]);
  const maxDate = useMemo(() => getMaxVerifiedDate(filtered), [filtered]);
  const planHref = useMemo(() => {
    if (filtered.length >= cards.length) return '/plan';
    const params = new URLSearchParams();
    if (filters.identity) params.set('identity', filters.identity);
    if (filters.concern) params.set('concern', filters.concern);
    const query = params.toString();
    return query ? `/plan?${query}` : '/plan';
  }, [cards.length, filtered.length, filters.concern, filters.identity]);

  /* 按时间轴分组 */
  const grouped = useMemo(() => {
    const map = new Map<Stage, PolicyCard[]>();
    for (const s of STAGE_ORDER) map.set(s, []);
    for (const c of filtered) {
      for (const s of c.stage) {
        map.get(s)?.push(c);
      }
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* 页头信息 */}
      <div className="text-sm text-gray-600 flex flex-wrap gap-4 items-center">
        <span>最后核验日期：<strong className="text-gray-900">{maxDate}</strong></span>
        <span>当前显示：<strong className="text-gray-900">{filtered.length}</strong> 个项目</span>
      </div>

      {/* 筛选条 */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* 时间轴四段 */}
      {STAGE_ORDER.map((stage) => {
        const stageCards = grouped.get(stage) || [];
        return (
          <section key={stage} className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white border-l-4 border-blue-600 rounded shadow-sm">
              <span className="text-2xl">{stageIcons[stage]}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{STAGE_LABELS[stage]}</h3>
                <p className="text-sm text-gray-500">{stageCards.length} 个项目</p>
              </div>
            </div>
            {stageCards.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {stageCards.map((c) => (
                  <PolicyCardItem key={`${stage}-${c.card_id}`} card={c} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 pl-4">当前筛选条件下暂无项目。</p>
            )}
          </section>
        );
      })}

      {/* 行动清单入口 */}
      <div className="text-center py-4">
        <a
          href={planHref}
          className="inline-block px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition"
        >
          生成我的行动清单
        </a>
      </div>
    </div>
  );
}
