import { useState, useMemo } from 'react';
import type { PolicyCard, Stage, Level, Status } from '../types';
import { STAGE_LABELS, STAGE_ORDER } from '../types';
import { getMaxVerifiedDate } from '../utils/date';
import { BASE } from '../utils/base';
import FilterBar, { DEFAULT_FILTERS, type Filters } from './FilterBar';
import PolicyCardItem from './PolicyCardItem';

interface Props {
  cards: PolicyCard[];
  showTimeline?: boolean;
  extendedMode?: boolean;
  initialFilters?: Partial<Filters>;
  planHrefBase?: string;
}

const stageIcons: Record<Stage, string> = {
  pre_admission: '\u{1F4CB}',
  enrollment_day: '\u{1F3EB}',
  after_enrollment: '\u{1F4DA}',
  graduation: '\u{1F393}',
};

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
const CATEGORY_ORDER: Record<string, number> = {
  loan: 0, grant: 1, award: 2, subsidy: 3, waiver: 4,
  workstudy: 5, compensation: 6, channel: 7, assessment: 8, other: 9,
};

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
    if (filters.identity && !c.stage.includes(filters.identity as Stage)) return false;
    if (filters.concern && !c.benefit_coverage.includes(filters.concern as any)) return false;
    if (filters.category && c.category !== filters.category) return false;
    if (filters.assessmentRequired === 'true' && c.requires_financial_assessment !== true) return false;
    if (filters.assessmentRequired === 'false' && c.requires_financial_assessment !== false) return false;
    if (filters.educationLevel && !c.education_level.includes(filters.educationLevel as any)) return false;
    if (filters.level && c.level !== filters.level) return false;
    if (filters.status && c.status !== filters.status) return false;
    return true;
  });
}

function sortCards(cards: PolicyCard[], sortBy: string): PolicyCard[] {
  if (!sortBy) return cards;
  const sorted = [...cards];
  if (sortBy === 'priority') {
    sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
  } else if (sortBy === 'verified') {
    sorted.sort((a, b) => {
      const aMax = a.evidence_list.reduce((m, e) => (e.verified_date > m ? e.verified_date : m), '');
      const bMax = b.evidence_list.reduce((m, e) => (e.verified_date > m ? e.verified_date : m), '');
      return bMax.localeCompare(aMax);
    });
  } else if (sortBy === 'category') {
    sorted.sort((a, b) => (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9));
  }
  return sorted;
}

export default function PolicyExplorer({
  cards,
  showTimeline = true,
  extendedMode = false,
  initialFilters = {},
  planHrefBase = `${BASE}/plan`,
}: Props) {
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const filtered = useMemo(() => applyFilters(cards, filters), [cards, filters]);
  const sorted = useMemo(() => sortCards(filtered, filters.sortBy), [filtered, filters.sortBy]);
  const maxDate = useMemo(() => getMaxVerifiedDate(sorted), [sorted]);
  const planHref = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.identity) params.set('identity', filters.identity);
    if (filters.concern) params.set('concern', filters.concern);
    const query = params.toString();
    return query ? `${planHrefBase}?${query}` : planHrefBase;
  }, [planHrefBase, filters.concern, filters.identity]);

  /* group by timeline stage */
  const grouped = useMemo(() => {
    const map = new Map<Stage, PolicyCard[]>();
    for (const s of STAGE_ORDER) map.set(s, []);
    for (const c of sorted) {
      for (const s of c.stage) {
        map.get(s)?.push(c);
      }
    }
    return map;
  }, [sorted]);

  return (
    <div className="space-y-6">
      {/* header info */}
      <div className="text-sm text-gray-600 flex flex-wrap gap-4 items-center">
        <span>最后核验日期：<strong className="text-gray-900">{maxDate}</strong></span>
        <span>当前显示：<strong className="text-gray-900">{sorted.length}</strong> 个项目</span>
      </div>

      {/* filter bar */}
      <FilterBar filters={filters} onChange={setFilters} extendedMode={extendedMode} />

      {showTimeline ? (
        /* timeline grouped view */
        <>
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
        </>
      ) : (
        /* flat list view */
        sorted.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((c) => (
              <PolicyCardItem key={c.card_id} card={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">当前筛选条件下暂无项目。</p>
        )
      )}

      {/* action plan entry */}
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
