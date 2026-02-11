import type { PolicyCard, Province, SourceSite, FAQ, GlossaryTerm, ChangelogEntry } from '../types';

import rawCards from '../data/policycards.json';
import rawProvinces from '../data/provinces.json';
import rawSources from '../data/sourcesites.json';
import rawFaqs from '../data/faqs.json';
import rawGlossary from '../data/glossary.json';
import rawChangelog from '../data/changelog.json';

export const policyCards = rawCards as PolicyCard[];
export const provinces = rawProvinces as Province[];
export const sourceSites = rawSources as SourceSite[];
export const faqs = rawFaqs as FAQ[];
export const glossaryTerms = rawGlossary as GlossaryTerm[];
export const changelogEntries = rawChangelog as ChangelogEntry[];

/** 按 province slug 获取该省所有卡片 */
export function getCardsByProvince(slug: string): PolicyCard[] {
  return policyCards.filter(
    (c) => c.province === slug || c.province === null,
  );
}

/** 按 card_id 获取单张卡片 */
export function getCardById(cardId: string): PolicyCard | undefined {
  return policyCards.find((c) => c.card_id === cardId);
}
