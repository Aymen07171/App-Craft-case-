#!/usr/bin/env python3
"""
scripts/publish_all_to_etsy.py
Publishes all 6 frog phone case listings from Printify to Etsy store CraftCasesStudio (Shop 7939147).
"""

import json
import time
import urllib.request
import urllib.error
from pathlib import Path

env = Path(".env").read_text(encoding="utf-8")
token = [l.split("=", 1)[1].strip() for l in env.splitlines() if l.startswith("PRINTIFY_API_TOKEN=")][0]

SHOP_ID = "29067558"
BASE_URL = "https://api.printify.com/v1"

PRODUCTS = [
    ("CASE-FROGLV-002", "6acce0b68b0d8773c80012e6"),
    ("CASE-FROGLV-003", "6acce0bbc73d3718f10562f1"),
    ("CASE-FROGLV-004", "6acce0bfd84251369c0ac373"),
    ("CASE-FROGLV-005", "6acce0c48b0d8773c80012eb"),
    ("CASE-FROGLV-006", "6acce0c8997ccda18c0325ef"),
    ("CASE-FROGLV-007", "6acce0cdd84251369c0ac382"),
]

publish_payload = json.dumps({
    "title": True,
    "description": True,
    "images": True,
    "variants": True,
    "tags": True,
    "keyFeatures": True,
    "shipping_template": True
}).encode("utf-8")

print("=" * 70)
print("PUBLISHING 6 FROG PRODUCTS FROM PRINTIFY TO ETSY (CraftCasesStudio)")
print("=" * 70)

for sku, pid in PRODUCTS:
    print(f"\nPublishing [{sku}] PID: {pid}...")
    req = urllib.request.Request(
        f"{BASE_URL}/shops/{SHOP_ID}/products/{pid}/publish.json",
        data=publish_payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": "CraftCase/1.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as r:
            print(f"  [OK] Publish queued for {sku} (Status {r.status})")
    except urllib.error.HTTPError as e:
        print(f"  [HTTP ERROR] {e.code}: {e.read().decode()}")

print("\nAll 6 products queued for Etsy publishing!")
