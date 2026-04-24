import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv('C:\\credentials\\.env')

METABASE_URL = os.environ.get('METABASE_URL', '').rstrip('/')
METABASE_API_KEY = os.environ.get('METABASE_API_KEY', '')

if not METABASE_URL or not METABASE_API_KEY:
    sys.exit("ERROR: METABASE_URL or METABASE_API_KEY missing from C:\\credentials\\.env")

HEADERS = {
    "x-api-key": METABASE_API_KEY,
    "Content-Type": "application/json"
}

# Step 1: List databases and find PROD_DB
resp = requests.get(f"{METABASE_URL}/api/database", headers=HEADERS)
resp.raise_for_status()
databases = resp.json().get("data", resp.json())

db_id = None
for db in databases:
    if "PROD_DB" in db.get("name", "").upper() or "PROD" in db.get("name", "").upper():
        db_id = db["id"]
        print(f"Found database: {db['name']} (id={db_id})")
        break

if not db_id:
    print("Available databases:")
    for db in databases:
        print(f"  id={db['id']} name={db['name']}")
    sys.exit("ERROR: Could not find PROD_DB. Check the database names above and update the script.")

# Step 2: Run native SQL query — top 10 by quantity
SQL = """
SELECT *
FROM PROD_DB.POSTGRES_RDS_INVENTORY_INVENTORY.T_DEVICE_AUDIT
ORDER BY QTY DESC
LIMIT 10
"""

payload = {
    "database": db_id,
    "type": "native",
    "native": {"query": SQL}
}

resp = requests.post(f"{METABASE_URL}/api/dataset", headers=HEADERS, json=payload)
resp.raise_for_status()
result = resp.json()

# Step 3: Display results
if result.get("error"):
    sys.exit(f"Query error: {result['error']}")

cols = [col["display_name"] for col in result["data"]["cols"]]
rows = result["data"]["rows"]

if not rows:
    print("Query returned no rows.")
    sys.exit(0)

print(f"\nTop 10 rows from T_DEVICE_AUDIT (by QTY DESC):\n")
col_widths = [
    max(len(str(col)), max((len(str(row[i])) for row in rows), default=0))
    for i, col in enumerate(cols)
]
header = " | ".join(str(col).ljust(col_widths[i]) for i, col in enumerate(cols))
print(header)
print("-" * len(header))
for row in rows:
    print(" | ".join(str(val).ljust(col_widths[i]) for i, val in enumerate(row)))
