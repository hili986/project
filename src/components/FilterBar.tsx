import type { Category } from '../types';
import { CATEGORY_LABELS } from '../types';

export interface Filters {
  identity: string;
  concern: string;
  category: string;
  assessmentRequired: string;
  educationLevel: string;
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  identity: '',
  concern: '',
  category: '',
  assessmentRequired: '',
  educationLevel: '',
  search: '',
};

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const identityOptions = [
  { value: '', label: '全部身份' },
  { value: 'pre_admission', label: '志愿填报/高三' },
  { value: 'enrollment_day', label: '新生报到' },
  { value: 'after_enrollment', label: '在读生' },
  { value: 'graduation', label: '毕业去向' },
];

const concernOptions = [
  { value: '', label: '全部费用' },
  { value: 'tuition', label: '学费' },
  { value: 'accommodation', label: '住宿费' },
  { value: 'living', label: '生活费' },
  { value: 'fees', label: '杂费' },
];

const categoryOptions: { value: string; label: string }[] = [
  { value: '', label: '全部类别' },
  ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

const assessmentOptions = [
  { value: '', label: '困难认定不限' },
  { value: 'true', label: '需要困难认定' },
  { value: 'false', label: '不需要困难认定' },
];

const educationOptions = [
  { value: '', label: '全部学段' },
  { value: 'undergrad', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' },
];

function Select({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function FilterBar({ filters, onChange }: Props) {
  const set = (key: keyof Filters, val: string) => {
    onChange({ ...filters, [key]: val });
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border rounded-lg">
      <input
        type="text"
        placeholder="搜索项目名称..."
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <Select options={identityOptions} value={filters.identity} onChange={(v) => set('identity', v)} />
      <Select options={concernOptions} value={filters.concern} onChange={(v) => set('concern', v)} />
      <Select options={categoryOptions} value={filters.category} onChange={(v) => set('category', v)} />
      <Select options={assessmentOptions} value={filters.assessmentRequired} onChange={(v) => set('assessmentRequired', v)} />
      <Select options={educationOptions} value={filters.educationLevel} onChange={(v) => set('educationLevel', v)} />
      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="text-sm text-blue-700 hover:underline px-2 py-1.5"
      >
        重置
      </button>
    </div>
  );
}
