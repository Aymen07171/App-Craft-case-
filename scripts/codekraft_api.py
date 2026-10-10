#!/usr/bin/env python3
"""
CodeKraft API Integration & Backup Generation Client
Module: scripts/codekraft_api.py

Provides direct API-based design generation, metadata synthesis, and quota management.
Acts as the backup generator when web application quota limits or restrictions are reached,
or as the primary generator in direct API mode.
"""

import os
import sys
import json
import time
import base64
import random
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# Production theme presets for prompt synthesis & rich metadata
CURATED_THEMES: Dict[str, Dict[str, Any]] = {
    "Gothic Vitrail Fox": {
        "niche": "Stained Glass / Fantasy Art",
        "category": "Electronics Cases / Phone Cases",
        "character": "peaceful sleeping red woodland fox curled serenely with fluffy tail wrapped around body, centered in lower 60% of canvas",
        "halo": "radiant segmented cathedral sunburst halo with amber glass rays and stars in top 35% safe zone",
        "botanical": "red fly agaric mushrooms, autumn oak leaves, and glowing forest sprites",
        "colors": "warm amber gold, fiery orange, deep ruby red, and dark leaded solder outlines",
        "title_prefix": "Stained Glass Woodland Fox Tough Phone Case",
        "style": "Gothic Vitrail, Art Nouveau, Jewel Tone",
        "tags": [
            "stained glass case", "woodland fox", "cathedral vitrail", "autumn fox cover",
            "tough phone case", "iphone 16 case", "samsung s25 case", "art nouveau print",
            "cottagecore aesthetic", "jewel tone glass", "animal illustration", "protective case",
            "unique art gift"
        ]
    },
    "Anime Sea Pirate": {
        "niche": "Anime / Japanese Woodblock",
        "category": "Electronics Cases / Phone Cases",
        "character": "heroic anime pirate captain holding straw hat with windblown long coat, centered proudly in lower canvas",
        "halo": "surging stylized Japanese Great Waves with foaming crests and crimson rising sun crest in upper background",
        "botanical": "flying sakura petals, compass rose, and ocean spray droplets",
        "colors": "Prussian indigo blue, vermillion red, parchment cream, and gold trim",
        "title_prefix": "Anime Pirate Great Wave Tough Phone Case",
        "style": "Ukiyo-e Anime, Great Wave, Manga Illustration",
        "tags": [
            "anime phone case", "pirate captain", "great wave ukiyoe", "tarot card case",
            "mucha art nouveau", "japanese wave art", "tough phone case", "straw hat pirate",
            "manga phone cover", "iphone 15 case", "galaxy s24 case", "cool anime gift",
            "protective phone cover"
        ]
    },
    "Celestial Spirit Wolf": {
        "niche": "Dark Fantasy / Mystic Arcana",
        "category": "Electronics Cases / Phone Cases",
        "character": "ethereal anime witch maiden with crystal staff accompanied by luminous cyan spirit wolf familiar curled beside her",
        "halo": "gothic cathedral rose-window mandala with silver crescent moon phases in upper safe zone",
        "botanical": "midnight purple bellflowers, runic crystals, and glowing spirit motes",
        "colors": "midnight obsidian, bioluminescent cyan, amethyst violet, and silver came",
        "title_prefix": "Celestial Witch and Spirit Wolf Tough Case",
        "style": "Gothic Arcana, Celestial Magic, Fantasy Art",
        "tags": [
            "witch phone case", "spirit wolf", "gothic stained glass", "celestial magic",
            "anime witch cover", "fantasy artwork", "tough phone case", "iphone 16 pro max",
            "samsung s25 ultra", "amethyst purple", "wiccan aesthetic", "pagan phone case",
            "protective cover"
        ]
    },
    "Kitsune Samurai": {
        "niche": "Japanese Folklore / Cyberpunk Bushido",
        "category": "Electronics Cases / Phone Cases",
        "character": "masked kitsune fox warrior in ornate haori holding a gleaming katana in ready stance in lower composition",
        "halo": "massive radiant blood moon with drifting storm clouds and floating azure will-o-wisps in upper sky",
        "botanical": "blooming red spider lilies (higanbana) and falling black raven feathers",
        "colors": "crimson scarlet, midnight charcoal, ghost cyan, and liquid gold",
        "title_prefix": "Kitsune Samurai Blood Moon Tough Case",
        "style": "Bushido Cyberpunk, Japanese Folklore, Blood Moon",
        "tags": [
            "kitsune samurai", "fox mask case", "blood moon cover", "red spider lily",
            "higanbana art", "japanese warrior", "tough phone case", "anime armor case",
            "iphone 14 case", "samsung s26 case", "bushido artwork", "aesthetic phone case",
            "gift for anime fan"
        ]
    },
    "Japanese Dragon": {
        "niche": "Japanese Folklore / Ukiyo-e Mythology",
        "category": "Electronics Cases / Phone Cases",
        "character": "magnificent legendary Japanese celestial dragon (Ryu) coiling powerfully with iridescent emerald and azure scales, sharp talons, flowing serpentine body, fierce expressive golden eyes, and elegant flowing whiskers, centered in lower 65% of the canvas",
        "halo": "atmospheric swirling Japanese sumi-e style mist clouds, drifting storm crests, and subtle golden sunburst halo in upper safe zone (top 35% camera cutout area uncluttered)",
        "botanical": "delicate drifting sakura cherry blossom petals, swirling wind currents, floating golden lightning embers, and stylized ukiyo-e ocean wave foam",
        "colors": "deep Prussian blue, vermillion red, imperial gold leaf accents, and bold sumi ink linework",
        "title_prefix": "Japanese Celestial Dragon Tough Phone Case",
        "style": "Japanese Ukiyo-e, Stained Glass Vitrail, Mythical Ryu",
        "tags": [
            "japanese dragon case", "ryu phone cover", "mythical dragon art", "tough phone case",
            "iphone 16 case", "samsung s25 case", "oriental dragon artwork", "asian aesthetic cover",
            "durable phone case", "japanese art gift", "dragon illustration", "protective phone case",
            "unique art cover"
        ]
    },
    "Neon Cyber Ronin": {
        "niche": "Cyberpunk / Sci-Fi Synthwave",
        "category": "Electronics Cases / Phone Cases",
        "character": "armored cyber ronin warrior standing on a rain-drenched neon overpass with glowing dual katanas",
        "halo": "towering holographic megacity skyline with neon grid lines and data streams in upper atmosphere",
        "botanical": "floating circuit board traces, neon cherry blossom petals, and digital rain",
        "colors": "electric cyan, hot magenta, midnight obsidian, and acid yellow",
        "title_prefix": "Neon Cyber Ronin Synthwave Tough Case",
        "style": "Synthwave Cyberpunk, Neon Sci-Fi, Dark Futurism",
        "tags": [
            "cyberpunk case", "cyber ronin", "synthwave aesthetic", "neon phone cover",
            "tough phone case", "futuristic warrior", "katana art", "sci fi case",
            "iphone 16 pro", "galaxy s25 ultra", "gaming aesthetic", "protective case",
            "cyber art gift"
        ]
    },
    "Lotus Spirit": {
        "niche": "Zen Spiritual / Sacred Botanical",
        "category": "Electronics Cases / Phone Cases",
        "character": "serene glowing lotus spirit deity maiden meditating atop a magnificent blooming sacred lotus blossom with translucent petal robes and spiritual aura, centered in lower 65% of canvas",
        "halo": "radiant sacred geometry mandala halo with floating dewdrops and golden sunlight beams in upper safe zone (top 35% camera cutout area clear)",
        "botanical": "floating lotus petals, water lily pads, sacred koi fish silhouettes, and delicate water ripples",
        "colors": "serene rose quartz pink, imperial jade green, morning mist white, and liquid gold accents",
        "title_prefix": "Lotus Spirit Blossom Tough Phone Case",
        "style": "Zen Art Nouveau, Sacred Botanical Vitrail",
        "tags": [
            "lotus spirit case", "sacred lotus cover", "zen aesthetic phone case", "buddha lotus art",
            "tough phone case", "iphone 16 case", "samsung s25 case", "spiritual phone case",
            "meditation gift", "floral tough case", "water lily artwork", "protective phone case", "aesthetic zen case"
        ]
    },
    "Volcanic Dragon": {
        "niche": "Elemental Fantasy / Magma Beast",
        "category": "Electronics Cases / Phone Cases",
        "character": "colossal fiery magma dragon with molten obsidian scales, glowing lava veins, fierce blazing amber eyes, and smokey curling horns, centered in lower 65% of canvas",
        "halo": "towering volcanic ash plume with radiant crimson erupting magma halo and crackling lightning bolts in upper safe zone (top 35% camera cutout clear)",
        "botanical": "drifting glowing fire sparks, shattered basalt rock fragments, and swirling smoke ribbons",
        "colors": "incandescent molten orange, magma scarlet, charred obsidian charcoal, and sulfur gold",
        "title_prefix": "Volcanic Magma Dragon Tough Phone Case",
        "style": "Dark Fantasy, Elemental Fire, Epic Beast Illustration",
        "tags": [
            "volcanic dragon case", "fire dragon phone cover", "magma dragon art", "tough phone case",
            "iphone 16 case", "samsung s25 case", "lava aesthetic case", "mythical beast cover",
            "durable phone case", "cool dragon gift", "fantasy artwork", "protective case", "epic fantasy cover"
        ]
    },
    "Moon Butterfly Yokai": {
        "niche": "Japanese Dark Folklore / Mystic Yokai",
        "category": "Electronics Cases / Phone Cases",
        "character": "ethereal Japanese butterfly yokai spirit maiden with iridescent celestial moth wings patterned with lunar phases and luminous antennae, centered in lower 65% of canvas",
        "halo": "enormous glowing silver full moon with delicate wisteria blossoms and drifting midnight clouds in upper safe zone (top 35% camera cutout clear)",
        "botanical": "fluttering glowing spectral butterflies, hanging purple wisteria clusters, and stardust motes",
        "colors": "midnight indigo, iridescent lilac, bioluminescent cyan, and silver came outlines",
        "title_prefix": "Moon Butterfly Yokai Tough Phone Case",
        "style": "Japanese Yokai Art, Celestial Gothic, Ukiyo-e Fantasy",
        "tags": [
            "moon butterfly case", "yokai phone cover", "japanese butterfly art", "tough phone case",
            "iphone 16 case", "samsung s25 case", "celestial gothic case", "lunar aesthetic cover",
            "wisteria anime case", "aesthetic moth artwork", "protective tough case", "unique japanese gift", "mystic fantasy case"
        ]
    },
    "Phoenix Shrine Guardian": {
        "niche": "Japanese Mythology / Sacred Temple",
        "category": "Electronics Cases / Phone Cases",
        "character": "magnificent immortal vermillion fire phoenix (Suzaku) perched majestically before sacred Shinto shrine torii gate with luminous trailing feathers, centered in lower 65% of canvas",
        "halo": "sacred shimenawa rope and radiant golden sun crest with crimson temple clouds in upper safe zone (top 35% camera cutout clear)",
        "botanical": "flying vermillion maple leaves (momiji), sacred paper streamers (shide), and floating golden embers",
        "colors": "vermillion scarlet, imperial temple vermillion, radiant gold leaf, and deep lacquer black",
        "title_prefix": "Phoenix Shrine Guardian Tough Phone Case",
        "style": "Shinto Mythology, Suzaku Phoenix, Japanese Woodblock",
        "tags": [
            "phoenix phone case", "shrine guardian cover", "suzaku fire bird", "torii gate case",
            "tough phone case", "iphone 16 case", "samsung s25 case", "japanese mythology case",
            "shinto aesthetic", "fire phoenix artwork", "durable phone case", "sacred temple cover", "japanese art gift"
        ]
    },
    "Ronin Spirit": {
        "niche": "Bushido Samurai / Ghost Warrior",
        "category": "Electronics Cases / Phone Cases",
        "character": "spectral masterless ronin warrior in tattered haori and straw kasa hat, drawing a gleaming ghost katana with azure soul flames, centered in lower 65% of canvas",
        "halo": "silhouetted misty bamboo forest with pale crescent moon and drifting fog bank in upper safe zone (top 35% camera cutout clear)",
        "botanical": "windblown bamboo leaves, falling black raven feathers, and floating azure will-o-wisps",
        "colors": "slate blue, charcoal black, spectral ghost cyan, and cold steel silver",
        "title_prefix": "Ronin Spirit Bushido Tough Phone Case",
        "style": "Sumi-e Ink Wash, Bushido Folklore, Ghost Samurai",
        "tags": [
            "ronin phone case", "samurai spirit cover", "bushido warrior case", "ghost katana art",
            "tough phone case", "iphone 16 case", "samsung s25 case", "japanese warrior cover",
            "sumi e ink case", "anime sword case", "aesthetic samurai art", "protective phone cover", "gift for anime fan"
        ]
    },
    "Sea Dragon Guardian": {
        "niche": "Oceanic Mythology / Great Wave Ryu",
        "category": "Electronics Cases / Phone Cases",
        "character": "ancient majestic abyssal sea dragon (Ryujin) coiling gracefully through turquoise oceanic depths with pearl dragon jewel in claw, centered in lower 65% of canvas",
        "halo": "surging Great Wave water vortex with sea spray droplets and luminous tidal pearl in upper safe zone (top 35% camera cutout clear)",
        "botanical": "swirling water ribbons, flying ocean spray foam, bioluminescent coral branches, and tiny glowing sea sprites",
        "colors": "deep abyssal navy, vibrant aquamarine, iridescent pearl white, and seafoam gold",
        "title_prefix": "Sea Dragon Guardian Tough Phone Case",
        "style": "Ukiyo-e Ocean Wave, Abyssal Ryu, Japanese Sea Myth",
        "tags": [
            "sea dragon case", "ocean guardian cover", "ryujin phone case", "great wave dragon",
            "tough phone case", "iphone 16 case", "samsung s25 case", "ocean aesthetic cover",
            "abyssal dragon art", "japanese sea myth", "durable phone case", "protective case", "aquatic dragon gift"
        ]
    }
}


