#!/usr/bin/env python3
"""
scripts/generate_gemini_web_batch.py
Generates the remaining 4 artworks (Designs 7, 8, 9, 10) on authenticated Google Gemini Web:
- Design 7: Belem Tower Maritime Sardine Cannery Label
- Design 8: Sardinha com Pimentos (Grilled Pepper Sardine Fest)
- Design 9: Madeira Island Exotic Passion Fruit Sardine Specialty
- Design 10: Cascais Riviera Sunbather's Sardine Picnic
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, "scripts")
from gemini_web_selenium import GeminiWebAutomationEngine

BRAIN_DIR = Path(r"C:\Users\jacka\.gemini\antigravity\brain\93b4ac09-5823-4126-86c4-fc067944487c")

PROMPTS = [
    (
        7,
        "belem_tower_cannery_label.png",
        (
            "19th-century royal archival engraving and maritime sardine cannery label. "
            "Historic Torre de Belém fortress framed by Portuguese royal coat of arms, armillary sphere, "
            "ornate scrolls, and 'Conservas Reais de Portugal' banner with shimmering silver sardines. "
            "Antique parchment, royal blue, sepia ink, foil gold, 9:16 vertical full bleed pure 2D graphic art, "
            "zero mockups, no phone frame."
        )
    ),
    (
        8,
        "sardinha_com_pimentos_fest.png",
        (
            "Retro street festival poster celebrating Santos Populares in Lisbon. "
            "Charred golden grilled sardines resting on rustic broa cornbread with roasted red and green bell pepper strips, "
            "sea salt crystals, festive paper garland bunting, paper lanterns, and basil manjerico pots. "
            "Charcoal gray, pepper red, bell pepper green, cornbread ochre, 9:16 vertical full bleed pure 2D graphic art, "
            "zero mockups, no phone frame."
        )
    ),
    (
        9,
        "madeira_passion_fruit_sardine.png",
        (
            "Botanical Art Nouveau gilded vintage sardine can label for Madeira Island. "
            "Accented with tropical purple passion flowers, sliced golden passion fruit with seeds, "
            "vibrant green banana palm leaves, and dramatic Atlantic volcanic sea cliffs in the background. "
            "Lush jungle green, passion violet, sunset ochre, ocean teal, 9:16 vertical full bleed pure 2D graphic art, "
            "zero mockups, no phone frame."
        )
    ),
    (
        10,
        "cascais_riviera_picnic.png",
        (
            "1950s Mid-Century Riviera gouache illustration of a chic beach picnic on the Portuguese Cascais coast. "
            "Retro cat-eye sunglasses, striped blue-and-white cabana beach umbrella, golden tin of luxury sardines with lemon slices "
            "and a vintage fork on a sunny beach towel over warm golden sand with sparkling turquoise Atlantic waves. "
            "Pastel turquoise, coral pink, warm sand, striped navy, 9:16 vertical full bleed pure 2D graphic art, "
            "zero mockups, no phone frame."
        )
    ),
]

def main():
    engine = GeminiWebAutomationEngine(timeout=100)
    engine.start_browser()
    print("Attached to Gemini Web session!")

    for idx, filename, prompt in PROMPTS:
        target_path = BRAIN_DIR / filename
        if target_path.exists():
            print(f"Skipping Design {idx} (already exists: {target_path})")
            continue

        print(f"\n--- Generating Design {idx}: {filename} ---")
        try:
            res = engine.generate_image(prompt, index=idx)
            if "image_bytes" in res:
                target_path.write_bytes(res["image_bytes"])
                print(f"[OK] Saved Design {idx} to {target_path}")
            else:
                print(f"[ERROR] No image bytes returned for Design {idx}")
        except Exception as e:
            print(f"[ERROR] Failed to generate Design {idx}: {e}")
        time.sleep(3)

    print("\nAll remaining Gemini Web generations completed!")

if __name__ == "__main__":
    main()
