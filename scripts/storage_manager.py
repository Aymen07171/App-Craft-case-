#!/usr/bin/env python3
"""
Storage Organization Manager
Module: scripts/storage_manager.py

Handles saving generated design assets, descriptions, manifests, and device specifications
into an organized, dedicated project folder structure.
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple

TARGET_MODELS_34 = [
    {"brand": "Apple iPhone", "model": "iPhone 18 Pro Max", "variant_id": 107200, "px": "2400x4800", "mm": "113.4x192.6"},
    {"brand": "Apple iPhone", "model": "iPhone 18 Pro", "variant_id": 107201, "px": "2200x4400", "mm": "106.5x184.2"},
    {"brand": "Apple iPhone", "model": "iPhone 18 Plus", "variant_id": 107202, "px": "2400x4800", "mm": "112.8x193.0"},
    {"brand": "Apple iPhone", "model": "iPhone 18", "variant_id": 107203, "px": "2200x4400", "mm": "105.8x182.5"},
    {"brand": "Apple iPhone", "model": "iPhone 17 Pro Max", "variant_id": 105100, "px": "2350x4700", "mm": "112.5x191.8"},
    {"brand": "Apple iPhone", "model": "iPhone 17 Pro", "variant_id": 105101, "px": "2150x4300", "mm": "105.4x183.0"},
    {"brand": "Apple iPhone", "model": "iPhone 17 Plus", "variant_id": 105102, "px": "2350x4700", "mm": "112.0x191.0"},
    {"brand": "Apple iPhone", "model": "iPhone 17", "variant_id": 105103, "px": "2150x4300", "mm": "105.0x182.0"},
    {"brand": "Apple iPhone", "model": "iPhone 16 Pro Max", "variant_id": 102145, "px": "2324x4624", "mm": "111.8x190.5"},
    {"brand": "Apple iPhone", "model": "iPhone 16 Pro", "variant_id": 102144, "px": "2136x4248", "mm": "104.9x181.5"},
    {"brand": "Apple iPhone", "model": "iPhone 16 Plus", "variant_id": 102143, "px": "2324x4624", "mm": "111.5x190.0"},
    {"brand": "Apple iPhone", "model": "iPhone 16", "variant_id": 102142, "px": "2136x4248", "mm": "104.5x180.5"},
    {"brand": "Apple iPhone", "model": "iPhone 15 Pro Max", "variant_id": 96256, "px": "2312x4596", "mm": "111.0x189.5"},
    {"brand": "Apple iPhone", "model": "iPhone 15 Pro", "variant_id": 96255, "px": "2124x4220", "mm": "104.0x180.0"},
    {"brand": "Apple iPhone", "model": "iPhone 15 Plus", "variant_id": 96254, "px": "2312x4596", "mm": "111.0x189.5"},
    {"brand": "Apple iPhone", "model": "iPhone 15", "variant_id": 96253, "px": "2124x4220", "mm": "104.0x180.0"},
    {"brand": "Apple iPhone", "model": "iPhone 14 Pro Max", "variant_id": 88412, "px": "2312x4596", "mm": "111.0x189.5"},
    {"brand": "Apple iPhone", "model": "iPhone 14 Pro", "variant_id": 88411, "px": "2124x4220", "mm": "104.0x180.0"},
    {"brand": "Apple iPhone", "model": "iPhone 14 Plus", "variant_id": 88410, "px": "2312x4596", "mm": "111.0x189.5"},
    {"brand": "Apple iPhone", "model": "iPhone 14", "variant_id": 88409, "px": "2124x4220", "mm": "104.0x180.0"},
    {"brand": "Apple iPhone", "model": "iPhone 13 Pro Max", "variant_id": 74820, "px": "2312x4596", "mm": "111.0x189.5"},
    {"brand": "Apple iPhone", "model": "iPhone 13", "variant_id": 74818, "px": "2124x4220", "mm": "104.0x180.0"},
    {"brand": "Apple iPhone", "model": "iPhone 11", "variant_id": 45102, "px": "2100x4200", "mm": "103.0x179.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S26 Ultra", "variant_id": 108100, "px": "2400x4850", "mm": "115.0x194.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S26+", "variant_id": 108101, "px": "2300x4700", "mm": "110.0x190.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S26", "variant_id": 108102, "px": "2150x4400", "mm": "103.5x178.5"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S25 Ultra", "variant_id": 104210, "px": "2380x4800", "mm": "114.5x193.5"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S25+", "variant_id": 104211, "px": "2280x4680", "mm": "109.5x189.5"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S25", "variant_id": 104212, "px": "2140x4380", "mm": "103.0x178.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S24 Ultra", "variant_id": 98450, "px": "2380x4800", "mm": "114.0x193.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S23 Ultra", "variant_id": 94100, "px": "2380x4800", "mm": "114.0x193.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S22 Ultra", "variant_id": 87200, "px": "2380x4800", "mm": "114.0x193.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S21", "variant_id": 105530, "px": "2100x4300", "mm": "102.0x176.0"},
    {"brand": "Samsung Galaxy", "model": "Samsung Galaxy S20", "variant_id": 105531, "px": "2100x4300", "mm": "101.5x175.5"}
]


class StorageManager:
    """Manages folder hierarchies and asset persistence on disk."""

    def __init__(self, base_output_dir: str = "projects"):
        self.base_output_dir = os.path.abspath(base_output_dir)

    def prepare_project_directory(self, project_name: str) -> Dict[str, str]:
        """Creates timestamped project directory structure."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = "".join(c if c.isalnum() else "_" for c in project_name).strip("_")
        project_folder_name = f"{safe_name}_{timestamp}"
        project_dir = os.path.join(self.base_output_dir, project_folder_name)

        designs_dir = os.path.join(project_dir, "designs")
        metadata_dir = os.path.join(project_dir, "metadata")
        specs_dir = os.path.join(project_dir, "specs")

        os.makedirs(designs_dir, exist_ok=True)
        os.makedirs(metadata_dir, exist_ok=True)
        os.makedirs(specs_dir, exist_ok=True)

        return {
            "project_name": project_folder_name,
            "project_dir": project_dir,
            "designs_dir": designs_dir,
            "metadata_dir": metadata_dir,
            "specs_dir": specs_dir,
            "excel_path": os.path.join(project_dir, f"{project_folder_name}_Master_Catalog.xlsx")
        }

    def save_assets(
        self,
        dir_info: Dict[str, str],
        designs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Saves image bytes and JSON metadata files to the project directory.
        Updates design dicts with file paths and sizes.
        """
        designs_dir = dir_info["designs_dir"]
        metadata_dir = dir_info["metadata_dir"]
        specs_dir = dir_info["specs_dir"]

        # 1. Save 34 Device Models Specifications
        with open(os.path.join(specs_dir, "target_device_models_34.json"), "w", encoding="utf-8") as f:
            json.dump(TARGET_MODELS_34, f, indent=2)

        processed_designs = []
        for d in designs:
            sku = d.get("sku", "CASE-001")
            file_name = f"{sku}_9x16_Artwork.png"
            image_path = os.path.join(designs_dir, file_name)

            # Write Image PNG
            image_bytes = d.get("image_bytes")
            if image_bytes:
                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)
                file_size_kb = round(len(image_bytes) / 1024, 2)
            else:
                file_size_kb = 0

            # Write individual JSON metadata
            meta_copy = {k: v for k, v in d.items() if k != "image_bytes"}
            meta_copy["file_name"] = file_name
            meta_copy["local_path"] = image_path
            meta_copy["relative_path"] = f"designs/{file_name}"
            meta_copy["file_size_kb"] = file_size_kb

            meta_path = os.path.join(metadata_dir, f"{sku}_metadata.json")
            with open(meta_path, "w", encoding="utf-8") as meta_file:
                json.dump(meta_copy, meta_file, indent=2)

            processed_designs.append(meta_copy)

        # Write Batch Manifest
        with open(os.path.join(metadata_dir, "batch_manifest.json"), "w", encoding="utf-8") as mf:
            json.dump({
                "project_name": dir_info["project_name"],
                "total_designs": len(processed_designs),
                "created_at": datetime.now().isoformat(),
                "designs": processed_designs
            }, mf, indent=2)

        return processed_designs