def resolve_theme_metadata(theme_name: str, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
    """
    Intelligently resolves or dynamically synthesizes rich theme metadata,
    ensuring strict compliance with Phone Case 9:16 safe-zone rules for ANY input theme.
    """
    clean_name = theme_name.strip()
    low = clean_name.lower()

    # 1. Exact match in curated themes
    if clean_name in CURATED_THEMES:
        return dict(CURATED_THEMES[clean_name])

    # 2. Keyword match in curated themes
    for k, v in CURATED_THEMES.items():
        k_low = k.lower()
        if k_low in low or any(word in low for word in k_low.split() if len(word) > 3):
            return dict(v)

    # 3. Dynamic synthesis for arbitrary custom theme
    # Subject detection
    subject = "prominent detailed focal character"
    if "dragon" in low:
        subject = "magnificent legendary Japanese celestial dragon (Ryu) coiling with iridescent scales, sharp talons, and fierce expressive eyes"
    elif "samurai" in low or "ninja" in low or "warrior" in low:
        subject = "noble armored warrior in traditional embroidered robes holding an ornate blade in ready stance"
    elif "wolf" in low or "fox" in low or "kitsune" in low:
        subject = "serene mystical spirit animal with glowing spiritual aura and detailed fur"
    elif "witch" in low or "mage" in low or "sorcerer" in low:
        subject = "ethereal magic wielder with crystal catalyst surrounded by mystical familiars"
    elif "ocean" in low or "wave" in low or "fish" in low or "koi" in low:
        subject = "graceful iridescent Japanese koi or sea guardian navigating surging stylized waves"
    elif "cyber" in low or "robot" in low or "mech" in low:
        subject = "sleek high-tech armored cybernetic figure with glowing energy circuits"
    elif "flower" in low or "floral" in low or "rose" in low:
        subject = "intricate baroque botanical arrangement with lush blooming petals and thorny vines"
    else:
        subject = f"majestic artistic representation of {clean_name}"

    # Style detection
    style = "Fine Art Illustration"
    if "japan" in low or "ukiyo" in low:
        style = "Japanese Ukiyo-e, Sumi-e Woodblock Print"
    elif "gothic" in low or "glass" in low or "vitrail" in low:
        style = "Gothic Stained Glass Vitrail, Art Nouveau"
    elif "cyber" in low or "neon" in low:
        style = "Cyberpunk Synthwave, Dark Sci-Fi"
    elif "anime" in low or "manga" in low:
        style = "Masterpiece Anime Concept Art, Manga Illustration"

    tags = [
        f"{low.replace(' ', '_')[:16]} case",
        f"{clean_name.split()[0].lower()} phone cover",
        "tough phone case",
        "iphone 16 case",
        "samsung s25 case",
        "protective phone case",
        "aesthetic art cover",
        "dual layer case",
        "unique art gift",
        "8k wallpaper print",
        "shockproof case",
        "custom design cover",
        "artisan phone case"
    ]

    return {
        "niche": f"{clean_name.title()} / Specialty Art",
        "category": "Electronics Cases / Phone Cases",
        "character": f"{subject}, centered and prominent in lower 65% of canvas",
        "halo": "atmospheric ambient background with subtle radiant halo or crest in top 35% safe zone, keeping camera hardware clearance clear",
        "botanical": "drifting ornamental particles, stylized petals, and delicate ambient embers",
        "colors": "rich high-contrast jewel tones, vermillion, indigo, and liquid gold accents",
        "title_prefix": f"{clean_name.title()} Tough Phone Case",
        "style": style,
        "tags": tags
    }


def generate_theme_variations(theme_name: str, count: int = 5) -> List[Dict[str, Any]]:
    """
    Generates `count` uniquely distinct, diverse variations for a given theme,
    each with specialized focal character details, safe-zone backgrounds, color schemes,
    titles, and prompts, ensuring no two designs in a 5-design batch look identical.
    """
    base = resolve_theme_metadata(theme_name)
    variations = []

    modifiers = [
        {
            "name": "Celestial Sunburst",
            "focal_tweak": "in radiant full form with luminous golden accents",
            "halo_tweak": "golden cathedral sunburst mandala with radiant sacred geometry in upper 35% safe zone",
            "palette": "imperial gold, warm amber, deep obsidian, and radiant saffron",
            "botanical": "floating sakura blossom petals and golden embers"
        },
        {
            "name": "Crimson Blood Moon",
            "focal_tweak": "in dynamic coiling pose with glowing mystical eyes",
            "halo_tweak": "massive luminous blood-red moon with drifting ink storm clouds in upper 35% safe zone",
            "palette": "vermillion crimson, midnight charcoal, ghost cyan, and liquid bronze",
            "botanical": "red spider lilies (higanbana) and dark floating feathers"
        },
        {
            "name": "Great Ocean Wave",
            "focal_tweak": "surging majestically amidst stylized ukiyo-e ocean waters",
            "halo_tweak": "towering Japanese cresting great wave with sea foam spray in upper 35% safe zone",
            "palette": "deep Prussian indigo, ocean turquoise, seafoam white, and gold leaf trim",
            "botanical": "spiraling ocean mist, water spray droplets, and wind ribbons"
        },
        {
            "name": "Ethereal Moonlight",
            "focal_tweak": "shrouded in bioluminescent spiritual aura and delicate mist",
            "halo_tweak": "crescent silver moon phases with starry nebula dust in upper 35% safe zone",
            "palette": "bioluminescent cyan, amethyst purple, platinum silver, and ink black",
            "botanical": "glowing will-o-wisps, night bellflowers, and starlight particles"
        },
        {
            "name": "Gilded Stained Glass",
            "focal_tweak": "rendered in intricate cathedral stained glass with leaded came outlines",
            "halo_tweak": "segmented Gothic rose-window vitrail with jewel-toned glass rays in upper 35% safe zone",
            "palette": "jewel-tone emerald, cobalt blue, ruby red, and dark leaded solder outlines",
            "botanical": "oak leaves, stained glass rosettes, and faceted crystal shards"
        }
    ]

    for i in range(1, count + 1):
        mod = modifiers[(i - 1) % len(modifiers)]
        vol_title = f"{base['title_prefix']} Vol. {i:02d} ({mod['name']})"
        prompt = (
            f"Masterpiece authentic {base.get('style', 'fine art')} vertical 9:16 phone case artwork: {theme_name}. "
            f"In lower composition (lower 65%), {base['character']} {mod['focal_tweak']}. "
            f"In upper safe zone (top 35%), {mod['halo_tweak']}. "
            f"Botanical and accents: {mod['botanical']}. Colors: {mod['palette']}. "
            f"Pure 2D full bleed graphic art, zero mockups, no phone hardware, 8K ultra high resolution."
        )
        variations.append({
            "index": i,
            "title": vol_title,
            "prompt": prompt,
            "modifier": mod["name"],
            "palette": mod["palette"],
            "base_meta": base
        })
    return variations


class CodeKraftApiClient:
    """
    CodeKraft API Client for automated design and metadata generation.
    Supports local web server proxy, direct Gemini API, Hugging Face, and procedural graphic engine.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = "http://localhost:3000"):
        self.api_key = api_key or self._discover_api_key()
        self.base_url = base_url.rstrip("/")
        self.quota_exhausted = False

    def _discover_api_key(self) -> Optional[str]:
        """Locates API key from environment variables or .env file."""
        candidates = ["CODEKRAFT_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"]
        for key in candidates:
            val = os.environ.get(key)
            if val and not val.startswith("your_"):
                return val

        # Try parsing .env file
        env_paths = [
            os.path.join(os.path.dirname(__file__), "..", ".env"),
            os.path.join(os.getcwd(), ".env"),
        ]
        for p in env_paths:
            if os.path.isfile(p):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("#") or "=" not in line:
                                continue
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k in candidates and v and not v.startswith("your_"):
                                return v
                except Exception:
                    pass
        return None

    def generate_design(
        self,
        prompt: str,
        theme_name: str = "Gothic Vitrail Fox",
        index: int = 1,
        aspect_ratio: str = "9:16",
        width: int = 1344,
        height: int = 2389
    ) -> Dict[str, Any]:
        """
        Generates a design asset with complete metadata using the CodeKraft API backup chain:
        1. Local server endpoint (/api/generate-design)
        2. Direct Gemini / CodeKraft API call
        3. High-resolution procedural vector rendering fallback
        """
        # Resolve preset metadata
        matched_theme = None
        for k, v in CURATED_THEMES.items():
            if k.lower() in theme_name.lower() or theme_name.lower() in k.lower():
                matched_theme = v
                break
        if not matched_theme:
            matched_theme = list(CURATED_THEMES.values())[0]

        sku_prefix = "".join(c for c in theme_name if c.isalnum())[:6].upper()
        sku = f"CASE-{sku_prefix}-{index:03d}"
        title = f"{matched_theme['title_prefix']} Vol. {index:02d}"
        description = (
            f"✨ {title} - Premium Tough Phone Case\n\n"
            f"Elevate your smartphone with this exquisite {matched_theme['niche']} artwork. "
            f"Designed with high-durability dual-layer protection featuring an impact-resistant "
            f"polycarbonate outer shell and shock-absorbing TPU liner. "
            f"Full-bleed vertical 9:16 high-definition dye sublimation print with fade-resistant inks.\n\n"
            f"🌟 Specifications:\n"
            f"• Full-bleed edge-to-edge artwork ({width}x{height} px, 9:16 aspect ratio)\n"
            f"• Top 35% safe zone engineered for phone camera lenses\n"
            f"• Dual-layer shock absorption and raised protective screen bezel\n"
            f"• Compatible with all 34 certified iPhone and Samsung Galaxy models\n"
            f"• Qi wireless charging compatible\n\n"
            f"🎁 Perfect gift for art lovers, collectors, and design enthusiasts."
        )
        tags = matched_theme["tags"]
        charges = {
            "retail_price_usd": 24.99,
            "base_cost_usd": 9.50,
            "profit_margin_usd": 15.49,
            "currency": "USD"
        }

        # Step 1: Try local server API
        image_bytes = None
        generation_source = "CodeKraft API"

        try:
            req_data = json.dumps({
                "prompt": f"{prompt}\n\nVariation {index}: Focus character composition variation. Full bleed vertical 9:16 phone case graphic artwork. Zero mockups, no phone bezels.",
                "aspectRatio": aspect_ratio
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{self.base_url}/api/generate-design",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    res_body = json.loads(response.read().decode("utf-8"))
                    img_data = res_body.get("imageUrl") or ""
                    if img_data.startswith("data:image"):
                        b64_part = img_data.split(",", 1)[1]
                        image_bytes = base64.b64decode(b64_part)
                        generation_source = "CodeKraft Server API"
        except Exception as e:
            # Server not running or returned quota limit
            pass

        # Step 2: Try Direct Gemini API if key is present
        if not image_bytes and self.api_key and not self.quota_exhausted:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"imageConfig": {"aspectRatio": aspect_ratio}}
                }
                req = urllib.request.Request(
                    gemini_url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    for part in resp_data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            image_bytes = base64.b64decode(part["inlineData"]["data"])
                            generation_source = "CodeKraft Gemini Cloud API"
                            break
            except urllib.error.HTTPError as http_err:
                if http_err.code in (429, 403):
                    self.quota_exhausted = True
                    print(f"[CODEKRAFT API] Quota limit encountered on direct cloud endpoint (HTTP {http_err.code}). Falling back to procedural engine.")
            except Exception:
                pass

        # Step 3: Reliable Procedural Vector Artwork Generator (Guaranteed zero failure)
        if not image_bytes:
            generation_source = "CodeKraft Vector Engine (Procedural Backup)"
            image_bytes = self._generate_procedural_artwork(width, height, theme_name, seed=index * 12345 + 99)

        return {
            "sku": sku,
            "title": title,
            "description": description,
            "tags": tags,
            "charges": charges,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "generation_method": generation_source,
            "image_bytes": image_bytes,
            "theme": theme_name,
            "category": matched_theme["category"],
            "style": matched_theme["style"],
            "created_at": datetime.now().isoformat()
        }

    def _generate_procedural_artwork(self, width: int, height: int, theme: str, seed: int = 42) -> bytes:
        """Generates print-ready 9:16 high-resolution vertical graphic artwork."""
        if not PIL_AVAILABLE:
            # 1x1 dummy PNG if PIL is absent
            return base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

        img = Image.new("RGB", (width, height), color=(15, 10, 25))
        draw = ImageDraw.Draw(img)
        rng = random.Random(seed)

        # 1. Background atmospheric gradient
        for y in range(height):
            ratio = y / height
            if "Fox" in theme or "Vitrail" in theme:
                r = int(25 + ratio * 85)
                g = int(10 + ratio * 35)
                b = int(5 + ratio * 20)
            elif "Pirate" in theme or "Wave" in theme:
                r = int(5 + ratio * 25)
                g = int(15 + ratio * 65)
                b = int(35 + ratio * 105)
            elif "Wolf" in theme or "Witch" in theme:
                r = int(15 + ratio * 45)
                g = int(8 + ratio * 25)
                b = int(35 + ratio * 85)
            else:
                r = int(25 + ratio * 75)
                g = int(5 + ratio * 20)
                b = int(20 + ratio * 35)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Celestial Halo in upper 35% safe zone
        cx = width // 2
        cy = int(height * 0.32)
        radius = int(width * 0.38)
        for r in range(radius, 0, -8):
            alpha = (radius - r) / radius
            fill_c = (
                int(250 * alpha + 40),
                int(180 * alpha + 20),
                int(60 * alpha + 10)
            )
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill_c)

        # Sunburst rays
        for deg in range(0, 360, 10):
            rad = deg * 3.14159 / 180
            x1 = cx + int(radius * 0.3 * (1 + 0.1 * rng.random()) * 0.8)
            y1 = cy + int(radius * 0.3 * (1 + 0.1 * rng.random()) * 0.8)
            x2 = cx + int(radius * 1.1 * 0.9 * (1 + 0.1 * rng.random()))
            y2 = cy + int(radius * 1.1 * 0.9 * (1 + 0.1 * rng.random()))
            draw.line([x1, y1, x2, y2], fill=(255, 230, 120), width=3)

        # 3. Main Character Focal Element (Lower 65%)
        char_cx = width // 2
        char_cy = int(height * 0.65)
        char_r_w = int(width * 0.32)
        char_r_h = int(height * 0.14)

        # Body
        draw.ellipse(
            [char_cx - char_r_w, char_cy - char_r_h, char_cx + char_r_w, char_cy + char_r_h],
            fill=(220, 95, 25),
            outline=(20, 10, 5),
            width=8
        )
        # Head & Details
        head_cx = char_cx - int(char_r_w * 0.45)
        head_cy = char_cy - int(char_r_h * 0.2)
        draw.ellipse(
            [head_cx - 90, head_cy - 75, head_cx + 90, head_cy + 75],
            fill=(240, 115, 35),
            outline=(20, 10, 5),
            width=7
        )
        # Ears
        draw.polygon(
            [(head_cx - 80, head_cy - 50), (head_cx - 50, head_cy - 170), (head_cx - 10, head_cy - 40)],
            fill=(200, 75, 20),
            outline=(20, 10, 5)
        )
        # Tail
        tail_cx = char_cx + int(char_r_w * 0.6)
        tail_cy = char_cy + int(char_r_h * 0.3)
        draw.ellipse(
            [tail_cx - 80, tail_cy - 60, tail_cx + 80, tail_cy + 60],
            fill=(255, 245, 220),
            outline=(20, 10, 5),
            width=5
        )

        # 4. Stained Glass Cathedral Lead Border
        margin = 45
        draw.rectangle([margin, margin, width - margin, height - margin], outline=(212, 175, 55), width=20)
        draw.rectangle([margin + 20, margin + 20, width - margin - 20, height - margin - 20], outline=(15, 10, 5), width=6)

        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
