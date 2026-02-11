import type { PolicyCard } from '../types';

/**
 * 计算一组卡片中 evidence_list[].verified_date 的最大值
 * 规则：取当前展示的所有项目卡的 evidence_list[].verified_date 最大值
 */
export function getMaxVerifiedDate(cards: PolicyCard[]): string {
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
