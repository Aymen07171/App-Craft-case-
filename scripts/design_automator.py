#!/usr/bin/env python3
"""
Master Design Automation & Pipeline Orchestrator
Module: scripts/design_automator.py

Orchestrates automated design generation, asset downloading, directory organization,
Excel spreadsheet synchronization, and quota management with seamless failover between
Chrome Selenium web automation and CodeKraft API integrations.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional

# Ensure scripts dir is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Ensure terminal stdout handles UTF-8 safely on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from selenium_engine import SeleniumDesignEngine, QuotaLimitException, SELENIUM_AVAILABLE
from codekraft_api import CodeKraftApiClient, CURATED_THEMES, resolve_theme_metadata
from excel_manager import ExcelSpreadsheetManager
from storage_manager import StorageManager


class DesignAutomationOrchestrator:
    """Master workflow orchestrator managing Selenium, CodeKraft API, Storage, and Excel."""

    def __init__(
        self,
        web_url: str = "http://localhost:3000",
        headless: bool = True,
        output_dir: str = "projects",
        api_key: Optional[str] = None
    ):
        self.web_url = web_url
        self.headless = headless
        self.output_dir = output_dir
        self.api_key = api_key

        self.storage_manager = StorageManager(base_output_dir=output_dir)
        self.excel_manager = ExcelSpreadsheetManager()
        self.api_client = CodeKraftApiClient(api_key=api_key, base_url=web_url)

    def run(
        self,
        theme: str = "Gothic Vitrail Fox",
        count: int = 3,
        prompt: Optional[str] = None,
        mode: str = "auto",
        project_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the automated design generation and publishing pipeline.

        Modes:
        - 'auto': Attempts Selenium web automation first. If a quota limit, rate restriction,
                  or browser issue occurs, seamlessly fails over to CodeKraft API backup.
        - 'selenium': Strictly enforces Chrome Selenium web automation.
        - 'api': Bypasses browser and generates directly via CodeKraft API.
        """
        start_time = time.time()
        print("=" * 75)
        print("[*] CASECRAFT / CODEKRAFT AUTOMATED DESIGN GENERATION PIPELINE")
        print("=" * 75)
        print(f"  * Target Theme:       {theme}")
        print(f"  * Design Count:       {count}")
        print(f"  * Execution Mode:     {mode.upper()}")
        print(f"  * Web Application:    {self.web_url}")
        print(f"  * Headless Browser:   {self.headless}")
        print("-" * 75)

        # Resolve prompt if not provided
        if not prompt:
            theme_meta = resolve_theme_metadata(theme, prompt)
            prompt = (
                f"Masterpiece authentic {theme_meta.get('style', 'fine art')} vertical 9:16 phone case artwork. "
                f"In lower composition, {theme_meta['character']}. "
                f"In top 35% safe zone, {theme_meta['halo']}. "
                f"Accents: {theme_meta['botanical']}. Colors: {theme_meta['colors']}. "
                f"Pure 2D full bleed graphic art, zero mockups, no phone hardware, 8K ultra high resolution."
            )

        resolved_proj_name = project_name or f"{theme.replace(' ', '_')}_Collection"
        dir_info = self.storage_manager.prepare_project_directory(resolved_proj_name)
        print(f"[STORAGE] Initialized dedicated project folder:")
        print(f"          -> {dir_info['project_dir']}")

        raw_designs: List[Dict[str, Any]] = []
        failover_occurred = False
        failover_reason = ""

        # -------------------------------------------------------------
        # STEP 1: GENERATION (Selenium vs API vs Gemini Web)
        # -------------------------------------------------------------
        if mode == "gemini-web":
            from gemini_web_selenium import run_gemini_web_workflow
            # For Gemini Web, default to visible browser (headless=False) so user can authenticate
            use_headless = False if not hasattr(self, '_explicit_headless') else self.headless
            return run_gemini_web_workflow(
                theme=theme,
                count=count,
                prompt=prompt,
                email=getattr(self, 'email', None),
                password=getattr(self, 'password', None),
                headless=use_headless,
                output_dir=self.output_dir
            )

        if mode == "api":
            print("\n[STEP 1/4] Generating designs directly via CodeKraft API...")
            raw_designs = self._generate_via_api(theme, count, prompt)

        elif mode in ("selenium", "auto"):
            print(f"\n[STEP 1/4] Launching Chrome Selenium web automation...")
            selenium_engine = None
            try:
                if not SELENIUM_AVAILABLE:
                    raise RuntimeError("Selenium library is not installed.")

                selenium_engine = SeleniumDesignEngine(
                    web_url=self.web_url,
                    headless=self.headless,
                    timeout=35
                )
                raw_designs = selenium_engine.generate_designs(
                    theme=theme,
                    count=count,
                    prompt=prompt,
                    project_name=dir_info["project_name"]
                )
                print(f"[SELENIUM] Successfully generated and captured {len(raw_designs)} designs via web application.")

            except QuotaLimitException as q_err:
                if mode == "selenium":
                    print(f"[ERROR] Quota limit encountered in strict Selenium mode: {q_err}")
                    raise
                else:
                    failover_occurred = True
                    failover_reason = str(q_err)
                    print(f"\n[QUOTA ALERT] Quota limit or restriction encountered in web interface:")
                    print(f"              {q_err}")
                    print(f"[FAILOVER] Seamlessly switching to CodeKraft API backup to fulfill generation request...")
                    raw_designs = self._generate_via_api(theme, count, prompt)

            except Exception as gen_err:
                if mode == "selenium":
                    print(f"[ERROR] Selenium execution failed: {gen_err}")
                    raise
                else:
                    failover_occurred = True
                    failover_reason = str(gen_err)
                    print(f"\n[NOTICE] Selenium automation encountered an issue: {gen_err}")
                    print(f"[FAILOVER] Seamlessly switching to CodeKraft API backup to guarantee fulfillment...")
                    raw_designs = self._generate_via_api(theme, count, prompt)

            finally:
                if selenium_engine:
                    selenium_engine.close()

        # If any designs are missing image bytes (e.g. from DOM extraction fallback), synthesize via API
        for idx, d in enumerate(raw_designs, start=1):
            if not d.get("image_bytes"):
                print(f"[RECOVERY] Synthesizing missing artwork bytes for design {idx} via CodeKraft API...")
                api_asset = self.api_client.generate_design(prompt, theme, index=idx)
                d["image_bytes"] = api_asset["image_bytes"]
                if "Selenium" in d.get("generation_method", ""):
                    d["generation_method"] = "Selenium + CodeKraft Backup"

        # -------------------------------------------------------------
        # STEP 2: DOWNLOAD & ASSET STORAGE
        # -------------------------------------------------------------
        print("\n[STEP 2/4] Saving and organizing assets to structured directory...")
        processed_designs = self.storage_manager.save_assets(dir_info, raw_designs)
        print(f"[STORAGE] Stored {len(processed_designs)} designs in: {dir_info['designs_dir']}")
        print(f"[STORAGE] Stored {len(processed_designs)} metadata records in: {dir_info['metadata_dir']}")

        # -------------------------------------------------------------
        # STEP 3: EXCEL SPREADSHEET INTEGRATION
        # -------------------------------------------------------------
        print("\n[STEP 3/4] Generating structured multi-sheet Excel workbook...")
        excel_path = self.excel_manager.export_catalog(
            filepath=dir_info["excel_path"],
            designs=processed_designs,
            project_name=dir_info["project_name"]
        )
        print(f"[EXCEL] Successfully compiled Master Catalog workbook:")
        print(f"        -> {excel_path}")

        # -------------------------------------------------------------
        # STEP 4: WORKFLOW REPORTING & METRICS
        # -------------------------------------------------------------
        elapsed = round(time.time() - start_time, 2)
        total_variants = len(processed_designs) * 26

        report = {
            "success": True,
            "projectName": dir_info["project_name"],
            "projectDir": dir_info["project_dir"],
            "excelPath": excel_path,
            "theme": theme,
            "designsCount": len(processed_designs),
            "variantsCount": total_variants,
            "modelsCount": 34,
            "mode": mode,
            "failoverOccurred": failover_occurred,
            "failoverReason": failover_reason if failover_occurred else None,
            "elapsedSeconds": elapsed,
            "designs": [
                {
                    "sku": d["sku"],
                    "title": d["title"],
                    "generationMethod": d["generation_method"],
                    "charges": d["charges"],
                    "localPath": d["local_path"],
                    "dimensions": d["dimensions"],
                    "fileSizeKb": d["file_size_kb"],
                    "status": "READY"
                }
                for d in processed_designs
            ]
        }

        # Write project_report.json
        with open(os.path.join(dir_info["project_dir"], "project_report.json"), "w", encoding="utf-8") as rf:
            json.dump(report, rf, indent=2)

        print("\n" + "=" * 75)
        print(f"[OK] PIPELINE EXECUTION COMPLETED IN {elapsed}s")
        print("=" * 75)
        print(f"  * Generated Designs:   {len(processed_designs)}")
        print(f"  * Commercial Variants: {total_variants} retail SKUs (Glossy & Matte)")
        print(f"  * Supported Models:    34 devices (iPhone 18 down to 11, Samsung S26 down to S20)")
        print(f"  * Quota Backup Used:   {'YES (CodeKraft API Backup)' if failover_occurred else 'NO (Selenium Direct)'}")
        print(f"  * Excel Workbook:      {excel_path}")
        print(f"  * Dedicated Folder:    {dir_info['project_dir']}")
        print("=" * 75)

        return report

    def _generate_via_api(self, theme: str, count: int, prompt: str) -> List[Dict[str, Any]]:
        """Generates all requested designs using CodeKraft API client."""
        designs = []
        for i in range(1, count + 1):
            print(f"[CODEKRAFT API] Generating design {i}/{count} for '{theme}'...")
            asset = self.api_client.generate_design(
                prompt=prompt,
                theme_name=theme,
                index=i,
                aspect_ratio="9:16",
                width=1344,
                height=2389
            )
            designs.append(asset)
        return designs


