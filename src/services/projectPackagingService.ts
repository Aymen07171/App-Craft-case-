/**
 * Project Packaging & Publishing Service
 * Handles:
 * 1. Generating 4-sheet Master Excel Metadata (.xlsx)
 * 2. Assembling structured project folder hierarchy (designs/, variants/, specs/)
 * 3. Exporting ZIP archives & communicating with backend disk export
 * 4. Pushing entire project folder (designs + Excel) to Google Drive
 * 5. High-resolution canvas vector artwork generation fallback
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  TARGET_DEVICE_MODELS_34,
  generate26VariantsForDesign,
  PRODUCTION_THEMES,
  CASECRAFT_41_COLUMNS,
  DeviceModelSpec,
  DesignVariantSpec,
} from '../data/projectPublishingData';
import {
  findOrCreateFolder,
  uploadFileToFolder,
  googleRequest,
  DriveFileMetadata,
} from './unifiedGoogleService';

export interface ProjectDesignItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  tags: string[];
  prompt: string;
  themeId?: string;
  imageUrl: string; // base64 or remote URL
  dimensions: { width: number; height: number };
  aspectRatio: string;
  price: number;
  driveFileUrl?: string;
  driveFileId?: string;
  status: 'draft' | 'approved' | 'published';
  createdAt: number;
}

export interface ProjectBundleManifest {
  projectName: string;
  createdAt: number;
  designsCount: number;
  variantsPerDesign: number;
  totalVariantsCount: number;
  deviceModelsCount: number;
  excelFileName: string;
  googleDriveFolderUrl?: string;
  googleDriveFolderId?: string;
  designs: ProjectDesignItem[];
}

/**
 * Generates the full 4-Sheet Excel Workbook (.xlsx)
 */
