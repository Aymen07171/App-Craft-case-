#!/usr/bin/env python3
"""
scripts/generate_pinterest_single_mockup_excel.py
Generates the official Pinterest Bulk Upload Excel workbook (.xlsx) and CSV file (.csv)
for the 6 Frog & Lava Lamp designs with STRICTLY ONE mockup per product (the Primary Custom Lifestyle Mockup iPhone 18 Pro Max).
"""

import csv
import os
from datetime import datetime, timedelta
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

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

base_date = datetime.utcnow().date() + timedelta(days=1)

FROG_COLLECTION_PINS = [
    {
        "Title": "Surreal Suncatcher Vitrail Mini Frog Floating Lava Lamp Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012133501-1f1c641b-96f5-69c8-9f99-7ae38c3b7b9e.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Surreal stained glass vitrail suncatcher phone case featuring an adorable mini green frog floating "
            "peacefully inside a glowing molten lava lamp under rainbow prism light. Dual-layer impact-resistant "
            "polycarbonate outer shell with shock-absorbing TPU inner liner. Fits 34 iPhone & Samsung Galaxy models."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=suncatcher_frog_002",
        "Publish date": (base_date + timedelta(days=0)).isoformat(),
        "Keywords": (
            "suncatcher frog, vitrail phone case, floating frog case, lava lamp case, stained glass frog, "
            "cute frog phone case, iphone 18 pro max, samsung galaxy s26, tough phone case, rainbow prism case, "
            "groovy retro frog, cottagecore frog, frog lover gift"
        ),
    },
    {
        "Title": "Gothic Cathedral Vitrail Wizard Frog Lava Potion Lamp Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012133905-1f1c6424-ae2e-6ec4-904c-1ee442ad1e48.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Gothic cathedral stained glass vitrail phone case featuring a wise wizard frog in a celestial purple hat "
            "holding a crystal staff beside a bubbling molten lava potion lamp beneath cathedral rose windows. "
            "Premium dual-layer Tough Case with impact-resistant polycarbonate outer shell."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=wizard_frog_003",
        "Publish date": (base_date + timedelta(days=1)).isoformat(),
        "Keywords": (
            "wizard frog case, gothic stained glass, vitrail phone case, potion lava lamp, witchy frog case, "
            "cathedral vitrail, iphone 18 pro max, samsung galaxy s26, tough phone case, dark academia frog, "
            "fantasy frog cover, cottagecore witch, magical frog gift"
        ),
    },
    {
        "Title": "Celestial Tarot Card Vitrail Moon Frog Sacred Lava Lamp Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012133954-1f1c6426-811f-603a-a834-2a95200fac38.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Celestial tarot card stained glass vitrail phone case featuring a mystical moon frog perched on a golden "
            "crescent moon beside a glowing sacred lava lamp under midnight constellations and luna moths. "
            "Premium dual-layer Tough Case with shock-absorbing TPU liner."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=tarot_frog_004",
        "Publish date": (base_date + timedelta(days=2)).isoformat(),
        "Keywords": (
            "celestial tarot case, moon frog case, vitrail phone case, stained glass moon, sacred lava lamp, "
            "tarot card case, iphone 18 pro max, samsung galaxy s26, tough phone case, luna moth case, "
            "witchy aesthetic, mystical frog gift, zodiac phone case"
        ),
    },
    {
        "Title": "Western Disco Vitrail 70s Cowboy Frog Desert Lava Lamp Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012134043-1f1c6428-58bb-654c-891e-16ec86c827dd.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Western disco 1970s stained glass vitrail phone case featuring a groovy cowboy frog in a ten-gallon Stetson hat "
            "under a sparkling disco ball beside a desert saguaro cactus lava lamp. "
            "Impact-resistant dual-layer Tough Case with glossy vibrant backplate."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=cowboy_frog_005",
        "Publish date": (base_date + timedelta(days=3)).isoformat(),
        "Keywords": (
            "cowboy frog case, western disco case, 70s retro vitrail, desert lava lamp, stained glass frog, "
            "disco cowgirl case, iphone 18 pro max, samsung galaxy s26, tough phone case, country western frog, "
            "groovy 70s case, yall frog gift, rodeo frog cover"
        ),
    },
    {
        "Title": "70s Vinyl Lo-Fi DJ Frog Bubbling Lava Lamp Vitrail Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012134129-1f1c642a-121e-6326-baa6-32424d5077df.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Chill lo-fi 1970s stained glass vitrail phone case featuring a retro audiophile DJ frog wearing gold headphones "
            "spinning vintage vinyl on a turntable beside a bubbling warm amber lava lamp. "
            "Dual-layer shock-absorbing protective Tough Case."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=lofi_frog_006",
        "Publish date": (base_date + timedelta(days=4)).isoformat(),
        "Keywords": (
            "lofi frog case, dj frog phone case, vinyl record case, 70s audio vitrail, bubbling lava lamp, "
            "retro audiophile, iphone 18 pro max, samsung galaxy s26, tough phone case, chill lofi hip hop, "
            "stained glass frog, music lover gift, turntable case"
        ),
    },
    {
        "Title": "UV Blacklight Cyber-Vitrail Acid-Melt Lava Lamp Frog Tough Case",
        "Media URL": "https://d123s6f1z9g2wk.cloudfront.net/files/2026/10/20261012134216-1f1c642b-d1cf-6426-874a-32424d5077df.png",
        "Pinterest board": "Phone Cases",
        "Thumbnail": "",
        "Description": (
            "Electric neon UV blacklight psychedelic cyber-vitrail phone case featuring an acid-melt trippy cyber frog "
            "bathed in glowing fluorescent magenta, electric cyan, and neon green lava droplets. "
            "Dual-layer ultra-durable Tough Case."
        ),
        "Link": "https://www.etsy.com/shop/CraftCasesStudio?utm_source=pinterest&utm_medium=social&utm_campaign=cyber_frog_007",
        "Publish date": (base_date + timedelta(days=5)).isoformat(),
        "Keywords": (
            "uv blacklight case, cyber vitrail case, neon frog case, acid melt lava lamp, psychedelic phone cover, "
            "trippy rave case, iphone 18 pro max, samsung galaxy s26, tough phone case, fluorescent frog, "
            "edm rave aesthetic, electric neon case, cyberpunk frog"
        ),
    },
]


