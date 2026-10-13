#!/usr/bin/env python3
"""
scripts/generate_pinterest_single_mockup_excel.py
Generates the official Pinterest Bulk Upload Excel workbook (.xlsx) and CSV file (.csv)
for all 17 designs (7 Frog + 10 Sardinhas) with STRICTLY ONE mockup per product
(the Primary Custom Lifestyle Mockup iPhone 18 Pro Max from CloudFront).
"""

import csv
import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

SHOP_ID = "29067558"
BASE_URL = "https://api.printify.com/v1"
env_text = Path(".env").read_text(encoding="utf-8")
TOKEN = [l.split("=", 1)[1].strip() for l in env_text.splitlines() if l.startswith("PRINTIFY_API_TOKEN=")][0]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "User-Agent": "CraftCase/1.0"}

PRODUCTS = [
    # 7 Frog Designs
    ("CASE-FROGLV-001", "6acca8512fe24e63d7081433", "frog phone case, stained glass case, tough phone case, aesthetic frog case, vitrail art, retro lava lamp case"),
    ("CASE-FROGLV-002", "6acce0b68b0d8773c80012e6", "suncatcher frog case, mini frog lava lamp, vitrail phone case, cute frog phone case, psychedelic phone case, iphone 18 case"),
    ("CASE-FROGLV-003", "6acce0bbc73d3718f10562f1", "gothic wizard frog case, potion bottle phone case, stained glass gothic case, fantasy frog case, dark academia phone case"),
    ("CASE-FROGLV-004", "6acce0bfd84251369c0ac373", "celestial tarot frog case, moon frog phone case, mystic lava lamp case, occult vitrail case, galaxy frog tough case"),
    ("CASE-FROGLV-005", "6acce0c48b0d8773c80012eb", "western cowboy frog case, disco lava lamp phone case, 70s retro phone case, desert frog case, boho western case"),
    ("CASE-FROGLV-006", "6acce0c8997ccda18c0325ef", "lofi dj frog case, 70s vinyl phone case, bubbling lava lamp case, aesthetic music phone case, cute dj frog cover"),
    ("CASE-FROGLV-007", "6acce0cdd84251369c0ac382", "uv blacklight frog case, cyber vitrail case, acid melt lava lamp case, neon frog phone case, vaporwave phone case"),
    # 10 Sardinhas Designs
    ("CASE-SARDPT-001", "6ace0af22dcac9d9f107b986", "portuguese sardine case, porto classic sardines, azulejo tile phone case, olive oil tin case, portugal souvenir case"),
    ("CASE-SARDPT-002", "6ace0af82691ab33cb0ef08c", "galo de barcelos case, portuguese rooster phone case, spicy sardine case, piri piri phone case, portuguese folk art case"),
    ("CASE-SARDPT-003", "6ace0afd2691ab33cb0ef08f", "algarve fisherman case, vintage nautical phone case, sardine haul tin case, portugal beach phone case, sea lover tough case"),
    ("CASE-SARDPT-004", "6ace0b012d4ab720af0476be", "fado guitar phone case, alfama lisbon phone case, sardinha fado case, romantic portugal case, vintage midnight tin case"),
    ("CASE-SARDPT-005", "6ace0b062dcac9d9f107b996", "tram 28 lisbon case, yellow tram phone case, sardinhas de lisboa case, portugal travel poster case, vintage tram case"),
    ("CASE-SARDPT-006", "6ace0b0a2dcac9d9f107b99d", "azulejo tile mosaic case, silver pilchard phone case, blue white ceramic tile case, delft tile phone case, portuguese tile case"),
    ("CASE-SARDPT-007", "6ace0b0e2d4ab720af0476c7", "belem tower phone case, maritime cannery label case, vintage lisbon fortress case, royal conservas case, portugal history case"),
    ("CASE-SARDPT-008", "6ace0b112dcac9d9f107b9a9", "grilled pepper sardine case, santos populares phone case, sardinha com pimentos case, rustic food phone case, lisbon fest case"),
    ("CASE-SARDPT-009", "6ace0b152dcac9d9f107b9ad", "madeira island phone case, passion fruit sardine case, botanical art nouveau case, tropical island phone case, exotic fruit case"),
    ("CASE-SARDPT-010", "6ace0b1a2e6f7187920a144b", "cascais riviera picnic case, 1950s gouache phone case, retro sunglasses beach case, luxury coastal vacation case, beach picnic case"),
]

