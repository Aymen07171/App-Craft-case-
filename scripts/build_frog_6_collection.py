#!/usr/bin/env python3
"""
scripts/build_frog_6_collection.py
Generates the 6 Master 9:16 Artworks (1344x2389 @ 300 DPI) and
12 Dual-Device Photorealistic Lifestyle Mockups (2048x2048 @ 300 DPI)
for the Frog & Lava Lamp collection:
  CASE-FROGLV-002: Surreal Suncatcher Vitrail
  CASE-FROGLV-003: Gothic Cathedral Vitrail
  CASE-FROGLV-004: Celestial Tarot Card Vitrail
  CASE-FROGLV-005: Western Disco Vitrail
  CASE-FROGLV-006: 70s Vinyl Lo-Fi DJ Frog
  CASE-FROGLV-007: UV Blacklight Cyber-Vitrail
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageFilter

BRAIN_DIR = Path(r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c")
PUBLIC_DESIGNS = Path("public/designs")
PUBLIC_MOCKUPS = Path("public/mockups")
PUBLIC_DESIGNS.mkdir(parents=True, exist_ok=True)
PUBLIC_MOCKUPS.mkdir(parents=True, exist_ok=True)

COLLECTION = [
    {
        "sku": "CASE-FROGLV-002",
        "title": "Surreal Suncatcher Vitrail Mini Frog Floating Lava Lamp",
        "art_file": BRAIN_DIR / "surreal_suncatcher_frog_artwork_1791809122964.jpg",
        "existing_iphone": BRAIN_DIR / "suncatcher_frog_iphone_mockup_1791809247094.jpg",
        "existing_samsung": BRAIN_DIR / "suncatcher_frog_samsung_mockup_1791809260072.jpg",
    },
    {
        "sku": "CASE-FROGLV-003",
        "title": "Gothic Cathedral Vitrail Wizard Frog Lava Potion Lamp",
        "art_file": BRAIN_DIR / "gothic_wizard_frog_artwork_1791809134841.jpg",
        "existing_iphone": BRAIN_DIR / "gothic_wizard_frog_iphone_mockup_1791809271507.jpg",
        "existing_samsung": BRAIN_DIR / "gothic_wizard_frog_samsung_mockup_1791809281591.jpg",
    },
    {
        "sku": "CASE-FROGLV-004",
        "title": "Celestial Tarot Card Vitrail Moon Frog Sacred Lava Lamp",
        "art_file": BRAIN_DIR / "celestial_tarot_frog_artwork_1791809147121.jpg",
        "existing_iphone": None,
        "existing_samsung": None,
    },
    {
        "sku": "CASE-FROGLV-005",
        "title": "Western Disco Vitrail 70s Cowboy Frog Desert Lava Lamp",
        "art_file": BRAIN_DIR / "western_disco_frog_artwork_1791809183550.jpg",
        "existing_iphone": None,
        "existing_samsung": None,
    },
    {
        "sku": "CASE-FROGLV-006",
        "title": "70s Vinyl Lo-Fi DJ Frog Bubbling Lava Lamp Vitrail",
        "art_file": BRAIN_DIR / "vinyl_lofi_dj_frog_artwork_1791809196392.jpg",
        "existing_iphone": None,
        "existing_samsung": None,
    },
    {
        "sku": "CASE-FROGLV-007",
        "title": "UV Blacklight Cyber-Vitrail Acid-Melt Lava Lamp Frog",
        "art_file": BRAIN_DIR / "uv_blacklight_cyber_frog_artwork_1791809207670.jpg",
        "existing_iphone": None,
        "existing_samsung": None,
    },
]

# Verified Studio Templates and Masks
IPHONE_TEMPLATE = BRAIN_DIR / "suncatcher_frog_iphone_mockup_1791809247094.jpg"
SAMSUNG_TEMPLATE = BRAIN_DIR / "suncatcher_frog_samsung_mockup_1791809260072.jpg"
IPHONE_MASK = BRAIN_DIR / "mask_iphone.png"
SAMSUNG_MASK = BRAIN_DIR / "mask_samsung.png"

IPHONE_CORNERS = [(386.2, 139.0), (735.5, 181.9), (648.4, 891.3), (299.1, 848.4)]
SAMSUNG_CORNERS = [(204.3, 228.8), (577.6, 85.5), (844.7, 781.4), (471.4, 924.7)]

def solve_homography(dest_pts, src_pts):
    matrix = []
    for (x, y), (X, Y) in zip(dest_pts, src_pts):
        matrix.append([x, y, 1, 0, 0, 0, -x*X, -y*X, X])
        matrix.append([0, 0, 0, x, y, 1, -x*Y, -y*Y, Y])
    n = 8
    for i in range(n):
        max_r = max(range(i, n), key=lambda r: abs(matrix[r][i]))
        matrix[i], matrix[max_r] = matrix[max_r], matrix[i]
        pivot = matrix[i][i]
        for j in range(i, n + 1):
            matrix[i][j] /= pivot
        for r in range(n):
            if r != i:
                factor = matrix[r][i]
                for j in range(i, n + 1):
                    matrix[r][j] -= factor * matrix[i][j]
    return [matrix[i][8] for i in range(8)]

def render_warped_mockup(template_path, mask_path, art_img, dest_corners):
    template = Image.open(template_path).convert("RGB")
    mask = Image.open(mask_path).convert("L")
    W, H = art_img.size
    src_pts = [(0, 0), (W, 0), (W, H), (0, H)]
    coeffs = solve_homography(dest_corners, src_pts)
    warped = art_img.transform(template.size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)
    smooth_mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    return Image.composite(warped, template, smooth_mask)

def process_collection():
    print("=" * 70)
    print("STARTING FROG & LAVA LAMP 6-DESIGN ARTWORK & MOCKUP BUILD")
    print("=" * 70)

    for item in COLLECTION:
        sku = item["sku"]
        title = item["title"]
        print(f"\nProcessing [{sku}] {title}...")

        # 1. Format Master 9:16 Artwork (1344 x 2389 @ 300 DPI)
        raw_art = Image.open(item["art_file"]).convert("RGB")
        art_1344 = raw_art.resize((1344, 2389), Image.Resampling.LANCZOS)
        out_art_path = PUBLIC_DESIGNS / f"{sku}_9x16_Artwork.png"
        art_1344.save(out_art_path, dpi=(300, 300), optimize=True)
        print(f"  [OK] Saved Master Artwork -> {out_art_path} (1344x2389 @ 300 DPI)")

        # 2. Format / Render iPhone 18 Pro Max Lifestyle Mockup (2048 x 2048 @ 300 DPI)
        out_iphone_path = PUBLIC_MOCKUPS / f"{sku}_iPhone_18_Pro_Max_Lifestyle.png"
        if item["existing_iphone"] and item["existing_iphone"].exists():
            im_ip = Image.open(item["existing_iphone"]).convert("RGB")
        else:
            im_ip = render_warped_mockup(IPHONE_TEMPLATE, IPHONE_MASK, raw_art, IPHONE_CORNERS)
        im_ip_2048 = im_ip.resize((2048, 2048), Image.Resampling.LANCZOS)
        im_ip_2048.save(out_iphone_path, dpi=(300, 300), optimize=True)
        print(f"  [OK] Saved iPhone Lifestyle -> {out_iphone_path} (2048x2048 @ 300 DPI)")

        # 3. Format / Render Samsung Galaxy S26 Lifestyle Mockup (2048 x 2048 @ 300 DPI)
        out_samsung_path = PUBLIC_MOCKUPS / f"{sku}_Samsung_Galaxy_S26_Lifestyle.png"
        if item["existing_samsung"] and item["existing_samsung"].exists():
            im_sg = Image.open(item["existing_samsung"]).convert("RGB")
        else:
            im_sg = render_warped_mockup(SAMSUNG_TEMPLATE, SAMSUNG_MASK, raw_art, SAMSUNG_CORNERS)
        im_sg_2048 = im_sg.resize((2048, 2048), Image.Resampling.LANCZOS)
        im_sg_2048.save(out_samsung_path, dpi=(300, 300), optimize=True)
        print(f"  [OK] Saved Samsung Lifestyle -> {out_samsung_path} (2048x2048 @ 300 DPI)")

    print("\n" + "=" * 70)
    print("ALL 6 ARTWORKS AND 12 LIFESTYLE MOCKUPS PRODUCED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    process_collection()
