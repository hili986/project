import { useEffect, useState, useMemo } from 'react';
import type { BenefitCoverage, PolicyCard, Stage } from '../types';
import { STAGE_LABELS, STAGE_ORDER, CATEGORY_LABELS } from '../types';

interface Props {
  cards: PolicyCard[];
}

const VALID_STAGES: Stage[] = ['pre_admission', 'enrollment_day', 'after_enrollment', 'graduation'];
const VALID_CONCERNS: BenefitCoverage[] = ['tuition', 'accommodation', 'living', 'fees', 'other'];

export default function ActionPlanBuilder({ cards }: Props) {
  const [identity, setIdentity] = useState('');
  const [concern, setConcern] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const identityParam = params.get('identity') ?? '';
    const concernParam = params.get('concern') ?? '';

    const nextIdentity = VALID_STAGES.includes(identityParam as Stage) ? identityParam : '';
    const nextConcern = VALID_CONCERNS.includes(concernParam as BenefitCoverage) ? concernParam : '';

    setIdentity(nextIdentity);
    setConcern(nextConcern);
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (identity && !c.stage.includes(identity as Stage)) return false;
      if (concern && !c.benefit_coverage.includes(concern as any)) return false;
      return true;
    });
  }, [cards, identity, concern]);

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

  function generateText(): string {
    const lines: string[] = [];
    lines.push('=== 我的资助行动清单 ===');
    lines.push(`省份：安徽`);
    if (identity) lines.push(`身份阶段：${STAGE_LABELS[identity as Stage] || identity}`);
    if (concern) lines.push(`关注费用：${concern}`);
    lines.push(`匹配项目数：${filtered.length}`);
    lines.push('');

    for (const stage of STAGE_ORDER) {
      const stageCards = grouped.get(stage) || [];
      if (stageCards.length === 0) continue;
      lines.push(`【${STAGE_LABELS[stage]}】`);
      for (const c of stageCards) {
        lines.push(`  ■ ${c.title}（${CATEGORY_LABELS[c.category]}）`);
        lines.push(`    收益：${c.benefit_summary}`);
        lines.push(`    申请时间：${c.application_window_text}`);
        if (c.application_steps.length > 0) {
          lines.push(`    步骤：`);
          c.application_steps.forEach((s, i) => lines.push(`      ${i + 1}. ${s}`));
        }
        if (c.materials.length > 0) {
          lines.push(`    材料：${c.materials.join('、')}`);
        }
        if (c.apply_portals.length > 0) {
          lines.push(`    入口：${c.apply_portals.map((p) => `${p.name} ${p.url}`).join(' | ')}`);
        }
        lines.push(`    同济对接：${c.tongji_mapping_text}`);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('以上信息仅供参考，以官方发布为准。');
    lines.push('来源：同济资助导航 (tongji-aid-navigator)');
    return lines.join('\n');
  }

  async function handleCopy() {
    const text = generateText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: textarea select */
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* 问答区 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
        <h3 className="font-bold text-lg">生成你的行动清单</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">你来自哪里？</label>
            <p className="text-sm text-gray-600">安徽（当前唯一省份）</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">你是谁？</label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: '', l: '不限' },
                { v: 'pre_admission', l: '志愿填报/高三' },
                { v: 'enrollment_day', l: '新生报到' },
                { v: 'after_enrollment', l: '在读生' },
                { v: 'graduation', l: '毕业去向' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setIdentity(opt.v); setGenerated(false); }}
                  className={`text-sm px-3 py-1.5 rounded border transition ${
                    identity === opt.v
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">你最担心什么？</label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: '', l: '不限' },
                { v: 'tuition', l: '学费' },
                { v: 'accommodation', l: '住宿费' },
                { v: 'living', l: '生活费' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setConcern(opt.v); setGenerated(false); }}
                  className={`text-sm px-3 py-1.5 rounded border transition ${
                    concern === opt.v
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setGenerated(true)}
          className="px-5 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition"
        >
          生成清单（{filtered.length} 个匹配项目）
        </button>
      </div>

      {/* 结果区 */}
      {generated && (
        <div className="space-y-4">
          {STAGE_ORDER.map((stage) => {
            const stageCards = grouped.get(stage) || [];
            if (stageCards.length === 0) return null;
            return (
              <section key={stage} className="space-y-2">
                <h4 className="font-bold text-blue-900 border-b pb-1">{STAGE_LABELS[stage]}</h4>
                {stageCards.map((c) => (
                  <div key={c.card_id} className="p-3 border rounded bg-white text-sm space-y-1">
                    <div className="font-medium text-gray-900">
                      <a href={`/policy/${c.card_id}`} className="text-blue-700 hover:underline">
                        {c.title}
                      </a>
                      <span className="text-gray-500 ml-2">（{CATEGORY_LABELS[c.category]}）</span>
                    </div>
                    <p className="text-gray-700">{c.benefit_summary}</p>
                    <p className="text-gray-500">申请时间：{c.application_window_text}</p>
                    {c.application_steps.length > 0 && (
                      <ol className="list-decimal list-inside text-gray-600">
                        {c.application_steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    )}
                    {c.materials.length > 0 && (
                      <p className="text-gray-500">材料：{c.materials.join('、')}</p>
                    )}
                    <p className="text-gray-600">同济对接：{c.tongji_mapping_text}</p>
                  </div>
                ))}
              </section>
            );
          })}

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition"
            >
              {copied ? '已复制!' : '复制文本'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
