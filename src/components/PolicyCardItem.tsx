import type { PolicyCard } from '../types';
import { CATEGORY_LABELS, LEVEL_LABELS, STATUS_LABELS, BENEFIT_COVERAGE_LABELS } from '../types';

interface Props {
  card: PolicyCard;
}

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-800 border-green-300',
  needs_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  expired: 'bg-red-100 text-red-800 border-red-300',
  draft: 'bg-gray-100 text-gray-600 border-gray-300',
  archived: 'bg-gray-100 text-gray-500 border-gray-300',
};

export default function PolicyCardItem({ card }: Props) {
  return (
    <a
      href={`/policy/${card.card_id}`}
      className="block p-4 border rounded-lg hover:shadow-md hover:border-blue-300 transition bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-gray-900 leading-snug">
          {card.short_title || card.title}
        </h4>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded border ${statusColors[card.status] || ''}`}
        >
          {STATUS_LABELS[card.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
          {CATEGORY_LABELS[card.category]}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
          {LEVEL_LABELS[card.level]}
        </span>
        {card.benefit_coverage.map((c) => (
          <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
            {BENEFIT_COVERAGE_LABELS[c]}
          </span>
        ))}
      </div>

      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{card.benefit_summary}</p>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>
          {card.benefit_money_min != null && card.benefit_money_max != null
            ? `${card.benefit_money_min}–${card.benefit_money_max} 元`
            : card.benefit_money_max != null
              ? `最高 ${card.benefit_money_max} 元`
              : ''}
        </span>
        <span>证据 {card.evidence_list.length} 条</span>
      </div>
    </a>
  );
}