def main():
    parser = argparse.ArgumentParser(
        description="CaseCraft & CodeKraft Automated Design Generation, Storage & Excel Pipeline"
    )
    parser.add_argument(
        "--theme",
        type=str,
        default="Gothic Vitrail Fox",
        help="Artwork theme/category (e.g. 'Gothic Vitrail Fox', 'Anime Sea Pirate', 'Celestial Spirit Wolf', 'Kitsune Samurai', 'Neon Cyber Ronin')"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=3,
        help="Number of designs to generate (e.g. 1, 3, 5, 10)"
    )
    parser.add_argument(
        "--prompt",
        type=str,
        default=None,
        help="Custom prompt string overriding default theme prompt"
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=["auto", "selenium", "api", "gemini-web"],
        default="auto",
        help="Execution mode: 'auto' (Selenium with API quota backup), 'selenium' (strict local web), 'api' (direct API), 'gemini-web' (automate gemini.google.com)"
    )
    parser.add_argument(
        "--email",
        type=str,
        default=None,
        help="Google account email for gemini-web mode"
    )
    parser.add_argument(
        "--password",
        type=str,
        default=None,
        help="Google account password for gemini-web mode"
    )
    parser.add_argument(
        "--web-url",
        type=str,
        default="http://localhost:3000",
        help="Target web application URL for Selenium"
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Launch visible Chrome browser window instead of headless"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="projects",
        help="Root output directory for saved project folders"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="CodeKraft / Gemini API key override"
    )
    parser.add_argument(
        "--project-name",
        type=str,
        default=None,
        help="Custom project / application name"
    )

    args = parser.parse_args()

    orchestrator = DesignAutomationOrchestrator(
        web_url=args.web_url,
        headless=not args.no_headless,
        output_dir=args.output_dir,
        api_key=args.api_key
    )
    orchestrator.email = args.email
    orchestrator.password = args.password

    orchestrator.run(
        theme=args.theme,
        count=args.count,
        prompt=args.prompt,
        mode=args.mode,
        project_name=args.project_name
    )


if __name__ == "__main__":
    main()
