---
name: casecraft-pipeline
description: >-
  Complete end-to-end CaseCraft Studio Print-on-Demand (POD) automation skill.
  Consolidates: (1) 9:16 pure 2D character artwork generation (1344x2389 @ 300 DPI),
  (2) Dual-device photorealistic lifestyle mockup generation (iPhone 18 Pro Max &
  Samsung Galaxy S26), (3) Printify Blueprint 269 / Provider 99 product creation
  and automated View All Mockups selection (2 custom lifestyle mockups first +
  strictly the 6 approved Printify mockups = 8/20 selected), (4) Direct Etsy Open
  API v3 store integration (CraftCasesStudio, Shop ID 7939147), (5) Single-mockup
  Pinterest Excel (.xlsx) & CSV export, and (6) GitHub & Netlify deployment.
  Trigger with /casecraft-pipeline.
---

# CaseCraft Studio Consolidated End-to-End POD Skill (`/casecraft-pipeline`)

Use this skill whenever the user asks to generate a new phone case design, create dual-device photorealistic lifestyle mockups, upload and configure products on Printify with the strict mockup selection, sync or manage their Etsy store (`CraftCasesStudio`), or export Pinterest single-mockup Excel/CSV files.

---

## Stage 1: Master 9:16 2D Artwork Generation (`1344 × 2389 px @ 300 DPI`)

### Strict Artwork Rules
- **Dimensions & Resolution**: `1344 × 2389` pixels at `300 DPI` (`9:16` vertical full-bleed aspect ratio).
- **Pure 2D Flat-Lay Graphic Art**: Must be a pure edge-to-edge 2D graphic print. **Never** include phone cases, bezels, camera cutouts, hands, or 3D device frames inside the master print file.
- **Safe-Zone Composition**:
  - **Top 35% Safe Zone**: Reserved for atmospheric sky, arched stained-glass tracery, mist, or subtle background elements so iPhone and Samsung camera cutouts never cover the character's face or primary focal details.
  - **Lower 65% Character Focal Zone**: Main sentient character, creature, or retro subject horizontally centered.
- **Output Path**:
  - `public/designs/{SKU}_9x16_Artwork.png`
  - `output/lifestyle_mockups/{theme-slug}/{SKU}_Master_9x16_Artwork_1344x2389_300DPI.png`

---

## Stage 2: Dual-Device Photorealistic Lifestyle Mockups (`iPhone 18 Pro Max` & `Samsung Galaxy S26`)

### Target Smartphone Models & Aesthetic
Every design is paired with **2 custom-generated photorealistic lifestyle mockups** (`2048 × 2048 px @ 300 DPI`) that faithfully wrap the exact master 2D artwork onto the back of a dual-layer Tough Case (glossy polycarbonate outer shell + black shock-absorbing TPU perimeter bumper):

1. **Custom Lifestyle Mockup #1 (`★ Primary`) — Apple iPhone 18 Pro Max**:
   - **Geometry**: `6.9-inch` chassis (`163.0 × 77.6 mm`), top-left squircle camera plateau with 3 triangular Pro lenses, LiDAR scanner, and flash inside a raised black TPU camera bezel.
   - **Scene**: Held gently at the side edges by a person wearing a cozy cream ribbed-knit sweater cuff over a warm honey-oak wooden desk, with a ribbed glass vase holding dried white baby's breath florals and golden-hour sunlight.
   - **Output Path**: `public/mockups/{SKU}_iPhone_18_Pro_Max_Lifestyle.png`

2. **Custom Lifestyle Mockup #2 — Samsung Galaxy S26**:
   - **Geometry**: Sleek armor-aluminum frame (`149.6 × 71.5 mm`), signature vertical column of 3 individual circular camera lenses in the top-left corner + LED flash inside a precision black TPU cutout.
   - **Scene**: Styled flat-lay resting at a 15-degree angle on sun-drenched cream linen fabric and warm honey-oak wood, flanked by dried pampas grass stems and warm afternoon window shadows.
   - **Output Path**: `public/mockups/{SKU}_Samsung_Galaxy_S26_Lifestyle.png`

### Automation Script
```powershell
py scripts/lifestyle_mockup_automator.py --theme "<Theme Name>" --sku "<SKU>"
```

---

## Stage 3: Printify Product Creation & Strict `8/20` Mockup Configuration

### Printify Store & Catalog Specs
- **Shop ID**: `29067558` (`My new store` — linked to Etsy sales channel `CraftCasesStudio`)
- **Blueprint ID**: `269` (*Tough Cases*)
- **Print Provider ID**: `99` (*Printify Choice*)
- **Variants**: All `34` enabled iPhone & Samsung Galaxy variants priced at `\$22.20` (`2220` cents).

### Strict Mockup Selection & Ordering (`8/20 Selected`)
Printify's public REST API v1 (`PUT /v1/shops/{shop_id}/products/{product_id}.json`) ignores `images` filtering and selects all 20 default mockups. Therefore, **always** run the Selenium **View All Mockups** automation (`scripts/configure_printify_mockups_selenium.py`) attached to Chrome with the user's Google account (`elattarayman1@gmail.com`) on `/app/mockup-library/shops/29067558/products/{product_id}`:

