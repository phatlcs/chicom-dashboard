import pandas as pd
from difflib import SequenceMatcher

df = pd.read_csv("output/filtered/Apr_2026_classified_combined_annotated.csv")

# Get all unique subtopics with their master topics
all_subs = {}
for idx, row in df.iterrows():
    sub = row['sub_topic']
    mt = row['master_topic']
    if pd.notna(sub) and pd.notna(mt):
        sub_clean = str(sub).strip()
        if sub_clean not in all_subs:
            all_subs[sub_clean] = {'count': 0, 'mt': mt}
        all_subs[sub_clean]['count'] += 1

def fuzzy_match(s1, s2, threshold=0.85):
    ratio = SequenceMatcher(None, s1.lower(), s2.lower()).ratio()
    return ratio >= threshold

# Group similar subtopics
groups = {}
used = set()

for sub in sorted(all_subs.keys()):
    if sub in used:
        continue

    group = [sub]
    used.add(sub)

    for other_sub in sorted(all_subs.keys()):
        if other_sub in used:
            continue
        if fuzzy_match(sub, other_sub):
            group.append(other_sub)
            used.add(other_sub)

    canonical = max(group, key=lambda s: all_subs[s]['count'])
    groups[canonical] = group

# Consolidate counts
consolidated = {}
for canonical, variants in groups.items():
    total_count = sum(all_subs[v]['count'] for v in variants)
    dominant_mt = all_subs[canonical]['mt']
    consolidated[canonical] = {
        'count': total_count,
        'mt': dominant_mt,
        'pct': round(total_count / len(df) * 100, 1)
    }

# Group by MT
mt_structure = {}
for sub, data in consolidated.items():
    mt = data['mt']
    if mt not in mt_structure:
        mt_structure[mt] = []
    mt_structure[mt].append((sub, data['count'], data['pct']))

# Sort MTs and their STs
mt_order = ['Others', 'SOA (Selling on Amazon)', 'Logistics', 'Account Health',
            'Third Party', 'Account Creation', 'Ads', 'Listing', 'Brand Registry']

print("\nMASTER TOPICS > SUB TOPICS (fuzzy matched, 85%)")
print("=" * 100)

total_st = 0
for mt in mt_order:
    if mt not in mt_structure:
        continue

    subs = sorted(mt_structure[mt], key=lambda x: -x[1])
    mt_total = sum(s[1] for s in subs)
    mt_pct = round(mt_total/len(df)*100, 1)

    print(f"\n{mt} ({len(subs)} subtopics | {mt_total} rows | {mt_pct}%)")
    print("-" * 100)

    for i, (sub, count, pct) in enumerate(subs, 1):
        pct_of_mt = round(count / mt_total * 100, 1)
        print(f"  {i:2d}. {sub:<65} {count:>6} ({pct_of_mt:>5.1f}% of MT | {pct:>5.1f}% total)")

    total_st += len(subs)

print("\n" + "=" * 100)
print(f"TOTAL: {total_st} sub-topics")
print("=" * 100)
