#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段三：validate（最小可用版）
- 检查 PolicyCard 必填字段
- card_id 唯一
- stage/category/status/level 受控词表
- evidence_list 非空且每条有 url + verified_date
校验失败：退出码 1
"""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "policycards.json"

VOCAB = {
  "level": {"national","local","tongji","bank"},
  "category": {"award","grant","loan","workstudy","subsidy","waiver","compensation","assessment","channel","other"},
  "stage": {"pre_admission","enrollment_day","after_enrollment","graduation"},
  "status": {"draft","verified","needs_review","expired","archived"},
}

REQUIRED = [
  "card_id","title","level","region","stage","category","education_level",
  "eligible_text","requires_financial_assessment","benefit_summary",
  "application_window_text","application_steps","apply_portals","materials",
  "tongji_mapping_text","evidence_list","status","last_updated"
]

def die(errors):
    for e in errors:
        print("ERROR:", e)
    sys.exit(1)

def main():
    if not DATA.exists():
        die([f"Missing {DATA}"])
    cards = json.loads(DATA.read_text(encoding="utf-8"))
    errors = []

    ids = [c.get("card_id") for c in cards]
    if len(ids) != len(set(ids)):
        dup = sorted({x for x in ids if ids.count(x) > 1})
        errors.append(f"Duplicate card_id: {dup}")

    for i, c in enumerate(cards):
        cid = c.get("card_id", f"<row {i}>")
        # required fields
        for k in REQUIRED:
            if k not in c:
                errors.append(f"{cid}: missing field '{k}'")
        # controlled vocab
        if c.get("level") not in VOCAB["level"]:
            errors.append(f"{cid}: invalid level {c.get('level')}")
        if c.get("category") not in VOCAB["category"]:
            errors.append(f"{cid}: invalid category {c.get('category')}")
        st = c.get("status")
        if st not in VOCAB["status"]:
            errors.append(f"{cid}: invalid status {st}")

        # arrays
        stage = c.get("stage", [])
        if not isinstance(stage, list) or not stage:
            errors.append(f"{cid}: stage must be non-empty list")
        else:
            bad = [x for x in stage if x not in VOCAB["stage"]]
            if bad:
                errors.append(f"{cid}: invalid stage values {bad}")

        # requires_financial_assessment must exist (can be null)
        if "requires_financial_assessment" not in c:
            errors.append(f"{cid}: requires_financial_assessment must exist (true/false/null)")

        # evidence_list
        ev = c.get("evidence_list")
        if not isinstance(ev, list) or len(ev) < 1:
            errors.append(f"{cid}: evidence_list must be non-empty array")
        else:
            for j, e in enumerate(ev):
                if not e.get("url"):
                    errors.append(f"{cid}: evidence[{j}] missing url")
                if not e.get("verified_date"):
                    errors.append(f"{cid}: evidence[{j}] missing verified_date")

    if errors:
        die(errors)
    print("✅ validate passed")

if __name__ == "__main__":
    main()
