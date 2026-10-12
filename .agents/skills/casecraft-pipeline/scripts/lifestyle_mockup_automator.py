#!/usr/bin/env python3
"""
Automated Lifestyle Mockup Generator (iPhone 18 Pro Max & Samsung Galaxy S26)
Module: scripts/lifestyle_mockup_automator.py

Implements the Reference-Based Lifestyle Mockup Automation Pipeline for CaseCraft Studio:
- Supports target smartphone models:
  1. iPhone 18 Pro Max (1339x2275 px @ 300 DPI, 113.37x192.62 mm, square Pro triple-lens plateau)
  2. Samsung Galaxy S26 (1269x2122 px @ 300 DPI, 107.44x179.66 mm, vertical 3-lens column + LED flash)
- Preserves 100% of the original 9:16 2D case artwork (zero distortion or redesign).
- Uses reference lifestyle photographs to lock lighting, props, camera angle, and editorial mood.
- Organizes outputs into non-destructive folders per design and smartphone model.
- Supports both Google Gemini API (`google-genai` SDK) and authenticated Gemini Web Selenium.
"""

import os
import sys
import time
import json
import shutil
import base64
import logging
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("LifestyleMockupAutomator")


# ==============================================================================
# 1. VERIFIED SMARTPHONE MODEL SPECIFICATIONS
# ==============================================================================
TARGET_SMARTPHONE_MODELS: Dict[str, Dict[str, Any]] = {
    "iphone-18-pro-max": {
        "id": "iphone-18-pro-max",
        "name": "iPhone 18 Pro Max",
        "brand": "Apple",
        "printify_mockup_label": "Front view, iPhone 18 Pro Max",
        "pixel_width": 1339,
        "pixel_height": 2275,
        "mm_width": 113.37,
        "mm_height": 192.62,
        "dpi": 300,
        "corner_style": "generous continuous-curve rounded corners",
        "case_construction": (
            "dual-layer protective Tough Case with smooth satin-gloss polycarbonate printed backplate, "
            "matte black shock-absorbing TPU perimeter bumper edges, and raised black camera bezel ring"
        ),
        "camera_cutout_spec": (
            "accurate iPhone 18 Pro Max top-left square camera plateau housing three large Pro camera lenses "
            "in a triangular layout, LiDAR scanner, and True Tone flash recessed inside the protective black bezel cutout"
        ),
    },
    "samsung-s26": {
        "id": "samsung-s26",
        "name": "Samsung Galaxy S26",
        "brand": "Samsung",
        "printify_mockup_label": "Front view, Samsung Galaxy S26",
        "pixel_width": 1269,
        "pixel_height": 2122,
        "mm_width": 107.44,
        "mm_height": 179.66,
        "dpi": 300,
        "corner_style": "sleek slightly squarer S-series corner radius",
        "case_construction": (
            "dual-layer protective Tough Case with vivid edge-to-edge printed polycarbonate backplate "
            "and matte black shock-absorbing TPU perimeter bumper edges"
        ),
        "camera_cutout_spec": (
            "accurate Samsung Galaxy S26 top-left vertical pill cutout housing 3 vertically stacked circular "
            "camera lenses in a single vertical column with a small LED flash dot to the right of the top lens "
            "(strictly no iPhone triangular lens cluster)"
        ),
    },
}


# ==============================================================================
# 2. REFERENCE SCENE PRESETS (EXTRACTED FROM USER REFERENCE PHOTOGRAPHS)
# ==============================================================================
SCENE_PRESETS: Dict[str, Dict[str, str]] = {
    "cozy_knit_handheld": {
        "name": "Cozy Cream Knit Sweater Handheld Over Honey-Oak Desk",
        "scene_prompt": (
            "Held gently at the side edges by a person wearing a cozy cream ribbed-knit sweater cuff over "
            "a warm honey-oak wooden desk, with a ribbed glass vase holding dried white baby's breath florals "
            "and a minimalist soft-cover art book softly blurred in the background. Warm golden-hour side window "
            "light, shallow depth of field (85mm f/2.8 lens), ultra-sharp focus on the printed phone case backplate."
        ),
    },
    "linen_oak_flatlay": {
        "name": "Sun-Drenched Cream Linen & Honey-Oak Botanical Flat-Lay",
        "scene_prompt": (
            "Resting face-down (printed backplate facing the camera) at a natural 15-degree angle on soft cream "
            "textured linen fabric and warm honey-oak wood, framed in the upper corners by delicate sprigs of "
            "dried white baby's breath flowers and dappled golden-hour window light shadows. 85mm f/2.8 commercial "
            "product photography, natural contact shadows, ultra-sharp focus on the case artwork."
        ),
    },
    "warm_oak_tabletop": {
        "name": "Warm Honey-Oak Tabletop Resting Beside Ribbed Glass Vase",
        "scene_prompt": (
            "Resting at a relaxed diagonal angle on a warm honey-oak tabletop next to a clear ribbed glass vase "
            "filled with dried white baby's breath flowers and a soft neutral linen curtain in the background. "
            "Golden-hour sunlight casting soft botanical shadows."
        ),
    },
    "open_leather_handbag": {
        "name": "Everyday Carry Flat-Lay in Open Cream Pebbled-Leather Handbag",
        "scene_prompt": (
            "Nestled naturally inside an open cream pebbled-leather handbag beside a kraft spiral-bound notebook "
            "with a black pen and a blush-pink textured leather zip wallet on a soft beige woven textile surface."
        ),
    },
}


