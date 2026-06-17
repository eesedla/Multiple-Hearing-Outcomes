import csv, json, re
from collections import defaultdict
from datetime import datetime

WORD_TO_NUM = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20, 'twenty-five': 25, 'thirty': 30,
    'forty': 40, 'fifty': 50
}

def extract_suspension_days(text):
    # Pattern 1: (N) workday — safe; historical dates have slashes, never produce (N) before "day"
    m = re.search(r'\((\d+)\)\s*(?:work\s*)?day', text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # Pattern 2: anchored to "received a/an" to avoid matching prior discipline history
    # \s+ handles newlines between "received a" and the day count
    for word in re.findall(
        r'receive[d]?\s+(?:a|an)\s+[^.]*?(\w+)[-–—\s]\s*(?:work\s*)?day',
        text, re.IGNORECASE
    ):
        word = word.lower()
        if word.isdigit():
            return int(word)
        val = WORD_TO_NUM.get(word)
        if val:
            return val
    return None

def suspension_category(text):
    days = extract_suspension_days(text)
    if days is None:
        return None
    return 'Long Suspension' if days > 7 else 'Short Suspension'

CATEGORY_MAP = {
    'non-disciplinary letter of reinstruction': 'Reinstruction',
    'reinstruction': 'Reinstruction',
    'dismissal': 'Charge Dropped',
    'written reprimand': 'Written Reprimand',
    'separation': 'Resignation',
    'resignation': 'Resignation',
    'termination': 'Termination',
    'demotion': 'Demotion',
}

def parse_date(s):
    try:
        return datetime.strptime(s.strip().strip('"'), '%B %d, %Y')
    except:
        return None

officer_hearings = defaultdict(list)
skipped = 0
with open('cpd_data.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        officer = row['Officer'].strip()
        if not officer:
            skipped += 1
            continue
        date = parse_date(row['Hearing Date'])
        decisions = [d.strip().lower() for d in row['Decision type'].split(',') if d.strip()]
        officer_hearings[officer].append({
            'date': date,
            'decisions': decisions,
            'text': row['Charge & Discipline Decision']
        })

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
            if decision == 'suspension':
                cat = suspension_category(h['text'])
            else:
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
