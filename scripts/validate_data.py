#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据校验脚本（扩展版）
- PolicyCard: 必填字段、受控词表（level/category/stage/status/education_level/priority）、evidence_list
- Province: slug 唯一、name 非空
- SourceSite: source_id 唯一、scope_level 受控词表、homepage_url 非空
- Changelog: card_ids 引用存在性
校验失败：退出码 1
"""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"

VOCAB = {
  "level": {"national","local","tongji","bank"},
  "category": {"award","grant","loan","workstudy","subsidy","waiver","compensation","assessment","channel","other"},
  "stage": {"pre_admission","enrollment_day","after_enrollment","graduation"},
  "status": {"draft","verified","needs_review","expired","archived"},
  "education_level": {"undergrad","master","phd","vocational","other"},
  "priority": {"P0","P1","P2"},
  "scope_level": {"national","province","school","bank"},
}

REQUIRED = [
  "card_id","title","level","region","stage","category","education_level",
  "eligible_text","requires_financial_assessment","benefit_summary",
  "application_window_text","application_steps","apply_portals","materials",
  "tongji_mapping_text","evidence_list","status","last_updated"
]

def load_json(name):
    path = DATA_DIR / name
    if not path.exists():
        return None, path
    return json.loads(path.read_text(encoding="utf-8")), path

def die(errors):
    for e in errors:
        print("ERROR:", e)
    sys.exit(1)

def validate_policycards(errors):
    cards, path = load_json("policycards.json")
    if cards is None:
        errors.append(f"Missing {path}")
        return []

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
        # controlled vocab – single value
        if c.get("level") not in VOCAB["level"]:
            errors.append(f"{cid}: invalid level {c.get('level')}")
        if c.get("category") not in VOCAB["category"]:
            errors.append(f"{cid}: invalid category {c.get('category')}")
        st = c.get("status")
        if st not in VOCAB["status"]:
            errors.append(f"{cid}: invalid status {st}")
        pri = c.get("priority")
        if pri is not None and pri not in VOCAB["priority"]:
            errors.append(f"{cid}: invalid priority {pri}")

        # controlled vocab – array: stage
        stage = c.get("stage", [])
        if not isinstance(stage, list) or not stage:
            errors.append(f"{cid}: stage must be non-empty list")
        else:
            bad = [x for x in stage if x not in VOCAB["stage"]]
            if bad:
                errors.append(f"{cid}: invalid stage values {bad}")

        # controlled vocab – array: education_level
        edu = c.get("education_level", [])
        if not isinstance(edu, list) or not edu:
            errors.append(f"{cid}: education_level must be non-empty list")
        else:
            bad = [x for x in edu if x not in VOCAB["education_level"]]
            if bad:
                errors.append(f"{cid}: invalid education_level values {bad}")

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

    return ids

def validate_provinces(errors):
    provinces, path = load_json("provinces.json")
    if provinces is None:
        errors.append(f"Missing {path}")
        return
    slugs = []
    for i, p in enumerate(provinces):
        pid = p.get("slug", f"<province {i}>")
        if not p.get("name"):
            errors.append(f"province '{pid}': missing name")
        if not p.get("slug"):
            errors.append(f"province row {i}: missing slug")
        slugs.append(p.get("slug"))
    if len(slugs) != len(set(slugs)):
        dup = sorted({x for x in slugs if slugs.count(x) > 1})
        errors.append(f"Duplicate province slug: {dup}")

def validate_sourcesites(errors):
    sites, path = load_json("sourcesites.json")
    if sites is None:
        errors.append(f"Missing {path}")
        return
    ids = []
    for i, s in enumerate(sites):
        sid = s.get("source_id", f"<source {i}>")
        if not s.get("source_id"):
            errors.append(f"source row {i}: missing source_id")
        sl = s.get("scope_level")
        if sl not in VOCAB["scope_level"]:
            errors.append(f"{sid}: invalid scope_level '{sl}'")
        if not s.get("homepage_url"):
            errors.append(f"{sid}: missing homepage_url")
        ids.append(s.get("source_id"))
    if len(ids) != len(set(ids)):
        dup = sorted({x for x in ids if ids.count(x) > 1})
        errors.append(f"Duplicate source_id: {dup}")

def validate_changelog(errors, card_ids):
    entries, path = load_json("changelog.json")
    if entries is None:
        errors.append(f"Missing {path}")
        return
    card_id_set = set(card_ids)
    for i, entry in enumerate(entries):
        if not entry.get("date"):
            errors.append(f"changelog[{i}]: missing date")
        if not entry.get("summary"):
            errors.append(f"changelog[{i}]: missing summary")
        for ref_id in entry.get("card_ids", []):
            if ref_id not in card_id_set:
                errors.append(f"changelog[{i}]: references unknown card_id '{ref_id}'")

def main():
    errors = []
    card_ids = validate_policycards(errors)
    validate_provinces(errors)
    validate_sourcesites(errors)
    validate_changelog(errors, card_ids)

    if errors:
        die(errors)
    print("[PASS] validate passed")

if __name__ == "__main__":
    main()