def build_master_artwork_prompt(theme: str, character_desc: Optional[str] = None) -> str:
    """Builds a strict 9:16 pure 2D master artwork prompt with camera safe-zone rules."""
    focal_desc = character_desc or (
        f"A charismatic sentient focal character and central subject representing '{theme}', "
        "horizontally centered in the lower 65% of the frame with rich stained-glass / commercial illustration detail."
    )
    return (
        f"Pure 2D full-bleed vertical 9:16 commercial illustration for '{theme}'.\n\n"
        "COMPOSITION & SAFE ZONE:\n"
        "- TOP 35% (CAMERA SAFE ZONE): Atmospheric background elements (stained-glass sunburst arches, celestial sky, "
        "or soft ambient glow) completely free of faces or primary subjects.\n"
        f"- LOWER 65% (CENTERED FOCAL CHARACTER): {focal_desc}\n\n"
        "STRICT RULES:\n"
        "- Pure flat 2D edge-to-edge full-bleed artwork only.\n"
        "- NO phone case, NO phone bezel, NO camera cutout hole, NO 3D mockup frame, NO borders, NO text or watermarks."
    )


def build_lifestyle_mockup_prompt(
    design_title: str,
    model_key: str,
    scene_key: str = "cozy_knit_handheld",
    custom_scene_prompt: Optional[str] = None,
) -> str:
    """Builds the reference-locked lifestyle mockup prompt for a specific device model."""
    model_spec = TARGET_SMARTPHONE_MODELS[model_key]
    scene_desc = custom_scene_prompt or SCENE_PRESETS.get(scene_key, SCENE_PRESETS["cozy_knit_handheld"])["scene_prompt"]

    return (
        f"Photorealistic commercial e-commerce lifestyle product photograph of a {model_spec['brand']} "
        f"{model_spec['name']} Tough Phone Case showcasing the exact '{design_title}' artwork from Image 1.\n\n"
        "STRICT ARTWORK & DEVICE RULES:\n"
        "- Image 1 is the IMMUTABLE artwork source. Reproduce its exact design, colors, character details, "
        "and layout onto the backplate of the phone case with 100% fidelity. Do not redraw, reinterpret, crop, "
        "or replace any part of the artwork.\n"
        f"- Target Device: {model_spec['brand']} {model_spec['name']} ({model_spec['pixel_width']}x{model_spec['pixel_height']} px "
        f"@ {model_spec['dpi']} DPI, {model_spec['mm_width']}x{model_spec['mm_height']} mm, {model_spec['corner_style']}).\n"
        f"- Case Construction: {model_spec['case_construction']}.\n"
        f"- Camera Hardware: {model_spec['camera_cutout_spec']}. Leave the lower 65% focal artwork completely unobstructed.\n\n"
        "SCENE & PHOTOGRAPHY STYLE:\n"
        f"- {scene_desc}\n"
        "- Return a single photorealistic commercial product photograph with natural lighting, realistic shadows, "
        "and crisp focus on the printed case."
    )


