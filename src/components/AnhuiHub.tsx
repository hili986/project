import type { PolicyCard } from '../types';
import type { Filters } from './FilterBar';
import PolicyExplorer from './PolicyExplorer';

interface Props {
  cards: PolicyCard[];
  initialFilters?: Partial<Filters>;
}

export default function AnhuiHub({ cards, initialFilters = {} }: Props) {
  return (
    <PolicyExplorer
      cards={cards}
      showTimeline={true}
      extendedMode={false}
      initialFilters={initialFilters}
    />
  );
}