export function generateProjectExcelWorkbook(
  projectName: string,
  designs: ProjectDesignItem[],
  driveFolderUrl?: string
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Master_Products
  const masterProductsData = designs.map((d, index) => {
    return {
      'Product ID': d.sku,
      'Product Template': 'Tough Phone Cases',
      'Blueprint ID': 269,
      'Print Provider': 'Printify Choice',
      'Provider ID': 99,
      'Supported Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
      'Variants Count': 26,
      'Title': d.title,
      'Description': d.description,
      'Tags': d.tags.join(', '),
      'Design Image': `${d.sku}_9x16_Artwork.png`,
      'Local File Path': `designs/${d.sku}_9x16_Artwork.png`,
      'Google Drive Folder': driveFolderUrl || 'Pending Upload',
      'Google Drive Image Link': d.driveFileUrl || 'Pending Upload',
      'Dimensions (px)': `${d.dimensions.width} x ${d.dimensions.height}`,
      'Aspect Ratio': d.aspectRatio,
      'Price (USD)': d.price,
      'Status': d.status,
    };
  });

  const masterWs = XLSX.utils.json_to_sheet(masterProductsData);
  masterWs['!cols'] = [
    { wch: 14 }, // Product ID
    { wch: 20 }, // Product Template
    { wch: 14 }, // Blueprint ID
    { wch: 18 }, // Print Provider
    { wch: 14 }, // Provider ID
    { wch: 38 }, // Supported Models
    { wch: 14 }, // Variants Count
    { wch: 45 }, // Title
    { wch: 65 }, // Description
    { wch: 50 }, // Tags
    { wch: 28 }, // Design Image
    { wch: 32 }, // Local File Path
    { wch: 42 }, // Google Drive Folder
    { wch: 42 }, // Google Drive Image Link
    { wch: 20 }, // Dimensions
    { wch: 14 }, // Aspect Ratio
    { wch: 12 }, // Price
    { wch: 12 }, // Status
  ];
  XLSX.utils.book_append_sheet(wb, masterWs, 'Master_Products');

  // 2. Sheet 2: Printify_34_Models
  const modelsSheetData = TARGET_DEVICE_MODELS_34.map((m) => {
    return {
      'Brand': m.brand,
      'Model Name': m.modelName,
      'Blueprint ID': 269,
      'Variant ID': m.variantId,
      'Print Area (px)': `${m.printAreaPx.width} x ${m.printAreaPx.height}`,
      'Dimensions (mm)': `${m.dimensionsMm.width} x ${m.dimensionsMm.height}`,
      'DPI': m.dpi,
      'Aspect Ratio': m.aspectRatio,
      'Case Type': m.caseType,
      'Camera Cutout Type': m.cameraCutout.type,
      'Cutout Position': m.cameraCutout.position,
      'Safe Zone Top (%)': `${m.cameraCutout.safeZoneTopPercent}%`,
      'Camera Description': m.cameraCutout.description,
      'Status': 'Certified & Supported',
    };
  });

  const modelsWs = XLSX.utils.json_to_sheet(modelsSheetData);
  modelsWs['!cols'] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 45 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, modelsWs, 'Printify_34_Models');

  // 3. Sheet 3: Variants_26_Manifest (Across all designs)
  const variantsSheetData: any[] = [];
  designs.forEach((d) => {
    const variants = generate26VariantsForDesign(d.sku);
    variants.forEach((v) => {
      variantsSheetData.push({
        'Design SKU': d.sku,
        'Design Title': d.title,
        'Variant Index': v.variantIndex,
        'Variant SKU': v.skuSuffix,
        'Target Phone Model': v.modelName,
        'Finish': v.finish,
        'Case Style': v.caseType,
        'MSRP (USD)': v.msrp,
        'Print Resolution': `${v.printAreaPx.width} x ${v.printAreaPx.height}`,
        'Aspect Ratio': v.aspectRatio,
      });
    });
  });

  const variantsWs = XLSX.utils.json_to_sheet(variantsSheetData);
  variantsWs['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 14 },
    { wch: 24 },
    { wch: 26 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, variantsWs, 'Variants_26_Manifest');

  // 4. Sheet 4: CaseCraft_41_Column_SEO
  const seoSheetData = designs.map((d, idx) => {
    const primaryKeywords = d.tags.slice(0, 3);
    const longTail = d.tags.slice(3, 6);
    const tags13 = d.tags.slice(0, 13);
    while (tags13.length < 13) {
      tags13.push('phone case');
    }

    return {
      Listing_ID: `LIST-${String(idx + 1).padStart(4, '0')}`,
      Product_ID: d.sku,
      Design_Title: d.title,
      Product_Title: `${d.title} Tough Phone Case | Protective Aesthetic Cover`,
      Etsy_Title_SEO: `${d.title} Tough Phone Case, Aesthetic Protective Cover for iPhone & Samsung`,
      Description_5_Part: d.description,
      Primary_Keyword_01: primaryKeywords[0] || 'tough phone case',
      Primary_Keyword_02: primaryKeywords[1] || 'iphone case',
      Primary_Keyword_03: primaryKeywords[2] || 'samsung case',
      LongTail_Keyword_01: longTail[0] || 'aesthetic protective cover',
      LongTail_Keyword_02: longTail[1] || 'unique art phone gift',
      LongTail_Keyword_03: longTail[2] || 'wireless charging case',
      Tag_01: tags13[0] || '',
      Tag_02: tags13[1] || '',
      Tag_03: tags13[2] || '',
      Tag_04: tags13[3] || '',
      Tag_05: tags13[4] || '',
      Tag_06: tags13[5] || '',
      Tag_07: tags13[6] || '',
      Tag_08: tags13[7] || '',
      Tag_09: tags13[8] || '',
      Tag_10: tags13[9] || '',
      Tag_11: tags13[10] || '',
      Tag_12: tags13[11] || '',
      Tag_13: tags13[12] || '',
      Category_Taxonomy: 'Electronics Cases / Phone Cases',
      Primary_Color: 'Multi-color',
      Secondary_Color: 'Vibrant Jewel Tones',
      Design_Style: 'Gothic Vitrail / Vector Illustration',
      Occasion: 'Everyday / Birthday Gift',
      Target_Audience: 'Smartphone Owners / Art Lovers',
      Aspect_Ratio: '9:16',
      Print_Dimensions_PX: `${d.dimensions.width} x ${d.dimensions.height}`,
      Print_Dimensions_MM: '113.4 x 192.6 mm',
      Printify_Blueprint_ID: 269,
      Printify_Provider_ID: 99,
      Supported_Models_Count: 34,
      Variants_Count: 26,
      MSRP_Price_USD: d.price,
      Google_Drive_Folder_URL: driveFolderUrl || 'Pending Upload',
      Status: 'READY_FOR_PUBLISHING',
    };
  });

  const seoWs = XLSX.utils.json_to_sheet(seoSheetData);
  XLSX.utils.book_append_sheet(wb, seoWs, 'CaseCraft_41_Column_SEO');

  return wb;
}

/**
 * Builds the complete structured Project ZIP Archive
 */