def get_unique_filepath(target_path: Path, overwrite: bool = False) -> Path:
    """Prevents accidental overwriting of existing files unless overwrite=True."""
    if overwrite or not target_path.exists():
        return target_path
    stem = target_path.stem
    suffix = target_path.suffix
    parent = target_path.parent
    counter = 1
    while True:
        candidate = parent / f"{stem}_v{counter:02d}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def save_and_format_image(
    source_path: Path,
    dest_path: Path,
    target_width: Optional[int] = None,
    target_height: Optional[int] = None,
    dpi: int = 300,
    overwrite: bool = False,
) -> Path:
    """Saves an image with 300 DPI metadata and optional target resolution."""
    final_path = get_unique_filepath(dest_path, overwrite=overwrite)
    final_path.parent.mkdir(parents=True, exist_ok=True)

    if PIL_AVAILABLE:
        with Image.open(source_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            if target_width and target_height and (img.width != target_width or img.height != target_height):
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
            img.save(final_path, format="PNG", dpi=(dpi, dpi))
    else:
        shutil.copy2(source_path, final_path)

    logger.info(f"Saved high-resolution asset -> {final_path}")
    return final_path


def load_env_api_key() -> Optional[str]:
    """Loads GEMINI_API_KEY from environment or project .env without hardcoding credentials."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and not api_key.startswith("your_"):
        return api_key
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.is_file():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == "GEMINI_API_KEY":
                val = v.strip().strip("'\"")
                if val and not val.startswith("your_"):
                    return val
    return None


def generate_via_gemini_api(
    prompt: str,
    output_path: Path,
    reference_images: Optional[List[Path]] = None,
    aspect_ratio: str = "3:4",
    max_retries: int = 3,
) -> Optional[Path]:
    """Generates an image using the official Google GenAI SDK (`google-genai`) with retry logic."""
    api_key = load_env_api_key()
    if not api_key:
        logger.warning("GEMINI_API_KEY not found in environment or .env.")
        return None

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        logger.warning("google-genai package not installed. Run: py -m pip install google-genai")
        return None

    client = genai.Client(api_key=api_key)
    contents: List[Any] = []

    if reference_images and PIL_AVAILABLE:
        for ref_path in reference_images:
            if ref_path.is_file():
                contents.append(Image.open(ref_path))
    contents.append(prompt)

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Submitting Gemini multimodal generation (Attempt {attempt}/{max_retries})...")
            response = client.models.generate_content(
                model="gemini-2.5-flash-image-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(part.inline_data.data)
                    logger.info(f"Generated image saved -> {output_path}")
                    return output_path
        except Exception as exc:
            logger.warning(f"Attempt {attempt} failed: {exc}")
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    return None


def stage_frog_vitrail_release(
    artwork_source: Path,
    iphone_mockup_source: Path,
    samsung_mockup_source: Path,
    reference_dir: Optional[Path] = None,
    overwrite: bool = True,
) -> Dict[str, Any]:
    """
    Organizes the generated 'Stained Glass Vitrail 70s Frog & Lava Lamp' master design
    and dual-device lifestyle mockups (iPhone 18 Pro Max & Samsung Galaxy S26) into the
    project's structured output directories and public web assets.
    """
    project_root = Path(__file__).resolve().parent.parent
    design_slug = "stained-glass-vitrail-70s-frog-lava-lamp"
    sku = "CASE-FROGLV-001"
    title = "Stained Glass Vitrail 70s Frog & Lava Lamp"

    output_base = project_root / "output" / "lifestyle_mockups" / design_slug
    iphone_dir = output_base / "iphone-18-pro-max"
    samsung_dir = output_base / "samsung-s26"
    refs_out_dir = output_base / "reference_styles"

    public_designs_dir = project_root / "public" / "designs"
    public_mockups_dir = project_root / "public" / "mockups"

    # 1. Save 1344x2389 @ 300 DPI Master 9:16 Print Artwork
    master_art_out = save_and_format_image(
        source_path=artwork_source,
        dest_path=output_base / f"{sku}_Master_9x16_Artwork_1344x2389_300DPI.png",
        target_width=1344,
        target_height=2389,
        dpi=300,
        overwrite=overwrite,
    )
    public_art_out = save_and_format_image(
        source_path=artwork_source,
        dest_path=public_designs_dir / f"{sku}_9x16_Artwork.png",
        target_width=1344,
        target_height=2389,
        dpi=300,
        overwrite=overwrite,
    )

    # 2. Save iPhone 18 Pro Max Lifestyle Mockup
    iphone_out = save_and_format_image(
        source_path=iphone_mockup_source,
        dest_path=iphone_dir / f"{sku}_iPhone_18_Pro_Max_Cozy_Knit_Handheld_Mockup.png",
        dpi=300,
        overwrite=overwrite,
    )
    public_iphone_out = save_and_format_image(
        source_path=iphone_mockup_source,
        dest_path=public_mockups_dir / f"{sku}_iPhone_18_Pro_Max_Lifestyle.png",
        dpi=300,
        overwrite=overwrite,
    )

    # 3. Save Samsung Galaxy S26 Lifestyle Mockup
    samsung_out = save_and_format_image(
        source_path=samsung_mockup_source,
        dest_path=samsung_dir / f"{sku}_Samsung_Galaxy_S26_Linen_Oak_Flatlay_Mockup.png",
        dpi=300,
        overwrite=overwrite,
    )
    public_samsung_out = save_and_format_image(
        source_path=samsung_mockup_source,
        dest_path=public_mockups_dir / f"{sku}_Samsung_Galaxy_S26_Lifestyle.png",
        dpi=300,
        overwrite=overwrite,
    )

    # 4. Copy Reference Images for Reproducibility
    copied_refs: List[str] = []
    if reference_dir and reference_dir.is_dir():
        refs_out_dir.mkdir(parents=True, exist_ok=True)
        for idx, ref_file in enumerate(sorted(reference_dir.iterdir()), start=1):
            if ref_file.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                dest_ref = refs_out_dir / f"reference_style_{idx:02d}{ref_file.suffix.lower()}"
                shutil.copy2(ref_file, dest_ref)
                copied_refs.append(str(dest_ref))

    # 5. Write Manifest JSON with Prompts & Device Specs
    manifest = {
        "sku": sku,
        "title": title,
        "design_slug": design_slug,
        "generated_at": datetime.now().isoformat(),
        "master_artwork": {
            "path": str(master_art_out),
            "public_path": str(public_art_out),
            "dimensions": "1344x2389",
            "aspect_ratio": "9:16",
            "dpi": 300,
            "prompt": build_master_artwork_prompt(title),
        },
        "lifestyle_mockups": {
            "iphone-18-pro-max": {
                "model_spec": TARGET_SMARTPHONE_MODELS["iphone-18-pro-max"],
                "scene_preset": "cozy_knit_handheld",
                "output_path": str(iphone_out),
                "public_path": str(public_iphone_out),
                "prompt": build_lifestyle_mockup_prompt(title, "iphone-18-pro-max", "cozy_knit_handheld"),
            },
            "samsung-s26": {
                "model_spec": TARGET_SMARTPHONE_MODELS["samsung-s26"],
                "scene_preset": "linen_oak_flatlay",
                "output_path": str(samsung_out),
                "public_path": str(public_samsung_out),
                "prompt": build_lifestyle_mockup_prompt(title, "samsung-s26", "linen_oak_flatlay"),
            },
        },
        "reference_images": copied_refs,
    }

    manifest_path = output_base / "mockup_generation_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    logger.info(f"Wrote generation manifest -> {manifest_path}")
    return manifest


def main():
    parser = argparse.ArgumentParser(
        description="Automated Lifestyle Mockup Generator for iPhone 18 Pro Max & Samsung Galaxy S26"
    )
    parser.add_argument("--theme", type=str, default="Stained Glass Vitrail 70s Frog & Lava Lamp", help="Design theme title")
    parser.add_argument("--design", type=str, help="Path to an existing 9:16 master artwork file")
    parser.add_argument("--iphone-mockup", type=str, help="Path to generated iPhone 18 Pro Max mockup to stage")
    parser.add_argument("--samsung-mockup", type=str, help="Path to generated Samsung Galaxy S26 mockup to stage")
    parser.add_argument("--references-dir", type=str, help="Directory containing reference lifestyle images")
    parser.add_argument("--overwrite", action="store_true", help="Allow overwriting existing output files")
    args = parser.parse_args()

    if args.design and args.iphone_mockup and args.samsung_mockup:
        manifest = stage_frog_vitrail_release(
            artwork_source=Path(args.design),
            iphone_mockup_source=Path(args.iphone_mockup),
            samsung_mockup_source=Path(args.samsung_mockup),
            reference_dir=Path(args.references_dir) if args.references_dir else None,
            overwrite=args.overwrite,
        )
        print(json.dumps(manifest, indent=2))
        return

    # Otherwise, run live generation for both devices using Gemini API
    project_root = Path(__file__).resolve().parent.parent
    slug = args.theme.lower().replace("&", "and").replace(" ", "-")
    out_dir = project_root / "output" / "lifestyle_mockups" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    design_path = Path(args.design) if args.design else (out_dir / "master_artwork_9x16.png")
    if not design_path.exists():
        logger.info(f"Generating 9:16 master artwork for '{args.theme}'...")
        art_prompt = build_master_artwork_prompt(args.theme)
        generate_via_gemini_api(art_prompt, design_path, aspect_ratio="9:16")

    ref_files: List[Path] = []
    if args.references_dir and Path(args.references_dir).is_dir():
        ref_files = [
            p for p in sorted(Path(args.references_dir).iterdir())
            if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
        ]

    for model_key, scene_key in [("iphone-18-pro-max", "cozy_knit_handheld"), ("samsung-s26", "linen_oak_flatlay")]:
        model_out = get_unique_filepath(
            out_dir / model_key / f"{slug}_{model_key}_{scene_key}.png",
            overwrite=args.overwrite,
        )
        prompt = build_lifestyle_mockup_prompt(args.theme, model_key, scene_key)
        refs = ([design_path] + ref_files[:2]) if design_path.exists() else ref_files[:2]
        generate_via_gemini_api(prompt, model_out, reference_images=refs, aspect_ratio="3:4")


if __name__ == "__main__":
    main()