1. Click **Clear all** (`button.controls-clear`) to deselect all 20 default Printify mockups.
2. Upload the **2 Custom-Generated Lifestyle Mockups FIRST** via **Upload mockups**:
   - **Position 1 (`★ Primary`)**: Custom Lifestyle Mockup — `iPhone 18 Pro Max`
   - **Position 2**: Custom Lifestyle Mockup — `Samsung Galaxy S26`
3. Select **ONLY** the **6 Approved Printify Mockups** immediately after (no other Printify mockups may be selected):

| Gallery Rank | Printify UI Card Label | Variant ID | Camera ID | `camera_label` |
| :--- | :--- | :--- | :--- | :--- |
| **#3** | `Front, iPhone 18 Pro Max` (`Front view — iPhone 18 Pro Max`) | `423468` | `152213` | `front` |
| **#4** | `Close-up, iPhone 16 Pro Max` (`Close-up view — iPhone 16 Pro Max`) | `112813` | `106399` | `close-up` |
| **#5** | `iPhone 16 Pro Max` (`Standard view — iPhone 16 Pro Max`) | `112813` | `106403` | `layers` |
| **#6** | `Context 1, iPhone 11` (`Context view 1 — iPhone 11`) | `62582` | `97553` | `context-1` |
| **#7** | `Samsung Galaxy S24` | `105527` | `102321` | `close-up-2` |
| **#8** | `Front, Samsung Galaxy S26` (`Front view — Samsung Galaxy S26`) | `254190` | `128128` | `front` |

4. Click **Save selection** and **Save as draft** (do not publish live unless explicitly authorized by the user).
5. Verify via `GET /v1/shops/29067558/products/{product_id}.json` that `len(images) == 8` and `images[0]['is_default'] == True`.

```powershell
py scripts/configure_printify_mockups_selenium.py
```

---

## Stage 4: Direct Etsy Open API v3 Store Integration (`CraftCasesStudio`)

### Etsy Store & API Configuration
- **Etsy Store**: `CraftCasesStudio` (`https://www.etsy.com/shop/CraftCasesStudio`)
- **Etsy Shop ID**: `7939147`
- **Etsy Application ID**: `1519880281922`
- **Environment Variables (`.env`)**:
  - `ETSY_CLIENT_ID=lwcieui5fkfttw43kdeqqurp`
  - `ETSY_CLIENT_SECRET=u41l2l4p62ywcbtsut2bxkj2x`
  - `ETSY_SCOPES="listings_r listings_w transactions_r shops_r"`
  - `ETSY_SHOP_ID=7939147`
  - `ETSY_SHOP_NAME=CraftCasesStudio`
- **Header Format**: All Etsy Open API v3 requests (`https://api.etsy.com/v3/application/...`) require `'x-api-key': `${ETSY_CLIENT_ID}:${ETSY_CLIENT_SECRET}``.
- **Application Endpoints**:
  - Backend Handler: `src/server/etsy.ts` & `netlify/functions/etsy.ts` (`/api/etsy`)
  - Frontend Service & UI: `src/services/etsyClient.ts`, `src/components/EtsyKeyModal.tsx`, `src/components/EtsyStoreWorkspace.tsx` (Step 9 in pipeline navigation).

---

## Stage 5: Single-Mockup Pinterest Excel (`.xlsx`) & CSV Export

### Strict Single-Mockup Rule for Pinterest Excel
When generating the Pinterest upload file (`CaseCraft_Pinterest_Single_Mockup.xlsx` and `CaseCraft_Pinterest_Single_Mockup.csv`), include **ONLY ONE mockup per product** (the **★ Primary Custom Lifestyle Mockup — iPhone 18 Pro Max**), formatted with the official Pinterest Bulk Upload columns:

| Column | Description |
| :--- | :--- |
| `Title` | Product title (<= 100 characters) |
| `Media URL` | Public CDN URL of the single primary mockup (`https://d123s6f1z9g2wk.cloudfront.net/...`) |
| `Pinterest board` | Target board name (e.g. `Phone Cases`) |
| `Thumbnail` | Blank for image pins |
| `Description` | High-converting SEO description (<= 500 characters) |
| `Link` | Destination Etsy listing/shop URL (`https://www.etsy.com/shop/CraftCasesStudio...`) |
| `Publish date` | Scheduled date (`YYYY-MM-DD`) |
| `Keywords` | 13 comma-separated Etsy/Pinterest SEO tags |

### Automation Script
```powershell
py scripts/generate_pinterest_single_mockup_excel.py
```

---

## Stage 6: Build, Deploy to Netlify & Push to GitHub

```powershell
npm run build
py scripts/deploy_netlify.py
git add -A
git commit -m "Update CaseCraft Studio pipeline"
git push origin main
```