def build_single_mockup_excel(output_paths: list[str]) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Pinterest_Single_Mockup"

    header_fill = PatternFill(start_color="E60023", end_color="E60023", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    body_font = Font(name="Calibri", size=10, color="111827")
    link_font = Font(name="Calibri", size=10, color="1D4ED8", underline="single")
    thin_border = Border(
        left=Side(style="thin", color="D1D5DB"),
        right=Side(style="thin", color="D1D5DB"),
        top=Side(style="thin", color="D1D5DB"),
        bottom=Side(style="thin", color="D1D5DB"),
    )

    # Row 1: Official Pinterest Bulk Upload Headers
    ws.append(PINTEREST_OFFICIAL_HEADERS)
    ws.row_dimensions[1].height = 26

    for col_idx in range(1, len(PINTEREST_OFFICIAL_HEADERS) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    # Data Rows: Strictly 1 Mockup Row per Product (the Primary iPhone 18 Pro Max Mockup)
    for r_idx, pin in enumerate(FROG_COLLECTION_PINS, start=2):
        row_values = [pin[h] for h in PINTEREST_OFFICIAL_HEADERS]
        ws.append(row_values)
        ws.row_dimensions[r_idx].height = 54

        for col_idx, header_name in enumerate(PINTEREST_OFFICIAL_HEADERS, start=1):
            cell = ws.cell(row=r_idx, column=col_idx)
            cell.border = thin_border
            if header_name in ("Media URL", "Link"):
                cell.font = link_font
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=False)
            else:
                cell.font = body_font
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    col_widths = {
        "Title": 48,
        "Media URL": 75,
        "Pinterest board": 20,
        "Thumbnail": 14,
        "Description": 64,
        "Link": 65,
        "Publish date": 16,
        "Keywords": 60,
    }
    for col_idx, header_name in enumerate(PINTEREST_OFFICIAL_HEADERS, start=1):
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = col_widths.get(header_name, 24)

    ws.freeze_panes = "A2"

    for path in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        wb.save(path)
        print(f"Saved Excel workbook ({len(FROG_COLLECTION_PINS)} single mockup rows) -> {path}")


def build_single_mockup_csv(output_paths: list[str]) -> None:
    for path in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=PINTEREST_OFFICIAL_HEADERS, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()
            for pin in FROG_COLLECTION_PINS:
                writer.writerow(pin)
        print(f"Saved CSV file ({len(FROG_COLLECTION_PINS)} single mockup rows) -> {path}")


if __name__ == "__main__":
    build_single_mockup_excel([
        "CaseCraft_Pinterest_Single_Mockup.xlsx",
        "public/CaseCraft_Pinterest_Single_Mockup.xlsx",
    ])
    build_single_mockup_csv([
        "CaseCraft_Pinterest_Single_Mockup.csv",
        "public/CaseCraft_Pinterest_Single_Mockup.csv",
    ])
