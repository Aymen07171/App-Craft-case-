---
description: End-to-end CaseCraft Studio POD workflow — generates 9:16 character artwork, dual-device photorealistic lifestyle mockups (iPhone 18 Pro Max & Samsung Galaxy S26), Printify products with strictly 8/20 mockups (2 custom lifestyle mockups first + 6 approved Printify mockups), publishes to Etsy (CraftCasesStudio), and exports single-mockup Pinterest Excel & CSV files.
---

# CaseCraft Studio End-to-End POD Workflow (`/casecraft-pipeline`)

1. **Generate 9:16 Pure 2D Master Artwork (`1344 × 2389 @ 300 DPI`)**:
   - Top 35% camera safe-zone, lower 65% centered character focal zone, zero mockups/hardware in the master print file.
   - Save to `public/designs/{SKU}_9x16_Artwork.png`.

2. **Generate Dual-Device Photorealistic Lifestyle Mockups (`iPhone 18 Pro Max` & `Samsung Galaxy S26`)**:
   - Generate custom photorealistic lifestyle mockups for **iPhone 18 Pro Max** (cozy cream knit handheld over warm honey-oak desk — set as `★ Primary`) and **Samsung Galaxy S26** (sun-drenched cream linen & honey-oak botanical flat-lay).
   - Save to `public/mockups/{SKU}_iPhone_18_Pro_Max_Lifestyle.png` and `public/mockups/{SKU}_Samsung_Galaxy_S26_Lifestyle.png`.

3. **Create Printify Product & Configure Strictly `8/20` Mockups via View All Mockups**:
   - Create product in Printify Shop `29067558` (`Blueprint 269` Tough Cases, `Provider 99` Printify Choice, `34` variants @ `\$22.20`).
   - Run `py scripts/configure_printify_mockups_selenium.py` to open **View all mockups**, click **Clear all**, upload the **2 custom lifestyle mockups first** (`★ Primary` = iPhone 18 Pro Max lifestyle mockup), and select **only** the 6 approved Printify mockups (`Front, iPhone 18 Pro Max`, `Close-up, iPhone 16 Pro Max`, `iPhone 16 Pro Max`, `Context 1, iPhone 11`, `Samsung Galaxy S24`, `Front, Samsung Galaxy S26`).

4. **Publish to Etsy Store (`CraftCasesStudio`, Shop ID `7939147`)**:
   - Sync/publish to Etsy via Printify's connected Etsy sales channel (`POST /v1/shops/29067558/products/{product_id}/publish.json`) and verify live on `CraftCasesStudio` via Etsy Open API v3 (`/api/etsy`).

5. **Export Single-Mockup Pinterest Excel (`.xlsx`) & CSV**:
   - Run `py scripts/generate_pinterest_single_mockup_excel.py` to export `CaseCraft_Pinterest_Single_Mockup.xlsx` containing strictly 1 primary mockup per product.
