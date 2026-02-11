#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel → JSON 转换脚本（阶段三）
读取：安徽-同济资助政策网站_项目卡片主数据_按Schema填充_v1.xlsx
输出：src/data/*.json（policycards/sourcesites/provinces/...）
注意：本脚本不会“编造政策事实”，只做格式转换与轻量自动生成占位。
"""
from __future__ import annotations
import json, re
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEFAULT_XLSX = ROOT / "data" / "安徽-同济资助政策网站_项目卡片主数据_按Schema填充_v1.xlsx"

def split_csv(v):
    if pd.isna(v) or v == "":
        return []
    parts = re.split(r"[,\uFF0C]+", str(v))
    return [p.strip() for p in parts if p.strip()]

def split_lines(v):
    if pd.isna(v) or v == "":
        return []
    return [p.strip() for p in str(v).splitlines() if p.strip()]

def parse_portals(v):
    if pd.isna(v) or v == "":
        return []
    out = []
    for line in str(v).splitlines():
        line = line.strip()
        if not line:
            continue
        if " | " in line:
            name, url = line.split(" | ", 1)
        elif "|" in line:
            name, url = line.split("|", 1)
        else:
            name, url = line, ""
        out.append({"name": name.strip(), "url": url.strip()})
    return out

def to_bool_or_null(v):
    if pd.isna(v):
        return None
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s in ("true", "yes", "1", "是"):
        return True
    if s in ("false", "no", "0", "否"):
        return False
    return None

def slugify(s: str) -> str:
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff\-]+", "", s)
    return s[:50] or "unknown"

def infer_scope(name: str) -> str:
    if "同济" in name:
        return "school"
    if "安徽" in name or "皖" in name:
        return "province"
    if "国家开发银行" in name or "国开" in name or "银行" in name:
        return "bank"
    if "教育部" in name or "全国" in name or "财政部" in name:
        return "national"
    return "national"

def main(xlsx_path: Path):
    pcs = pd.read_excel(xlsx_path, sheet_name="PolicyCards")
    ev = pd.read_excel(xlsx_path, sheet_name="Evidence")

    # Evidence -> map
    evidence_map = {}
    for _, r in ev.iterrows():
        cid = str(r["card_id"]).strip()
        item = {
            "source_name": None if pd.isna(r["source_name"]) else str(r["source_name"]).strip(),
            "url": None if pd.isna(r["url"]) else str(r["url"]).strip(),
            "doc_title": None if pd.isna(r["doc_title"]) else str(r["doc_title"]).strip(),
            "doc_no": None if pd.isna(r["doc_no"]) else str(r["doc_no"]).strip(),
            "published_date": None if pd.isna(r["published_date"]) else str(r["published_date"]).strip(),
            "verified_date": None if pd.isna(r["verified_date"]) else str(r["verified_date"]).strip(),
            "scope": None if pd.isna(r["scope"]) else str(r["scope"]).strip(),
            "quoted_excerpt": None if pd.isna(r["quoted_excerpt"]) else str(r["quoted_excerpt"]).strip(),
        }
        evidence_map.setdefault(cid, []).append(item)

    # PolicyCards
    policycards = []
    for _, r in pcs.iterrows():
        cid = str(r["card_id"]).strip()
        card = {
            "card_id": cid,
            "title": "" if pd.isna(r["title"]) else str(r["title"]).strip(),
            "short_title": None if pd.isna(r["short_title"]) else str(r["short_title"]).strip(),
            "priority": None if pd.isna(r["priority"]) else str(r["priority"]).strip(),
            "level": "" if pd.isna(r["level"]) else str(r["level"]).strip(),
            "region": "" if pd.isna(r["region"]) else str(r["region"]).strip(),
            "province": None if pd.isna(r["province"]) else str(r["province"]).strip(),
            "stage": split_csv(r["stage"]),
            "category": "" if pd.isna(r["category"]) else str(r["category"]).strip(),
            "education_level": split_csv(r["education_level"]),
            "tags": split_csv(r["tags"]),
            "eligible_text": "" if pd.isna(r["eligible_text"]) else str(r["eligible_text"]).strip(),
            "requires_financial_assessment": to_bool_or_null(r["requires_financial_assessment"]),
            "benefit_summary": "" if pd.isna(r["benefit_summary"]) else str(r["benefit_summary"]).strip(),
            "benefit_money_min": None if pd.isna(r["benefit_money_min"]) else r["benefit_money_min"],
            "benefit_money_max": None if pd.isna(r["benefit_money_max"]) else r["benefit_money_max"],
            "benefit_coverage": split_csv(r["benefit_coverage"]),
            "benefit_frequency": None if pd.isna(r["benefit_frequency"]) else str(r["benefit_frequency"]).strip(),
            "stacking_rules": None if pd.isna(r["stacking_rules"]) else str(r["stacking_rules"]).strip(),
            "application_window_text": "" if pd.isna(r["application_window_text"]) else str(r["application_window_text"]).strip(),
            "application_steps": split_lines(r["application_steps"]),
            "apply_portals": parse_portals(r["apply_portals"]),
            "materials": split_lines(r["materials"]),
            "processing_time": None if pd.isna(r["processing_time"]) else str(r["processing_time"]).strip(),
            "contact": None if pd.isna(r["contact"]) else str(r["contact"]).strip(),
            "tongji_mapping_text": "" if pd.isna(r["tongji_mapping_text"]) else str(r["tongji_mapping_text"]).strip(),
            "risk_notes": None if pd.isna(r["risk_notes"]) else str(r["risk_notes"]).strip(),
            "status": "" if pd.isna(r["status"]) else str(r["status"]).strip(),
            "valid_from": None if pd.isna(r["valid_from"]) else str(r["valid_from"]).strip(),
            "valid_to": None if pd.isna(r["valid_to"]) else str(r["valid_to"]).strip(),
            "last_updated": "" if pd.isna(r["last_updated"]) else str(r["last_updated"]).strip(),
            "change_note": None if pd.isna(r["change_note"]) else str(r["change_note"]).strip(),
            "evidence_list": evidence_map.get(cid, []),
        }
        policycards.append(card)

    # Minimal provinces (you can extend later)
    provinces = [{"name": "安徽", "slug": "anhui", "aliases": ["皖", "Anhui"], "order": 1}]

    # Auto-generate sourcesites from evidence (PLACEHOLDER)
    seen = {}
    for items in evidence_map.values():
        for it in items:
            name = it.get("source_name") or "未知来源"
            url = it.get("url") or ""
            if name in seen:
                continue
            try:
                host = urlparse(url).netloc
                home = f"https://{host}/" if host else ""
            except Exception:
                home = ""
            scope = infer_scope(name)
            region = "安徽" if ("安徽" in name or "皖" in name) else ("同济大学" if "同济" in name else "全国")
            seen[name] = {
                "source_id": f"src-{slugify(name)}",
                "name": name,
                "scope_level": scope,
                "region": region,
                "homepage_url": home,
                "policy_index_urls": [],
                "contact_urls": [],
                "update_frequency": "每学期" if scope in ("school", "province") else "不定期",
                "priority": "P0" if scope in ("school", "province", "bank") else "P1",
                "notes": "由证据链自动生成，需人工补齐政策目录页与联系方式。",
            }
    sourcesites = list(seen.values())

    # Minimal glossary/faq/changelog placeholders
    glossary = [
        {"term": "学生资助", "definition": "对家庭经济困难学生提供经济支持与发展支持的制度体系，通常包含奖、助、贷、勤、补、免、偿及绿色通道等。", "evidence": []},
        {"term": "绿色通道", "definition": "新生因家庭经济困难暂时无法缴纳学费住宿费时，可先办理入学手续，后续再通过贷款、助学金等方式解决。", "evidence": []},
    ]
    faqs = [{"q": "报到当天交不起学费怎么办？", "a": "可咨询学校资助部门并通过绿色通道先办理入学手续；后续再申请贷款/助学金等。"}]
    changelog = [{"date": "2026-02-11", "type": "init", "summary": "安徽MVP首批项目卡与证据链入库", "card_ids": [c["card_id"] for c in policycards]}]

    # Write outputs
    out = ROOT / "src" / "data"
    out.mkdir(parents=True, exist_ok=True)
    (out / "policycards.json").write_text(json.dumps(policycards, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "provinces.json").write_text(json.dumps(provinces, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "sourcesites.json").write_text(json.dumps(sourcesites, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "glossary.json").write_text(json.dumps(glossary, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "faqs.json").write_text(json.dumps(faqs, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "changelog.json").write_text(json.dumps(changelog, ensure_ascii=False, indent=2), encoding="utf-8")

    print("✅ Exported JSON to:", out)

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--xlsx", type=str, default=str(DEFAULT_XLSX))
    args = p.parse_args()
    main(Path(args.xlsx))