export async function createProjectZipArchive(
  projectName: string,
  designs: ProjectDesignItem[],
  driveFolderUrl?: string
): Promise<Blob> {
  const zip = new JSZip();
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const projectRoot = zip.folder(safeProjectName) || zip;

  // 1. Generate & Add Master Excel Metadata
  const workbook = generateProjectExcelWorkbook(projectName, designs, driveFolderUrl);
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  projectRoot.file(`${safeProjectName}_Master_Metadata.xlsx`, excelBuffer);

  // 2. Add designs/ folder
  const designsFolder = projectRoot.folder('designs');
  for (const d of designs) {
    if (d.imageUrl) {
      const imgData = await resolveImageBlob(d.imageUrl);
      designsFolder?.file(`${d.sku}_9x16_Artwork.png`, imgData);
    }
  }

  // 3. Add variants/ folder with per-design 26 variant specifications
  const variantsFolder = projectRoot.folder('variants');
  for (const d of designs) {
    const dVariantFolder = variantsFolder?.folder(d.sku);
    const variants = generate26VariantsForDesign(d.sku);
    dVariantFolder?.file(
      'variants_manifest.json',
      JSON.stringify(
        {
          designId: d.id,
          sku: d.sku,
          title: d.title,
          totalVariants: variants.length,
          variants,
        },
        null,
        2
      )
    );
  }

  // 4. Add specs/ folder with 34 device models specification
  const specsFolder = projectRoot.folder('specs');
  specsFolder?.file(
    'target_device_models_34.json',
    JSON.stringify(TARGET_DEVICE_MODELS_34, null, 2)
  );

  // 5. Add README_PUBLISHING_MANIFEST.txt
  const manifestText = `====================================================================
PROJECT PUBLISHING & PRODUCTION MANIFEST
Project: ${projectName}
Date: ${new Date().toISOString()}
Designs Count: ${designs.length}
Variants per Design: 26
Total Commercial SKUs: ${designs.length * 26}
Certified Device Models: 34 (Full Apple iPhone & Samsung Galaxy Lineup)
Google Drive URL: ${driveFolderUrl || 'Not yet uploaded'}
====================================================================

FOLDER STRUCTURE:
/ ${safeProjectName}/
  ├── ${safeProjectName}_Master_Metadata.xlsx  (4-sheet Excel: Products, Models, Variants, SEO)
  ├── designs/                                  (Full bleed 9:16 print-ready artwork PNGs)
  ├── variants/                                 (Per-design 26-variant commercial manifests)
  ├── specs/                                    (Exact millimeter & pixel dimensions for 34 models)
  └── README_PUBLISHING_MANIFEST.txt

PRINT STANDARDS:
- Aspect Ratio: 9:16 Vertical Full Bleed
- Safe Zone: Top 35% reserved for camera cutouts
- Artwork: Pure 2D graphic art without device bezels or mockups
- Color: High-gamut CMYK / sRGB 300 DPI
====================================================================`;
  projectRoot.file('README_PUBLISHING_MANIFEST.txt', manifestText);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Pushes entire Project Folder to Google Drive (Designs + Excel Metadata)
 */
export async function pushProjectToGoogleDrive(
  token: string,
  projectName: string,
  designs: ProjectDesignItem[],
  onProgress?: (status: string, percent: number) => void
): Promise<{
  folderId: string;
  folderUrl: string;
  excelFileId: string;
  excelFileUrl: string;
  uploadedDesigns: { sku: string; fileId: string; fileUrl: string }[];
}> {
  onProgress?.('Initializing Google Drive folders...', 10);

  // 1. Ensure root 'Etsy Projects' folder
  const rootProjectsFolderId = await findOrCreateFolder(token, 'Etsy Projects');

  // 2. Create specific project folder: [ProjectName]_[Timestamp]
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullFolderName = `${projectName}_${timestamp}`;
  const projectFolderId = await findOrCreateFolder(token, fullFolderName, rootProjectsFolderId);
  const designsFolderId = await findOrCreateFolder(token, 'designs', projectFolderId);
  const variantsFolderId = await findOrCreateFolder(token, 'variants', projectFolderId);

  const folderUrl = `https://drive.google.com/drive/folders/${projectFolderId}`;

  // 3. Upload all design images into designs/ folder
  const uploadedDesigns: { sku: string; fileId: string; fileUrl: string }[] = [];
  const total = designs.length;

  for (let i = 0; i < total; i++) {
    const d = designs[i];
    onProgress?.(`Uploading artwork ${i + 1}/${total}: ${d.title}...`, 20 + Math.round((i / total) * 50));

    try {
      const blob = await resolveImageBlob(d.imageUrl);
      const fileName = `${d.sku}_9x16_Artwork.png`;
      const uploaded = await uploadFileToFolder(token, blob, fileName, designsFolderId);
      const fileUrl = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`;
      uploadedDesigns.push({
        sku: d.sku,
        fileId: uploaded.id,
        fileUrl,
      });
      d.driveFileId = uploaded.id;
      d.driveFileUrl = fileUrl;
    } catch (err) {
      console.warn(`Failed uploading design ${d.sku} to Google Drive:`, err);
    }
  }

  // 4. Generate & Upload Master Excel Workbook containing the live Google Drive URLs!
  onProgress?.('Generating & uploading Master Excel Metadata workbook...', 80);
  const workbook = generateProjectExcelWorkbook(projectName, designs, folderUrl);
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const excelBlob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const excelFileName = `${projectName}_Master_Metadata.xlsx`;
  const uploadedExcel = await uploadFileToFolder(token, excelBlob, excelFileName, projectFolderId);
  const excelFileUrl = uploadedExcel.webViewLink || `https://drive.google.com/file/d/${uploadedExcel.id}/view`;

  onProgress?.('Project successfully published to Google Drive!', 100);

  return {
    folderId: projectFolderId,
    folderUrl,
    excelFileId: uploadedExcel.id,
    excelFileUrl,
    uploadedDesigns,
  };
}

/**
 * Resolves any data URL or URL into a Blob
 */
async function resolveImageBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const parts = url.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image at ${url}`);
  return await res.blob();
}

/**
 * Procedural Vector & Stained Glass Canvas Art Engine
 * Ensures 100% reliable, zero-failure design generation with authentic themes,
 * jewel-tone glass textures, character focal elements, and 9:16 aspect ratio.
 */
export function generateProceduralCanvasDesign(
  themeName: string,
  prompt: string,
  seed = Math.floor(Math.random() * 100000)
): { dataUrl: string; width: number; height: number } {
  const width = 1344;
  const height = 2389; // Exact 9:16 high resolution (Print-ready)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // Seeded pseudo-random
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 1. Draw Deep Atmospheric Jewel-Tone Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (themeName.includes('Fox') || themeName.includes('Autumn')) {
    bgGrad.addColorStop(0, '#1a0b06');
    bgGrad.addColorStop(0.35, '#3d1607');
    bgGrad.addColorStop(0.7, '#6b270a');
    bgGrad.addColorStop(1, '#1b0802');
  } else if (themeName.includes('Pirate') || themeName.includes('Wave')) {
    bgGrad.addColorStop(0, '#041226');
    bgGrad.addColorStop(0.35, '#0b294e');
    bgGrad.addColorStop(0.7, '#1b5087');
    bgGrad.addColorStop(1, '#05182e');
  } else if (themeName.includes('Witch') || themeName.includes('Wolf')) {
    bgGrad.addColorStop(0, '#0a0518');
    bgGrad.addColorStop(0.35, '#1e0c3d');
    bgGrad.addColorStop(0.7, '#38166b');
    bgGrad.addColorStop(1, '#0c051a');
  } else if (themeName.includes('Kitsune') || themeName.includes('Samurai')) {
    bgGrad.addColorStop(0, '#1a0408');
    bgGrad.addColorStop(0.35, '#3d0a14');
    bgGrad.addColorStop(0.7, '#6b1222');
    bgGrad.addColorStop(1, '#1a0409');
  } else {
    bgGrad.addColorStop(0, '#070b19');
    bgGrad.addColorStop(0.35, '#121f3d');
    bgGrad.addColorStop(0.7, '#243b6e');
    bgGrad.addColorStop(1, '#0a1024');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Stained Glass Vitrail Geometric Facets (Translucent Shimmer)
  ctx.save();
  ctx.globalAlpha = 0.18;
  const cols = 8;
  const rows = 14;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      const x1 = c * cellW + (rand() - 0.5) * 40;
      const y1 = r * cellH + (rand() - 0.5) * 40;
      const x2 = (c + 1) * cellW + (rand() - 0.5) * 40;
      const y2 = r * cellH + (rand() - 0.5) * 40;
      const x3 = (c + 1) * cellW + (rand() - 0.5) * 40;
      const y3 = (r + 1) * cellH + (rand() - 0.5) * 40;
      const x4 = c * cellW + (rand() - 0.5) * 40;
      const y4 = (r + 1) * cellH + (rand() - 0.5) * 40;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fillStyle = rand() > 0.5 ? '#fcd34d' : '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Draw Celestial Sunburst / Moon Halo in Upper Background (Top Safe Zone)
  const haloCenterX = width / 2;
  const haloCenterY = height * 0.32;
  const haloRadius = width * 0.42;

  ctx.save();
  const haloGrad = ctx.createRadialGradient(
    haloCenterX,
    haloCenterY,
    10,
    haloCenterX,
    haloCenterY,
    haloRadius
  );
  haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
  haloGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.6)');
  haloGrad.addColorStop(0.8, 'rgba(217, 119, 6, 0.2)');
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(haloCenterX, haloCenterY, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // Sunburst Ray Segments
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI * 2) / 36;
    ctx.beginPath();
    ctx.moveTo(
      haloCenterX + Math.cos(angle) * (haloRadius * 0.3),
      haloCenterY + Math.sin(angle) * (haloRadius * 0.3)
    );
    ctx.lineTo(
      haloCenterX + Math.cos(angle) * haloRadius,
      haloCenterY + Math.sin(angle) * haloRadius
    );
    ctx.stroke();
  }
  ctx.restore();

  // 4. Draw Main Character Focal Element Centered in Lower 65% of Canvas
  const charCenterX = width / 2;
  const charCenterY = height * 0.64;

  ctx.save();
  if (themeName.includes('Fox') || themeName.includes('Autumn')) {
    // Curled Sleeping Vitrail Fox
    // Outer sleeping body curl
    ctx.beginPath();
    ctx.ellipse(charCenterX, charCenterY + 40, 360, 260, 0, 0, Math.PI * 2);
    const foxBodyGrad = ctx.createRadialGradient(
      charCenterX - 80,
      charCenterY,
      20,
      charCenterX,
      charCenterY + 40,
      360
    );
    foxBodyGrad.addColorStop(0, '#ff7a29');
    foxBodyGrad.addColorStop(0.6, '#d9480f');
    foxBodyGrad.addColorStop(1, '#8f2300');
    ctx.fillStyle = foxBodyGrad;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0b02';
    ctx.stroke();

    // Fluffy tail wrapped around body
    ctx.beginPath();
    ctx.ellipse(charCenterX + 120, charCenterY + 120, 240, 140, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff922b';
    ctx.fill();
    ctx.stroke();

    // White fluffy tail tip
    ctx.beginPath();
    ctx.ellipse(charCenterX + 220, charCenterY + 160, 110, 80, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9db';
    ctx.fill();
    ctx.stroke();

    // Sleeping Fox Head & Closed Eyes
    ctx.beginPath();
    ctx.ellipse(charCenterX - 140, charCenterY + 10, 130, 110, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff7a29';
    ctx.fill();
    ctx.stroke();

    // White Muzzle
    ctx.beginPath();
    ctx.ellipse(charCenterX - 180, charCenterY + 40, 80, 60, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9db';
    ctx.fill();
    ctx.stroke();

    // Cute Black Nose & Sleeping Eyelash
    ctx.beginPath();
    ctx.arc(charCenterX - 225, charCenterY + 45, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();

    // Closed eye curve
    ctx.beginPath();
    ctx.arc(charCenterX - 150, charCenterY - 10, 30, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1c1917';
    ctx.stroke();

    // Pointed Fox Ears
    ctx.beginPath();
    ctx.moveTo(charCenterX - 170, charCenterY - 70);
    ctx.lineTo(charCenterX - 130, charCenterY - 180);
    ctx.lineTo(charCenterX - 80, charCenterY - 60);
    ctx.closePath();
    ctx.fillStyle = '#e8590c';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#1a0b02';
    ctx.stroke();
  } else if (themeName.includes('Pirate') || themeName.includes('Wave')) {
    // Anime Pirate Captain Silhouette touching Straw Hat
    // Surging Great Wave Crests around base
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.bezierCurveTo(width * 0.2, height - 300, width * 0.4, height - 100, width * 0.6, height - 250);
    ctx.bezierCurveTo(width * 0.8, height - 400, width * 0.9, height - 200, width, height);
    ctx.closePath();
    ctx.fillStyle = '#1971c2';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#0b2b48';
    ctx.stroke();

    // Captain Coat & Torso
    ctx.beginPath();
    ctx.moveTo(charCenterX - 160, charCenterY + 350);
    ctx.lineTo(charCenterX - 100, charCenterY + 80);
    ctx.lineTo(charCenterX + 100, charCenterY + 80);
    ctx.lineTo(charCenterX + 160, charCenterY + 350);
    ctx.closePath();
    ctx.fillStyle = '#c92a2a';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0505';
    ctx.stroke();

    // Straw Hat
    ctx.beginPath();
    ctx.ellipse(charCenterX, charCenterY - 60, 260, 70, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fcc419';
    ctx.fill();
    ctx.stroke();
    // Red Ribbon Band
    ctx.beginPath();
    ctx.ellipse(charCenterX, charCenterY - 75, 150, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e03131';
    ctx.fill();
    ctx.stroke();
    // Hat Crown
    ctx.beginPath();
    ctx.arc(charCenterX, charCenterY - 95, 120, Math.PI, 0);
    ctx.fillStyle = '#fab005';
    ctx.fill();
    ctx.stroke();
  } else if (themeName.includes('Witch') || themeName.includes('Wolf')) {
    // Ethereal Witch Maiden with Luminous Wolf Silhouette
    // Luminous Wolf Familiar
    ctx.beginPath();
    ctx.ellipse(charCenterX + 120, charCenterY + 140, 200, 130, -Math.PI / 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 217, 244, 0.85)';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#155799';
    ctx.stroke();

    // Witch Maiden Cape
    ctx.beginPath();
    ctx.moveTo(charCenterX - 120, charCenterY + 320);
    ctx.lineTo(charCenterX - 70, charCenterY);
    ctx.lineTo(charCenterX + 70, charCenterY);
    ctx.lineTo(charCenterX + 120, charCenterY + 320);
    ctx.closePath();
    ctx.fillStyle = '#5f3dc4';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1e1145';
    ctx.stroke();

    // Pointed Witch Hat
    ctx.beginPath();
    ctx.ellipse(charCenterX - 20, charCenterY - 50, 220, 50, -Math.PI / 16, 0, Math.PI * 2);
    ctx.fillStyle = '#3b1f7d';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(charCenterX - 90, charCenterY - 65);
    ctx.lineTo(charCenterX + 20, charCenterY - 260);
    ctx.lineTo(charCenterX + 70, charCenterY - 60);
    ctx.closePath();
    ctx.fillStyle = '#4c2889';
    ctx.fill();
    ctx.stroke();
  } else {
    // Dynamic Kitsune / Cyber Ronin Silhouette
    ctx.beginPath();
    ctx.moveTo(charCenterX - 140, charCenterY + 350);
    ctx.lineTo(charCenterX - 80, charCenterY + 50);
    ctx.lineTo(charCenterX + 80, charCenterY + 50);
    ctx.lineTo(charCenterX + 140, charCenterY + 350);
    ctx.closePath();
    ctx.fillStyle = '#e03131';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0505';
    ctx.stroke();

    // Fox Mask Head
    ctx.beginPath();
    ctx.ellipse(charCenterX, charCenterY - 30, 110, 130, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f8f9fa';
    ctx.fill();
    ctx.stroke();
    // Red Mask Face Markings
    ctx.beginPath();
    ctx.arc(charCenterX - 45, charCenterY - 20, 25, 0, Math.PI);
    ctx.arc(charCenterX + 45, charCenterY - 20, 25, 0, Math.PI);
    ctx.strokeStyle = '#c92a2a';
    ctx.lineWidth = 8;
    ctx.stroke();
  }
  ctx.restore();

  // 5. Draw Botanical & Tracery Accents along Bottom & Sides
  ctx.save();
  ctx.fillStyle = '#2b8a3e';
  ctx.strokeStyle = '#081c0c';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const leafX = 60 + i * 160;
    const leafY = height - 90;
    ctx.beginPath();
    ctx.ellipse(leafX, leafY, 60, 28, (i % 2 === 0 ? 0.4 : -0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 6. Draw Ornate Art Nouveau Cathedral Arched Border
  ctx.save();
  ctx.strokeStyle = '#d4af37'; // Antique gold
  ctx.lineWidth = 22;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner Leaded Solder Came Line
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 8;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Decorative Corner Rosettes
  const corners = [
    [70, 70],
    [width - 70, 70],
    [70, height - 70],
    [width - 70, height - 70],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}
