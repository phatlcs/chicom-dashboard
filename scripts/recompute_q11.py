# -*- coding: utf-8 -*-
"""
Recompute Q11_TOOLS / Q11_ISSUES / Q11_SATISFACTION from the April annotated
xlsx and patch dashboard/data_computed.js in place. Avoids re-running the full
build pipeline so other Q sections stay untouched.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / 'backend'))
from keywords import extract_q11, extract_q11_issues, extract_q11_satisfaction  # noqa: E402

SOA_IDS = [1, 2]
SRC = BASE / 'docs' / 'all_groups_llm_classified_apr2026_annotated_v2.xlsx'
JS = BASE / 'dashboard' / 'data_computed.js'


def main() -> None:
    print(f'[q11] loading {SRC.name}')
    df = pd.read_excel(SRC)
    rel = df[df['relevant'] == True].copy()
    soa_rel = rel[rel['group_id'].isin(SOA_IDS)].copy()
    print(f'[q11]   SOA relevant rows: {len(soa_rel):,}')

    q11_tools = extract_q11(soa_rel)
    q11_issues = extract_q11_issues(soa_rel)
    q11_satisfaction = extract_q11_satisfaction(soa_rel)

    print(f'[q11] Q11_TOOLS: {len(q11_tools)} tools')
    for r in q11_tools:
        line = f'    {r["name"]:<22} use={r["use"]:>3}  sat={r["satisfied"]:>3}  iss={r["issues"]:>3}'
        print(line.encode('ascii', 'replace').decode())

    txt = JS.read_text(encoding='utf-8')

    def replace_const(name: str, value) -> str:
        pretty = json.dumps(value, ensure_ascii=False, indent=2)
        pretty = '\n'.join('  ' + line for line in pretty.splitlines())
        return f'  const {name:<14} = {pretty.lstrip()};'

    # Replace the three Q11 const blocks. The data_computed.js layout is:
    #   const Q11_TOOLS        = [...];
    #   const Q11_ISSUES       = [...];
    #   const Q11_SATISFACTION = [...];
    # We do a brace-aware match starting from the const keyword.
    def patch(text: str, name: str, value) -> str:
        m = re.search(rf'^(\s*const\s+{re.escape(name)}\s*=\s*)', text, flags=re.MULTILINE)
        if not m:
            raise RuntimeError(f'{name} not found in data_computed.js')
        start = m.start()
        body_start = m.end()
        ch = text[body_start]
        assert ch in '[{', f'expected [ or {{ at start of {name} body'
        depth = 0
        in_str = False
        esc = False
        i = body_start
        while i < len(text):
            c = text[i]
            if in_str:
                if esc:
                    esc = False
                elif c == '\\':
                    esc = True
                elif c == '"':
                    in_str = False
            else:
                if c == '"':
                    in_str = True
                elif c in '[{':
                    depth += 1
                elif c in ']}':
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
            i += 1
        # skip trailing ;\n
        end = i
        while end < len(text) and text[end] in ';\n':
            end += 1
        block = replace_const(name, value) + '\n'
        return text[:start] + block + text[end:]

    txt = patch(txt, 'Q11_TOOLS', q11_tools)
    txt = patch(txt, 'Q11_ISSUES', q11_issues)
    txt = patch(txt, 'Q11_SATISFACTION', q11_satisfaction)

    JS.write_text(txt, encoding='utf-8')
    print(f'[q11] patched {JS.relative_to(BASE)} ({JS.stat().st_size/1024:.1f} KB)')


if __name__ == '__main__':
    main()
