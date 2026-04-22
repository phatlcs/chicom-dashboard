"""
Regenerate dashboard/data_computed.js from the annotated CSV.
Run whenever data is updated: python build_data.py

The backend (backend/main.py) does the same computation on-the-fly
after a CSV upload — no need to run this when using the live backend.
"""
import os
import sys

import pandas as pd

BASE = os.path.dirname(os.path.abspath(__file__))

# Use the backend's compute module
sys.path.insert(0, os.path.join(BASE, 'backend'))
from compute import compute_all  # noqa: E402

CSV_PATH = os.path.join(BASE, 'output', 'filtered', 'all_groups_classified_annotated.csv')
OUT_PATH = os.path.join(BASE, 'dashboard', 'data_computed.js')

print('Loading CSV…')
df = pd.read_csv(CSV_PATH, encoding='utf-8-sig', low_memory=False)
print(f'  {len(df):,} rows')

print('Computing…')
js, info = compute_all(df)

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print(f'Wrote {OUT_PATH}  ({os.path.getsize(OUT_PATH):,} bytes)')
print(f'KPI: {info["totalPosts"]:,} total  {info["relevantPosts"]:,} relevant')