PINTEREST_OFFICIAL_HEADERS = [
    "Title",
    "Media URL",
    "Pinterest board",
    "Thumbnail",
    "Description",
    "Link",
    "Publish date",
    "Keywords",
]

def main():
    base_date = datetime.now(timezone.utc).date() + timedelta(days=1)
    rows = []

    print("Fetching live product details from Printify...")
    for idx, (sku, pid, tags) in enumerate(PRODUCTS):
        req = urllib.request.Request(f"{BASE_URL}/shops/{SHOP_ID}/products/{pid}.json", headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
        except Exception as e:
            print(f"Error fetching {sku} ({pid}): {e}")
            continue

        title = data.get("title", f"CaseCraft Studio {sku} Tough Phone Case")[:100]
        images = data.get("images", [])
        primary_url = images[0].get("src", "") if images else ""

        desc_raw = data.get("description", "")
        # Clean HTML tags if any
        import re
        clean_desc = re.sub(r"<[^>]+>", " ", desc_raw)
        clean_desc = re.sub(r"\s+", " ", clean_desc).strip()
        if not clean_desc or len(clean_desc) < 20:
            clean_desc = f"Handcrafted premium dual-layer tough phone case featuring {title}. Impact-resistant polycarbonate outer shell with shock-absorbing TPU inner bumper. Available for iPhone and Samsung Galaxy."
        clean_desc = clean_desc[:495]

        publish_date = (base_date + timedelta(days=idx)).strftime("%Y-%m-%d")

        rows.append({
            "Title": title,
            "Media URL": primary_url,
            "Pinterest board": "Phone Cases",
            "Thumbnail": "",
            "Description": clean_desc,
            "Link": "https://www.etsy.com/shop/CraftCasesStudio",
            "Publish date": publish_date,
            "Keywords": tags,
        })
        print(f"  [{idx+1}/{len(PRODUCTS)}] Added {sku}: {title[:35]} (Media: {primary_url[:45]}...)")

    # 1. Write Excel (.xlsx)
    wb = Workbook()
    ws = wb.active
    ws.title = "Pinterest Pins"

    # Styling
    header_fill = PatternFill(start_color="111827", end_color="111827", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Segoe UI", size=10, color="1F2937")
    thin_border = Border(
        left=Side(style="thin", color="E5E7EB"),
        right=Side(style="thin", color="E5E7EB"),
        top=Side(style="thin", color="E5E7EB"),
        bottom=Side(style="thin", color="E5E7EB"),
    )
    alt_fill = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")

    ws.append(PINTEREST_OFFICIAL_HEADERS)
    for col_idx in range(1, len(PINTEREST_OFFICIAL_HEADERS) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.row_dimensions[1].height = 28

    for r_idx, row_dict in enumerate(rows, start=2):
        row_vals = [row_dict[h] for h in PINTEREST_OFFICIAL_HEADERS]
        ws.append(row_vals)
        ws.row_dimensions[r_idx].height = 22
        for c_idx in range(1, len(PINTEREST_OFFICIAL_HEADERS) + 1):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.font = data_font
            cell.border = thin_border
            if r_idx % 2 == 1:
                cell.fill = alt_fill
            if c_idx in (1, 5, 8):
                cell.alignment = Alignment(horizontal="left", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="center", vertical="center")

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 14), 50)

    xlsx_path = "CaseCraft_Pinterest_Single_Mockup.xlsx"
    wb.save(xlsx_path)
    wb.save(f"public/{xlsx_path}")
    print(f"\nSaved Excel workbook ({len(rows)} single mockup rows) -> {xlsx_path}")
    print(f"Saved Excel workbook ({len(rows)} single mockup rows) -> public/{xlsx_path}")

    # 2. Write CSV (.csv)
    csv_path = "CaseCraft_Pinterest_Single_Mockup.csv"
    for out_p in [csv_path, f"public/{csv_path}"]:
        with open(out_p, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=PINTEREST_OFFICIAL_HEADERS)
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
        print(f"Saved CSV file ({len(rows)} single mockup rows) -> {out_p}")

if __name__ == "__main__":
    main()
