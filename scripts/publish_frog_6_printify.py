#!/usr/bin/env python3
"""
scripts/publish_frog_6_printify.py
Uploads the 6 frog artworks to Printify, creates 6 Tough Case products (Blueprint 269, Provider 99, 34 variants @ $22.20),
and records the resulting product IDs for Selenium mockup configuration and Etsy publishing.
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error
from pathlib import Path

# Load credentials from .env
env_text = Path(".env").read_text(encoding="utf-8")
token = [l.split("=", 1)[1].strip() for l in env_text.splitlines() if l.startswith("PRINTIFY_API_TOKEN=")][0]

SHOP_ID = "29067558"
BASE_URL = "https://api.printify.com/v1"

HEADERS = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "User-Agent": "CraftCase/1.0"
}

def api_req(path, method="GET", body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def upload_image(file_path, file_name):
    print(f"Uploading image: {file_name}...")
    b64 = base64.b64encode(Path(file_path).read_bytes()).decode("ascii")
    payload = {"file_name": file_name, "contents": b64}
    status, res = api_req("/uploads/images.json", "POST", payload)
    if status == 200:
        print(f"  [OK] Uploaded {file_name} -> ID: {res.get('id')}")
        return res
    else:
        raise RuntimeError(f"Failed to upload image {file_name}: {status} {res}")

def main():
    print("=" * 70)
    print("CREATING 6 FROG PRODUCTS ON PRINTIFY (SHOP 29067558)")
    print("=" * 70)

    # 1. Fetch variant IDs from existing template product
    _, ref_prod = api_req(f"/shops/{SHOP_ID}/products/6acca8512fe24e63d7081433.json")
    variant_ids = [v["id"] for v in ref_prod["variants"] if v.get("is_enabled")]
    print(f"Found {len(variant_ids)} enabled variants for Blueprint 269 / Provider 99.")

    designs = [
        {
            "sku": "CASE-FROGLV-002",
            "title": "Surreal Suncatcher Vitrail Mini Frog Floating Lava Lamp Tough Case",
            "description": "Surreal stained glass vitrail suncatcher phone case featuring an adorable mini green frog floating peacefully inside a glowing molten lava lamp under rainbow prism light. Dual-layer impact-resistant polycarbonate outer shell with shock-absorbing TPU inner liner.",
            "art_file": "public/designs/CASE-FROGLV-002_9x16_Artwork.png",
            "tags": ["suncatcher frog", "vitrail phone case", "floating frog case", "lava lamp case", "stained glass frog", "cute frog phone case", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "rainbow prism case", "groovy retro frog", "cottagecore frog", "frog lover gift"]
        },
        {
            "sku": "CASE-FROGLV-003",
            "title": "Gothic Cathedral Vitrail Wizard Frog Lava Potion Lamp Tough Case",
            "description": "Gothic cathedral stained glass vitrail phone case featuring a wise wizard frog in a celestial purple hat holding a crystal staff beside a bubbling molten lava potion lamp beneath cathedral rose windows. Premium dual-layer Tough Case with impact-resistant polycarbonate outer shell.",
            "art_file": "public/designs/CASE-FROGLV-003_9x16_Artwork.png",
            "tags": ["wizard frog case", "gothic stained glass", "vitrail phone case", "potion lava lamp", "witchy frog case", "cathedral vitrail", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "dark academia frog", "fantasy frog cover", "cottagecore witch", "magical frog gift"]
        },
        {
            "sku": "CASE-FROGLV-004",
            "title": "Celestial Tarot Card Vitrail Moon Frog Sacred Lava Lamp Tough Case",
            "description": "Celestial tarot card stained glass vitrail phone case featuring a mystical moon frog perched on a golden crescent moon beside a glowing sacred lava lamp under midnight constellations and luna moths. Premium dual-layer Tough Case with shock-absorbing TPU liner.",
            "art_file": "public/designs/CASE-FROGLV-004_9x16_Artwork.png",
            "tags": ["celestial tarot case", "moon frog case", "vitrail phone case", "stained glass moon", "sacred lava lamp", "tarot card case", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "luna moth case", "witchy aesthetic", "mystical frog gift", "zodiac phone case"]
        },
        {
            "sku": "CASE-FROGLV-005",
            "title": "Western Disco Vitrail 70s Cowboy Frog Desert Lava Lamp Tough Case",
            "description": "Western disco 1970s stained glass vitrail phone case featuring a groovy cowboy frog in a ten-gallon Stetson hat under a sparkling disco ball beside a desert saguaro cactus lava lamp. Impact-resistant dual-layer Tough Case with glossy vibrant backplate.",
            "art_file": "public/designs/CASE-FROGLV-005_9x16_Artwork.png",
            "tags": ["cowboy frog case", "western disco case", "70s retro vitrail", "desert lava lamp", "stained glass frog", "disco cowgirl case", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "country western frog", "groovy 70s case", "yall frog gift", "rodeo frog cover"]
        },
        {
            "sku": "CASE-FROGLV-006",
            "title": "70s Vinyl Lo-Fi DJ Frog Bubbling Lava Lamp Vitrail Tough Case",
            "description": "Chill lo-fi 1970s stained glass vitrail phone case featuring a retro audiophile DJ frog wearing gold headphones spinning vintage vinyl on a turntable beside a bubbling warm amber lava lamp. Dual-layer shock-absorbing protective Tough Case.",
            "art_file": "public/designs/CASE-FROGLV-006_9x16_Artwork.png",
            "tags": ["lofi frog case", "dj frog phone case", "vinyl record case", "70s audio vitrail", "bubbling lava lamp", "retro audiophile", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "chill lofi hip hop", "stained glass frog", "music lover gift", "turntable case"]
        },
        {
            "sku": "CASE-FROGLV-007",
            "title": "UV Blacklight Cyber-Vitrail Acid-Melt Lava Lamp Frog Tough Case",
            "description": "Electric neon UV blacklight psychedelic cyber-vitrail phone case featuring an acid-melt trippy cyber frog bathed in glowing fluorescent magenta, electric cyan, and neon green lava droplets. Dual-layer ultra-durable Tough Case.",
            "art_file": "public/designs/CASE-FROGLV-007_9x16_Artwork.png",
            "tags": ["uv blacklight case", "cyber vitrail case", "neon frog case", "acid melt lava lamp", "psychedelic phone cover", "trippy rave case", "iphone 18 pro max", "samsung galaxy s26", "tough phone case", "fluorescent frog", "edm rave aesthetic", "electric neon case", "cyberpunk frog"]
        },
    ]

    results = []
    for d in designs:
        print(f"\n--- Processing {d['sku']}: {d['title']} ---")
        art_res = upload_image(d["art_file"], f"{d['sku']}_9x16_Artwork.png")
        art_id = art_res["id"]

        create_payload = {
            "title": d["title"],
            "description": d["description"],
            "blueprint_id": 269,
            "print_provider_id": 99,
            "tags": d["tags"],
            "variants": [{"id": vid, "price": 2220, "is_enabled": True} for vid in variant_ids],
            "print_areas": [{
                "variant_ids": variant_ids,
                "placeholders": [{
                    "position": "front",
                    "images": [{"id": art_id, "x": 0.5, "y": 0.5, "scale": 1, "angle": 0}]
                }]
            }]
        }

        st, created = api_req(f"/shops/{SHOP_ID}/products.json", "POST", create_payload)
        if st == 200:
            pid = created["id"]
            print(f"[SUCCESS] Created Printify Product: {pid}")
            results.append({
                "sku": d["sku"],
                "product_id": pid,
                "title": d["title"],
                "art_id": art_id,
                "art_src": art_res.get("src", "")
            })
        else:
            print(f"[ERROR] Failed to create product: {st} {created}")

    out_file = Path("scripts/created_frog_products.json")
    out_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\n[OK] Saved results to {out_file}")

if __name__ == "__main__":
    main()
