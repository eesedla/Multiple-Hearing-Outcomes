import csv, json
from collections import defaultdict
from datetime import datetime

CATEGORY_MAP = {
    'suspension': 'Suspension',
    'non-disciplinary letter of reinstruction': 'Reinstruction',
    'reinstruction': 'Reinstruction',
    'dismissal': 'Charge Dropped',
    'written reprimand': 'Written Reprimand',
    'reimbursement': 'Reimbursement',
    'separation': 'Resignation',
    'resignation': 'Resignation',
    'termination': 'Termination',
    'demotion': 'Demotion',
    'written warning': 'Warning',
    'verbal warning': 'Warning',
    'warning': 'Warning',
}

def parse_date(s):
    try:
        return datetime.strptime(s.strip().strip('"'), '%B %d, %Y')
    except:
        return None

officer_hearings = defaultdict(list)
skipped = 0
with open('cpd_data.csv') as f:
    for row in csv.DictReader(f):
        officer = row['Officer'].strip()
        if not officer:
            skipped += 1
            continue
        date = parse_date(row['Hearing Date'])
        decisions = [d.strip().lower() for d in row['Decision type'].split(',') if d.strip()]
        officer_hearings[officer].append({'date': date, 'decisions': decisions})

print(f"Skipped {skipped} rows with blank officer name\n")

hearing_counts = {o: len(h) for o, h in officer_hearings.items()}
total_officers = len(hearing_counts)

print("=== OFFICER HEARING COUNTS ===")
for n in range(1, 8):
    count = sum(1 for v in hearing_counts.values() if v == n)
    print(f"  Exactly {n} hearings: {count} officers")
six_plus = sum(1 for v in hearing_counts.values() if v >= 6)
print(f"  6+ hearings: {six_plus} officers")
print(f"  Total officers: {total_officers}")

print("\n=== HEARING INSTANCES PER BUCKET ===")
bucket_instances = defaultdict(int)
bucket_outcomes = defaultdict(lambda: defaultdict(int))

for officer, hearings in officer_hearings.items():
    for i, h in enumerate(sorted(hearings, key=lambda h: h['date'] or datetime.min)):
        num = min(i + 1, 6)
        bucket_instances[num] += 1
        for decision in h['decisions']:
            cat = CATEGORY_MAP.get(decision)
            if cat:
                bucket_outcomes[num][cat] += 1

LABELS = {1: '1st hearing', 2: '2nd hearing', 3: '3rd hearing',
          4: '4th hearing', 5: '5th hearing', 6: '6th+ hearing'}

for num in range(1, 7):
    total = sum(bucket_outcomes[num].values())
    print(f"  {LABELS[num]}: {bucket_instances[num]} hearings, {total} outcomes")
    for cat, cnt in sorted(bucket_outcomes[num].items(), key=lambda x: -x[1]):
        print(f"    {cat}: {cnt}")

print("\n=== CROSS-CHECK vs data.json ===")
with open('data.json') as f:
    data = json.load(f)
for row in data:
    total = sum(o['count'] for o in row['outcomes'])
    match = "OK" if total == row['totalOutcomes'] else f"MISMATCH (sum={total})"
    print(f"  {row['label']}: hearings={row['hearings']}, totalOutcomes={row['totalOutcomes']} {match}")
