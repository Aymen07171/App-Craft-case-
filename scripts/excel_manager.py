#!/usr/bin/env python3
"""
Excel Integration & Metadata Spreadsheet Manager
Module: scripts/excel_manager.py

Builds structured, multi-sheet Microsoft Excel (.xlsx) workbooks containing
design records, descriptions, charges, metadata, specs, and variants.
Uses openpyxl with professional styling (fills, borders, fonts, auto column widths).
"""

import os
import sys
import zipfile
from datetime import datetime
from typing import List, Dict, Any, Optional

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False


# 34 Standard Phone Case Models for Reference Sheet
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

FLAGSHIP_13_MODELS = [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 13 Pro Max",
    "iPhone 13", "iPhone 11", "Samsung Galaxy S26 Ultra", "Samsung Galaxy S25 Ultra"
]


class ExcelSpreadsheetManager:
    """Creates styled multi-sheet Excel workbooks for generated design assets."""

    def __init__(self):
        pass

    def export_catalog(
        self,
        filepath: str,
        designs: List[Dict[str, Any]],
        project_name: str = "Design_Batch"
    ) -> str:
        """
        Builds the complete multi-sheet Excel file at the given filepath.
        Returns the absolute filepath created.
        """
        if OPENPYXL_AVAILABLE:
            return self._export_openpyxl(filepath, designs, project_name)
        else:
            return self._export_fallback_zip(filepath, designs, project_name)

    def _export_openpyxl(self, filepath: str, designs: List[Dict[str, Any]], project_name: str) -> str:
        wb = openpyxl.Workbook()

        # Styles
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        sub_header_fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
        ready_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
        ready_font = Font(name="Calibri", size=11, bold=True, color="166534")

        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1")
        )

        # -------------------------------------------------------------
        # SHEET 1: Master_Products (Auto-compatible with Excel to Printify Importer)
        # -------------------------------------------------------------
        ws_catalog = wb.active
        ws_catalog.title = "Master_Products"

        catalog_headers = [
            "Product ID", "Product Template", "Blueprint ID", "Print Provider", "Provider ID",
            "Variants / Phone Models", "Title", "Description", "Tags", "Design Image",
            "Design Image Path", "Google Drive Folder", "Google Drive Image URL", "Price",
            "SKU", "Aspect Ratio", "Dimensions", "Status", "Created At"
        ]
        ws_catalog.append(catalog_headers)

        for col_idx in range(1, len(catalog_headers) + 1):
            cell = ws_catalog.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        for r_idx, d in enumerate(designs, start=2):
            charges = d.get("charges", {})
            tags_str = ", ".join(d.get("tags", [])) if isinstance(d.get("tags"), list) else str(d.get("tags", ""))
            sku = d.get("sku", f"CASE-{r_idx-1:03d}")
            drive_folder = d.get("drive_folder", "https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO")
            drive_img_url = d.get("drive_image_url", d.get("webViewLink", ""))

            row_data = [
                sku,
                "Tough Phone Cases",
                269,
                "Printify Choice",
                99,
                "All 34 Tough Case Models (All iPhones & Samsung)",
                d.get("title", ""),
                d.get("description", ""),
                tags_str,
                d.get("file_name", f"{sku}_9x16_Artwork.png"),
                d.get("relative_path", f"designs/{sku}_9x16_Artwork.png"),
                drive_folder,
                drive_img_url,
                charges.get("retail_price_usd", d.get("price", 24.99)),
                sku,
                d.get("aspect_ratio", "9:16"),
                d.get("dimensions", "1344x2389"),
                "READY",
                d.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            ]
            ws_catalog.append(row_data)

            # Apply borders and status formatting
            for col_idx in range(1, len(row_data) + 1):
                cell = ws_catalog.cell(row=r_idx, column=col_idx)
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")
                # Highlight status
                if col_idx == 18:
                    cell.fill = ready_fill
                    cell.font = ready_font
                    cell.alignment = Alignment(horizontal="center", vertical="center")

        ws_catalog.row_dimensions[1].height = 28

        # -------------------------------------------------------------
        # SHEET 2: Printify_34_Models
        # -------------------------------------------------------------
        ws_models = wb.create_sheet(title="Printify_34_Models")
        model_headers = ["Brand", "Model Name", "Blueprint ID", "Variant ID", "Print Area (px)", "Dimensions (mm)", "Aspect Ratio", "Safe Zone Top"]
        ws_models.append(model_headers)

        for col_idx in range(1, len(model_headers) + 1):
            cell = ws_models.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = sub_header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for r_idx, m in enumerate(TARGET_MODELS_34, start=2):
            row = [m["brand"], m["model"], 269, m["variant_id"], m["px"], m["mm"], "9:16", "35%"]
            ws_models.append(row)
            for c_idx in range(1, len(row) + 1):
                cell = ws_models.cell(row=r_idx, column=c_idx)
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")

        ws_models.row_dimensions[1].height = 24

        # -------------------------------------------------------------
        # SHEET 3: Variants_26_Manifest
        # -------------------------------------------------------------
        ws_variants = wb.create_sheet(title="Variants_26_Manifest")
        variant_headers = ["Design SKU", "Variant Index", "Variant SKU", "Device Model", "Finish Style", "Case Type", "MSRP ($)", "Resolution"]
        ws_variants.append(variant_headers)

        for col_idx in range(1, len(variant_headers) + 1):
            cell = ws_variants.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = sub_header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        var_r_idx = 2
        for d in designs:
            sku = d.get("sku", "CASE-001")
            v_counter = 1
            for model in FLAGSHIP_13_MODELS:
                code = "".join(c for c in model if c.isalnum()).upper()[:8]
                # Glossy
                row_g = [sku, v_counter, f"{sku}-{code}-GLOSS", model, "Glossy", "Tough Case", 24.99, "2400x4800"]
                ws_variants.append(row_g)
                for c_idx in range(1, len(row_g) + 1):
                    ws_variants.cell(row=var_r_idx, column=c_idx).border = thin_border
                var_r_idx += 1
                v_counter += 1

                # Matte
                row_m = [sku, v_counter, f"{sku}-{code}-MATTE", model, "Matte", "Tough Case", 24.99, "2400x4800"]
                ws_variants.append(row_m)
                for c_idx in range(1, len(row_m) + 1):
                    ws_variants.cell(row=var_r_idx, column=c_idx).border = thin_border
                var_r_idx += 1
                v_counter += 1

        ws_variants.row_dimensions[1].height = 24

        # Auto-adjust column widths across sheets
        for sheet in [ws_catalog, ws_models, ws_variants]:
            for col in sheet.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.row > 50:
                        break
                    val = str(cell.value or "")
                    if len(val) > max_len:
                        max_len = len(val)
                sheet.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 40)

        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        wb.save(filepath)
        return os.path.abspath(filepath)

    def _export_fallback_zip(self, filepath: str, designs: List[Dict[str, Any]], project_name: str) -> str:
        """Lightweight XML spreadsheet fallback without external dependencies."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        wb_zip = zipfile.ZipFile(filepath, "w", zipfile.ZIP_DEFLATED)

        def make_xml(headers, rows):
            parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                     '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
            # Header
            parts.append('<row r="1">')
            for c_i, h in enumerate(headers, 1):
                safe = str(h).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                col_c = chr(64 + c_i) if c_i <= 26 else f"A{chr(64 + c_i - 26)}"
                parts.append(f'<c r="{col_c}1" t="inlineStr"><is><t>{safe}</t></is></c>')
            parts.append('</row>')
            # Data
            for r_i, r in enumerate(rows, 2):
                parts.append(f'<row r="{r_i}">')
                for c_i, val in enumerate(r, 1):
                    safe = str(val if val is not None else "").replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    col_c = chr(64 + c_i) if c_i <= 26 else f"A{chr(64 + c_i - 26)}"
                    parts.append(f'<c r="{col_c}{r_i}" t="inlineStr"><is><t>{safe}</t></is></c>')
                parts.append('</row>')
            parts.append('</sheetData></worksheet>')
            return "".join(parts)

        cat_headers = ["SKU", "Title", "Method", "Retail Price", "Dimensions", "Status"]
        cat_rows = [[d.get("sku"), d.get("title"), d.get("generation_method"), 24.99, d.get("dimensions"), "READY"] for d in designs]

        wb_zip.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""")
        wb_zip.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""")
        wb_zip.writestr("xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Master_Design_Catalog" sheetId="1" r:id="rId1"/></sheets>
</workbook>""")
        wb_zip.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>""")
        wb_zip.writestr("xl/worksheets/sheet1.xml", make_xml(cat_headers, cat_rows))
        wb_zip.close()
        return os.path.abspath(filepath)
