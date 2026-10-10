/**
 * Excel to Printify Bulk Importer Service
 * Parses Excel (.xlsx, .xls) and CSV files, detects product details (Title, Description, Tags, Design Image),
 * and handles one-by-one sequential automated importing into Printify.
 */

import * as XLSX from 'xlsx';
import {
  getStoredPrintifyToken,
  getPrintifyHeaders,
  uploadPrintifyImage,
} from './printifyClient';
import {
  extractGoogleDriveId,
  listDriveFolderImageFiles,
  fetchDriveImageAsDataUrl,
  DriveImageFile,
} from './unifiedGoogleService';
import {
  PRINTIFY_BLUEPRINT_CONFIGS,
  DEFAULT_PRINTIFY_VARIANT_MAP,
  getVariantMapForBlueprint,
} from '../design-studio/services/listingData';

export interface ExcelProductRow {
  index: number;
  rawRow: Record<string, any>;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  sku?: string;
  price?: number;
  productTemplate?: string;
  printProvider?: string;
  blueprintId?: string | number;
  printProviderId?: string | number;
  variantsRaw?: string;
  variantModels?: string[];
  variantIds?: number[];
  // Google Drive asset linkage
  driveFolderUrl?: string;
  driveFileId?: string;
  driveFileName?: string;
  isDriveResolved?: boolean;
  driveError?: string;
  // Processing status
  status: 'pending' | 'uploading-image' | 'creating-product' | 'completed' | 'failed' | 'skipped';
  printifyImageId?: string;
  printifyProductId?: string;
  printifyProductUrl?: string;
  designatedMockups?: Array<{
    src: string;
    label: string;
    key: string;
    variant_ids: number[];
    cameraId: number;
    cameraLabel: string;
  }>;
  error?: string;
  processedAt?: number;
}

export interface ExcelColumnMapping {
  titleColumn: string;
  descriptionColumn: string;
  tagsColumn: string;
  imageColumn: string;
  driveFolderColumn?: string;
  priceColumn?: string;
  skuColumn?: string;
  productTemplateColumn?: string;
  blueprintIdColumn?: string;
  providerColumn?: string;
  providerIdColumn?: string;
  variantsColumn?: string;
}

export interface ExcelParseResult {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  mapping: ExcelColumnMapping;
  rows: ExcelProductRow[];
  totalRows: number;
  validRows: number;
  hasDriveLinks?: boolean;
  detectedDriveFolderUrl?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Intelligent heuristics to auto-detect columns from Excel headers
 */
export function detectColumnMapping(headers: string[]): ExcelColumnMapping {
  const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  let titleColumn = '';
  let descriptionColumn = '';
  let tagsColumn = '';
  let imageColumn = '';
  let priceColumn = '';
  let skuColumn = '';
  let productTemplateColumn = '';
  let blueprintIdColumn = '';
  let providerColumn = '';
  let providerIdColumn = '';
  let variantsColumn = '';
  let driveFolderColumn = '';

  for (const h of headers) {
    const n = norm(h);

    // Title candidates
    if (!titleColumn) {
      if (['title', 'producttitle', 'designname', 'designtitle', 'name', 'listingtitle', 'itemtitle'].includes(n)) {
        titleColumn = h;
      }
    }

    // Description candidates
    if (!descriptionColumn) {
      if (['description', 'productdescription', 'desc', 'body', 'listingdescription', 'details'].includes(n)) {
        descriptionColumn = h;
      }
    }

    // Tags candidates
    if (!tagsColumn) {
      if (['tags', 'keywords', 'producttags', 'tag', 'etsytags', 'searchterms'].includes(n)) {
        tagsColumn = h;
      }
    }

    // Product Template / Blueprint
    if (!productTemplateColumn && !blueprintIdColumn) {
      if (
        [
          'producttemplate',
          'template',
          'blueprint',
          'blueprintid',
          'producttype',
          'casetype',
          'productblueprint',
          'itemtype',
          'casestyle',
          'phonecasetype',
        ].includes(n)
      ) {
        productTemplateColumn = h;
        blueprintIdColumn = h;
      }
    }

    // Print Provider
    if (!providerColumn && !providerIdColumn) {
      if (
        [
          'printprovider',
          'provider',
          'providerid',
          'printproviderid',
          'printvendor',
          'vendor',
          'supplier',
          'printpartner',
          'printchoice',
        ].includes(n)
      ) {
        providerColumn = h;
        providerIdColumn = h;
      }
    }

    // Variants / Phone Models
    if (!variantsColumn) {
      if (
        [
          'variants',
          'variantsphonemodels',
          'phonemodels',
          'models',
          'phonemodel',
          'variant',
          'cases',
          'variantids',
          'selectedmodels',
          'devices',
          'devicemodels',
          'phonelist',
        ].includes(n)
      ) {
        variantsColumn = h;
      }
    }

    // Google Drive Folder candidates
    if (!driveFolderColumn) {
      if (
        [
          'googledrivefolder',
          'googledrivelink',
          'googledrive',
          'googledriveurl',
          'drivefolder',
          'drivefolderlink',
          'drivefolderurl',
          'drivelink',
          'driveurl',
          'folderlink',
          'folderurl',
          'designfolder',
          'artworkfolder',
          'googlefolder',
          'drive',
          'designimagesfolder',
        ].includes(n)
      ) {
        driveFolderColumn = h;
      }
    }

    // Image URL candidates
    if (!imageColumn) {
      if (
        [
          'designimage',
          'imageurl',
          'designurl',
          'designfileurl',
          'image',
          'artwork',
          'artworkurl',
          'fileurl',
          'photo',
          'photourl',
          'mockupurl',
          'link',
          'medialink',
          'mediaurl',
        ].includes(n)
      ) {
        imageColumn = h;
      }
    }

    // Price
    if (!priceColumn) {
      if (['price', 'sellingprice', 'cost', 'retailprice', 'usd'].includes(n)) {
        priceColumn = h;
      }
    }

    // SKU / Product ID
    if (!skuColumn) {
      if (['sku', 'productid', 'id', 'itemid', 'itemnumber'].includes(n)) {
        skuColumn = h;
      }
    }

    // Blueprint ID specific
    if (!blueprintIdColumn) {
      if (['blueprintid', 'blueprint'].includes(n)) {
        blueprintIdColumn = h;
      }
    }

    // Provider ID specific
    if (!providerIdColumn) {
      if (['printproviderid', 'providerid', 'provider'].includes(n)) {
        providerIdColumn = h;
      }
    }
  }

  // Fallbacks if not matched by exact normalized strings
  if (!titleColumn) {
    titleColumn = headers.find((h) => /title|name/i.test(h)) || headers[0] || '';
  }
  if (!descriptionColumn) {
    descriptionColumn = headers.find((h) => /desc/i.test(h)) || '';
  }
  if (!tagsColumn) {
    tagsColumn = headers.find((h) => /tag|keyword/i.test(h)) || '';
  }
  if (!productTemplateColumn) {
    productTemplateColumn = headers.find((h) => /template|blueprint/i.test(h)) || '';
  }
  if (!providerColumn) {
    providerColumn = headers.find((h) => /provider|vendor/i.test(h)) || '';
  }
  if (!variantsColumn) {
    variantsColumn = headers.find((h) => /variant|model|phone/i.test(h)) || '';
  }
  if (!driveFolderColumn) {
    driveFolderColumn = headers.find((h) => /drive.*folder|google.*folder|folder.*link/i.test(h)) || '';
  }
  if (!imageColumn) {
    imageColumn = headers.find((h) => /image|artwork|file|photo|url/i.test(h)) || driveFolderColumn || '';
  }

  return {
    titleColumn,
    descriptionColumn,
    tagsColumn,
    imageColumn,
    driveFolderColumn: driveFolderColumn || undefined,
    priceColumn: priceColumn || undefined,
    skuColumn: skuColumn || undefined,
    productTemplateColumn: productTemplateColumn || undefined,
    blueprintIdColumn: blueprintIdColumn || productTemplateColumn || undefined,
    providerColumn: providerColumn || undefined,
    providerIdColumn: providerIdColumn || providerColumn || undefined,
    variantsColumn: variantsColumn || undefined,
  };
}

export interface ResolvedBlueprintProvider {
  blueprintId: string;
  printProviderId: string;
  templateTitle: string;
  providerTitle: string;
}

/**
 * Resolves blueprint and provider from user input or spreadsheet values
 * Defaults to Tough Phone Cases (Blueprint 269) and Printify Choice (Provider 99)
 */
export function resolveBlueprintAndProvider(
  templateInput?: any,
  providerInput?: any
): ResolvedBlueprintProvider {
  const normTemplate = String(templateInput || '').trim().toLowerCase();
  const normProvider = String(providerInput || '').trim().toLowerCase();

  let blueprintId = '269';
  let printProviderId = '99';
  let templateTitle = 'Tough Phone Cases';
  let providerTitle = 'Printify Choice';

  // Check template candidates
  if (normTemplate) {
    if (normTemplate.includes('tough') || normTemplate.includes('269')) {
      blueprintId = '269';
      printProviderId = '99';
      templateTitle = 'Tough Phone Cases';
      providerTitle = 'Printify Choice';
    } else if (normTemplate.includes('slim') || normTemplate.includes('268')) {
      blueprintId = '268';
      printProviderId = '1';
      templateTitle = 'Slim Phone Cases';
      providerTitle = 'SPOKE Custom Products';
    } else if (normTemplate.includes('clear') || normTemplate.includes('529')) {
      blueprintId = '529';
      printProviderId = '23';
      templateTitle = 'Clear Cases';
      providerTitle = 'WOYC';
    } else if (normTemplate.includes('wallet') || normTemplate.includes('1230') || normTemplate.includes('folio') || normTemplate.includes('flip')) {
      blueprintId = '1230';
      printProviderId = '23';
      templateTitle = 'Flip / Folio Wallet Cases';
      providerTitle = 'WOYC';
    } else if (normTemplate.includes('eco') || normTemplate.includes('bio') || normTemplate.includes('477')) {
      blueprintId = '477';
      printProviderId = '23';
      templateTitle = 'Biodegradable Eco Cases';
      providerTitle = 'WOYC';
    } else if (normTemplate.includes('snap') || normTemplate.includes('371')) {
      blueprintId = '371';
      printProviderId = '23';
      templateTitle = 'Snap Cases';
      providerTitle = 'WOYC';
    } else if (normTemplate.includes('flexi') || normTemplate.includes('370')) {
      blueprintId = '370';
      printProviderId = '23';
      templateTitle = 'Flexi Cases';
      providerTitle = 'WOYC';
    } else {
      const numMatch = normTemplate.match(/\b\d{2,5}\b/);
      if (numMatch) {
        blueprintId = numMatch[0];
        templateTitle = `Blueprint ${blueprintId}`;
      }
    }
  }

  // Override provider if explicitly provided
  if (normProvider) {
    if (normProvider.includes('choice') || normProvider.includes('99')) {
      printProviderId = '99';
      providerTitle = 'Printify Choice';
    } else if (normProvider.includes('spoke') || normProvider.includes('1')) {
      printProviderId = '1';
      providerTitle = 'SPOKE Custom Products';
    } else if (normProvider.includes('woyc') || normProvider.includes('23')) {
      printProviderId = '23';
      providerTitle = 'WOYC';
    } else {
      const numMatch = normProvider.match(/\b\d{1,5}\b/);
      if (numMatch) {
        printProviderId = numMatch[0];
        providerTitle = `Provider ${printProviderId}`;
      }
    }
  }

  return { blueprintId, printProviderId, templateTitle, providerTitle };
}

export interface ResolvedVariants {
  variantIds: number[];
  recognizedModels: string[];
  summary: string;
}

/**
 * Resolves phone model variants from user text in spreadsheet
 * Supports:
 * - "All", "All 34 Models", "All Tough Case Models"
 * - "All iPhones", "All Samsung"
 * - Comma-separated model names: "iPhone 18 Pro Max, iPhone 17 Pro, Samsung Galaxy S26"
 * - Comma-separated variant IDs: "423468, 423467, 254190"
 */
export function resolveVariantsFromInput(
  variantsInput?: any,
  blueprintId: string | number = '269'
): ResolvedVariants {
  const variantMap = getVariantMapForBlueprint(String(blueprintId));
  const allModels = Object.keys(variantMap);
  const allIds = allModels.map((m) => Number(variantMap[m])).filter(Boolean);

  if (variantsInput === undefined || variantsInput === null || String(variantsInput).trim() === '') {
    return {
      variantIds: allIds,
      recognizedModels: allModels,
      summary: `All ${allIds.length} Models (Default)`,
    };
  }

  const raw = String(variantsInput).trim();
  const lower = raw.toLowerCase();

  // All models
  if (
    lower === 'all' ||
    lower === '*' ||
    lower.includes('all models') ||
    lower.includes('all 34') ||
    lower.includes('all tough') ||
    lower === 'default'
  ) {
    return {
      variantIds: allIds,
      recognizedModels: allModels,
      summary: `All ${allIds.length} Tough Case Models`,
    };
  }

  // All iPhones
  if (lower === 'all iphones' || lower === 'iphones' || lower === 'all apple' || lower === 'apple' || lower.includes('all iphone')) {
    const iphoneModels = allModels.filter((m) => m.toLowerCase().includes('iphone'));
    const iphoneIds = iphoneModels.map((m) => Number(variantMap[m])).filter(Boolean);
    return {
      variantIds: iphoneIds,
      recognizedModels: iphoneModels,
      summary: `All ${iphoneIds.length} iPhone Models`,
    };
  }

  // All Samsung
  if (lower === 'all samsung' || lower === 'samsung' || lower === 'galaxy' || lower.includes('all samsung') || lower.includes('all galaxy')) {
    const samsungModels = allModels.filter((m) => m.toLowerCase().includes('samsung'));
    const samsungIds = samsungModels.map((m) => Number(variantMap[m])).filter(Boolean);
    return {
      variantIds: samsungIds,
      recognizedModels: samsungModels,
      summary: `All ${samsungIds.length} Samsung Models`,
    };
  }

  // Tokenize
  const tokens = raw.split(/[,;\n|]/).map((t) => t.trim()).filter(Boolean);
  const matchedIds: number[] = [];
  const recognizedModels: string[] = [];

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const token of tokens) {
    // 1. Is numeric ID?
    if (/^\d{5,8}$/.test(token)) {
      const idNum = Number(token);
      if (!matchedIds.includes(idNum)) {
        matchedIds.push(idNum);
        const modelName = Object.entries(variantMap).find(([, id]) => String(id) === token)?.[0];
        recognizedModels.push(modelName || `ID ${token}`);
      }
      continue;
    }

    // 2. Model name match
    const normToken = norm(token);
    let bestModel: string | null = null;

    for (const m of allModels) {
      if (norm(m) === normToken) {
        bestModel = m;
        break;
      }
    }

    if (!bestModel) {
      for (const m of allModels) {
        const nm = norm(m);
        if (nm.includes(normToken) || normToken.includes(nm)) {
          bestModel = m;
          break;
        }
      }
    }

    // Shorthand match
    if (!bestModel) {
      if (/^1[1-8]\s*(pro\s*max|pro|plus|mini)?/i.test(token)) {
        const candidate = allModels.find((m) => norm(m).includes(normToken));
        if (candidate) bestModel = candidate;
      } else if (/^s2[0-6]\s*(ultra|plus)?/i.test(token)) {
        const candidate = allModels.find((m) => norm(m).includes(normToken));
        if (candidate) bestModel = candidate;
      }
    }

    if (bestModel) {
      const varId = Number(variantMap[bestModel]);
      if (varId && !matchedIds.includes(varId)) {
        matchedIds.push(varId);
        recognizedModels.push(bestModel);
      }
    }
  }

  if (matchedIds.length > 0) {
    return {
      variantIds: matchedIds,
      recognizedModels,
      summary: `${matchedIds.length} Model${matchedIds.length === 1 ? '' : 's'} Selected`,
    };
  }

  // Fallback if no tokens parsed
  return {
    variantIds: allIds,
    recognizedModels: allModels,
    summary: `All ${allIds.length} Models (Fallback)`,
  };
}

/**
 * Extracts tag list from various formats: comma/semicolon separated string, array, or separate Tag_01..13 columns
 */
export function extractTagsFromRow(row: Record<string, any>, tagsColumn?: string): string[] {
  const tags: string[] = [];

  if (tagsColumn && row[tagsColumn] !== undefined) {
    const val = row[tagsColumn];
    if (Array.isArray(val)) {
      tags.push(...val.map(String));
    } else if (typeof val === 'string') {
      tags.push(
        ...val
          .split(/[,;\n]/)
          .map((t) => t.trim())
          .filter(Boolean)
      );
    }
  }

  // Also check for individual columns like Tag_01, Tag_02 or Tag 1, Tag 2
  Object.keys(row).forEach((key) => {
    if (/^tag[_\s]?\d+$/i.test(key) && key !== tagsColumn) {
      const val = row[key];
      if (val && typeof val === 'string' && val.trim()) {
        tags.push(val.trim());
      }
    }
  });

  return Array.from(new Set(tags)).slice(0, 13);
}

/**
 * Parse an uploaded Excel/CSV file (ArrayBuffer or File)
 */
export async function parseExcelFile(
  fileOrBuffer: File | ArrayBuffer,
  fileName: string = 'products.xlsx',
  sheetNameOverride?: string,
  mappingOverride?: Partial<ExcelColumnMapping>
): Promise<ExcelParseResult> {
  let buffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    buffer = await fileOrBuffer.arrayBuffer();
  } else {
    buffer = fileOrBuffer;
  }

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('The uploaded file does not contain any readable sheets.');
  }

  const activeSheet = sheetNameOverride && sheetNames.includes(sheetNameOverride)
    ? sheetNameOverride
    : sheetNames[0];

  const worksheet = workbook.Sheets[activeSheet];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    return {
      fileName,
      sheetNames,
      activeSheet,
      headers: [],
      mapping: { titleColumn: '', descriptionColumn: '', tagsColumn: '', imageColumn: '' },
      rows: [],
      totalRows: 0,
      validRows: 0,
      errors: ['No data rows found in this sheet.'],
      warnings: [],
    };
  }

  const headers = Object.keys(jsonData[0] || {});
  const autoMapping = detectColumnMapping(headers);
  const mapping: ExcelColumnMapping = {
    ...autoMapping,
    ...mappingOverride,
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mapping.titleColumn) {
    errors.push('Could not detect a Title column in the Excel file.');
  }
  if (!mapping.imageColumn && !mapping.driveFolderColumn) {
    errors.push('Could not detect a Design Image or Google Drive Folder column in the Excel file.');
  }
  if (!mapping.imageColumn && mapping.driveFolderColumn) {
    mapping.imageColumn = mapping.driveFolderColumn;
  }

  const rows: ExcelProductRow[] = jsonData.map((raw, idx) => {
    const title = String(raw[mapping.titleColumn] || '').trim();
    const description = String(raw[mapping.descriptionColumn] || '').trim();
    let imageUrl = String(raw[mapping.imageColumn] || '').trim();
    let driveFileName: string | undefined;
    if (
      imageUrl &&
      !imageUrl.startsWith('http') &&
      !imageUrl.startsWith('data:') &&
      !imageUrl.includes('drive.google.com')
    ) {
      const cleanName = imageUrl.replace(/^\/?designs\//i, '').trim();
      driveFileName = cleanName;
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      imageUrl = `${origin}/designs/${cleanName}`;
    }
    const tags = extractTagsFromRow(raw, mapping.tagsColumn);

    let driveFolderUrl = mapping.driveFolderColumn
      ? String(raw[mapping.driveFolderColumn] || '').trim()
      : undefined;

    // Auto-detect if raw row has any Google Drive folder link in any column
    if (!driveFolderUrl) {
      for (const [, v] of Object.entries(raw)) {
        if (typeof v === 'string' && v.includes('drive.google.com')) {
          if (v.includes('/folders/') || v.includes('folders%2F') || v.includes('folderview')) {
            driveFolderUrl = v.trim();
            break;
          }
        }
      }
    }

    // If imageUrl itself is a Google Drive folder link, populate driveFolderUrl
    if (imageUrl && (imageUrl.includes('/folders/') || imageUrl.includes('folders%2F') || imageUrl.includes('folderview'))) {
      if (!driveFolderUrl) driveFolderUrl = imageUrl;
    }

    // If imageUrl is a direct file link, extract file ID
    let driveFileId: string | undefined;
    if (imageUrl && imageUrl.includes('drive.google.com')) {
      const parsedDrive = extractGoogleDriveId(imageUrl);
      if (parsedDrive && parsedDrive.type === 'file') {
        driveFileId = parsedDrive.id;
      }
    }

    let price: number | undefined;
    if (mapping.priceColumn && raw[mapping.priceColumn] !== undefined) {
      const parsedPrice = parseFloat(String(raw[mapping.priceColumn]).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        price = parsedPrice;
      }
    }

    const sku = mapping.skuColumn ? String(raw[mapping.skuColumn] || '').trim() : undefined;

    // Extract raw template, provider, and variants from row
    const templateRaw = (mapping.productTemplateColumn && raw[mapping.productTemplateColumn]) ||
      (mapping.blueprintIdColumn && raw[mapping.blueprintIdColumn]) ||
      undefined;
    const providerRaw = (mapping.providerColumn && raw[mapping.providerColumn]) ||
      (mapping.providerIdColumn && raw[mapping.providerIdColumn]) ||
      undefined;
    const variantsRaw = mapping.variantsColumn ? raw[mapping.variantsColumn] : undefined;

    // Resolve template & provider (defaulting to Tough Phone Cases 269 / Printify Choice 99)
    const { blueprintId, printProviderId, templateTitle, providerTitle } = resolveBlueprintAndProvider(
      templateRaw,
      providerRaw
    );

    // Resolve variants (defaulting to all 34 Tough Case models if empty or "all")
    const { variantIds, recognizedModels, summary: variantsSummary } = resolveVariantsFromInput(
      variantsRaw,
      blueprintId
    );

    return {
      index: idx,
      rawRow: raw,
      title,
      description,
      tags,
      imageUrl,
      driveFolderUrl,
      driveFileId,
      driveFileName,
      price,
      sku,
      productTemplate: templateTitle,
      printProvider: providerTitle,
      blueprintId,
      printProviderId,
      variantsRaw: variantsRaw !== undefined && String(variantsRaw).trim() !== '' ? String(variantsRaw).trim() : variantsSummary,
      variantModels: recognizedModels,
      variantIds,
      status: 'pending',
    };
  });

  const hasDriveLinks = rows.some(
    (r) => Boolean(r.driveFolderUrl) || (r.imageUrl && r.imageUrl.includes('drive.google.com'))
  );
  let detectedDriveFolderUrl: string | undefined;
  if (hasDriveLinks) {
    const driveRow = rows.find(
      (r) =>
        r.driveFolderUrl ||
        (r.imageUrl && (r.imageUrl.includes('/folders/') || r.imageUrl.includes('folders%2F')))
    );
    detectedDriveFolderUrl =
      driveRow?.driveFolderUrl ||
      (driveRow?.imageUrl && (driveRow.imageUrl.includes('/folders/') || driveRow.imageUrl.includes('folders%2F'))
        ? driveRow.imageUrl
        : undefined);
  }

  const validRows = rows.filter((r) => r.title && (r.imageUrl || r.driveFolderUrl)).length;
  if (validRows === 0 && rows.length > 0) {
    warnings.push(
      'None of the rows have both a Title and an Image URL or Google Drive link. Please verify column mappings.'
    );
  } else if (validRows < rows.length) {
    warnings.push(
      `${rows.length - validRows} rows are missing a title or image / Google Drive link and will be flagged.`
    );
  }

  return {
    fileName,
    sheetNames,
    activeSheet,
    headers,
    mapping,
    rows,
    totalRows: rows.length,
    validRows,
    hasDriveLinks,
    detectedDriveFolderUrl,
    errors,
    warnings,
  };
}

/**
 * Automatically resolves and downloads design images from Google Drive for each product row
 */
export async function resolveGoogleDriveImagesForRows(
  rows: ExcelProductRow[],
  masterFolderUrlOrId?: string,
  token?: string | null,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ updatedRows: ExcelProductRow[]; resolvedCount: number; failedCount: number }> {
  let resolvedCount = 0;
  let failedCount = 0;

  // Cache folder listings so we don't query the same folder multiple times
  const folderCache = new Map<string, DriveImageFile[]>();

  const getFolderFiles = async (folderId: string): Promise<DriveImageFile[]> => {
    if (folderCache.has(folderId)) {
      return folderCache.get(folderId)!;
    }
    const files = await listDriveFolderImageFiles(folderId, token);
    folderCache.set(folderId, files);
    return files;
  };

  // Determine master folder ID if provided
  let masterFolderId: string | null = null;
  if (masterFolderUrlOrId) {
    const parsed = extractGoogleDriveId(masterFolderUrlOrId);
    if (parsed) masterFolderId = parsed.id;
  }

  // Pre-load master folder image files if available
  let masterFiles: DriveImageFile[] = [];
  if (masterFolderId) {
    try {
      masterFiles = await getFolderFiles(masterFolderId);
    } catch (err: any) {
      console.warn('Could not pre-load master Google Drive folder:', err);
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.(i + 1, rows.length, `Searching design image for "${row.title || `Item #${i + 1}`}"...`);

    try {
      // 1. Check if row already has a resolved data URL or non-drive image
      if (row.imageUrl && !row.imageUrl.includes('drive.google.com') && row.isDriveResolved) {
        resolvedCount++;
        continue;
      }

      // 2. Check if row has a direct Drive File URL
      const driveMatch = extractGoogleDriveId(row.imageUrl || '');
      if (driveMatch && driveMatch.type === 'file') {
        onProgress?.(i + 1, rows.length, `Downloading Google Drive file for "${row.title}"...`);
        const downloaded = await fetchDriveImageAsDataUrl(driveMatch.id, token);
        row.imageUrl = downloaded.dataUrl;
        row.driveFileId = driveMatch.id;
        row.driveFileName = downloaded.fileName;
        row.isDriveResolved = true;
        row.driveError = undefined;
        resolvedCount++;
        continue;
      }

      // 3. Check for specific folder in this row or master folder
      const targetFolderId =
        (row.driveFolderUrl && extractGoogleDriveId(row.driveFolderUrl)?.id) ||
        (driveMatch && driveMatch.type === 'folder' ? driveMatch.id : null) ||
        masterFolderId;

      if (!targetFolderId) {
        if (!row.imageUrl || row.imageUrl.includes('drive.google.com')) {
          row.driveError = 'No Google Drive folder or image link found for this product.';
          failedCount++;
        }
        continue;
      }

      // Retrieve files from target folder
      const files =
        targetFolderId === masterFolderId && masterFiles.length > 0
          ? masterFiles
          : await getFolderFiles(targetFolderId);

      if (files.length === 0) {
        throw new Error(`Google Drive folder (${targetFolderId}) contains no supported image files.`);
      }

      // Find the best match for this product row
      let matchedFile: DriveImageFile | null = null;

      // a) Explicit filename in row data (e.g. Design_File_Name, File Name, Artwork)
      const explicitFilename = Object.entries(row.rawRow).find(([k]) =>
        /file[_\s]?name|artwork[_\s]?file|design[_\s]?file/i.test(k)
      )?.[1];
      if (explicitFilename && typeof explicitFilename === 'string') {
        const cleanExp = explicitFilename.toLowerCase().trim();
        const baseExp = cleanExp.replace(/\.[a-z0-9]+$/i, '');
        matchedFile =
          files.find((f) => f.name.toLowerCase() === cleanExp) ||
          files.find((f) => f.name.toLowerCase().startsWith(baseExp)) ||
          files.find((f) => f.name.toLowerCase().includes(baseExp)) ||
          null;
      }

      // a2) Check if row.imageUrl is a filename (not an http/data/drive URL)
      if (!matchedFile && row.imageUrl && !row.imageUrl.startsWith('http') && !row.imageUrl.startsWith('data:')) {
        const cleanImgName = row.imageUrl.toLowerCase().trim();
        const baseImgName = cleanImgName.replace(/\.[a-z0-9]+$/i, '');
        matchedFile =
          files.find((f) => f.name.toLowerCase() === cleanImgName) ||
          files.find((f) => f.name.toLowerCase().startsWith(baseImgName)) ||
          files.find((f) => f.name.toLowerCase().includes(baseImgName)) ||
          null;
      }

      // b) SKU match
      if (!matchedFile && row.sku) {
        const cleanSku = row.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
        matchedFile =
          files.find((f) => {
            const cleanName = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanName.includes(cleanSku);
          }) || null;
      }

      // c) Product ID match
      if (!matchedFile) {
        const prodId = String(
          row.rawRow['Product ID'] || row.rawRow['Product_ID'] || row.rawRow['ID'] || row.rawRow['Id'] || ''
        );
        if (prodId) {
          const cleanId = prodId.toLowerCase().replace(/[^a-z0-9]/g, '');
          matchedFile =
            files.find((f) => {
              const cleanName = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanName.includes(cleanId);
            }) || null;
        }
      }

      // d) Title tokens match
      if (!matchedFile && row.title) {
        const titleTokens = row.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3);
        if (titleTokens.length > 0) {
          matchedFile =
            files.find((f) => {
              const nameLower = f.name.toLowerCase();
              return titleTokens.some((token) => nameLower.includes(token));
            }) || null;
        }
      }

      // e) If this folder was dedicated specifically to this row and only has 1 or 2 images
      if (!matchedFile && targetFolderId !== masterFolderId) {
        matchedFile = files[0];
      }

      // f) Sequential fallback for master folder
      if (!matchedFile && files.length > 0) {
        matchedFile = files[i % files.length];
      }

      if (!matchedFile) {
        throw new Error(`Could not find a matching design image in Google Drive for "${row.title}".`);
      }

      // Download the matched image file as base64 DataURL
      onProgress?.(i + 1, rows.length, `Importing "${matchedFile.name}" from Google Drive...`);
      const downloaded = await fetchDriveImageAsDataUrl(matchedFile.id, token);

      row.imageUrl = downloaded.dataUrl;
      row.driveFileId = matchedFile.id;
      row.driveFileName = matchedFile.name;
      row.isDriveResolved = true;
      row.driveError = undefined;
      resolvedCount++;
    } catch (err: any) {
      console.warn(`Failed to resolve Google Drive image for row ${i + 1}:`, err);
      row.driveError = err.message || 'Failed to download from Google Drive';
      failedCount++;
    }
  }

  onProgress?.(
    rows.length,
    rows.length,
    `Finished Google Drive import: ${resolvedCount} resolved, ${failedCount} failed.`
  );
  return { updatedRows: [...rows], resolvedCount, failedCount };
}

/**
 * Creates and downloads a sample Excel (.xlsx) file reference template
 * Pre-configured for Tough Phone Cases (Blueprint 269, Provider 99 Printify Choice)
 * Contains 3 sheets:
 * 1. Printify_Products (Main input sheet with configurable variants and templates)
 * 2. Tough_Cases_Models_Blueprint_269 (Comprehensive reference for all 34 phone models)
 * 3. Other_Case_Blueprints (Reference for Slim, Clear, Wallet, Eco cases)
 */
export function generateReferenceExcelFile(): void {
  // Sheet 1: Main Products Data Sheet
  const sampleData = [
    {
      'Product ID': 'CASE-001',
      'Product Template': 'Tough Phone Cases',
      'Print Provider': 'Printify Choice',
      'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
      'Title': 'Stained Glass Woodland Fox Tough Phone Case',
      'Description': 'Premium double-layer protective tough phone case featuring vibrant stained glass cathedral fox artwork. Impact-resistant polycarbonate shell with shock-absorbing TPU interior liner. UV-protected full bleed dye-sublimation wrap print with precision camera and port cutouts.',
      'Tags': 'stained glass case, woodland fox, aesthetic iphone case, tough phone case, autumn leaves, cottagecore case, animal artwork, gift for her, phone cover',
      'Design Image': 'stained_glass_fox.jpg',
      'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
      'Price': 24.99,
      'SKU': 'FOX-VITRAIL-TOUGH',
    },
    {
      'Product ID': 'CASE-002',
      'Product Template': 'Tough Phone Cases',
      'Print Provider': 'Printify Choice',
      'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
      'Title': 'Anime Pirate Great Wave Tough Phone Case',
      'Description': 'Heroic anime pirate captain touching his straw hat against surging Japanese ukiyo-e Great Waves and cherry blossom petals in an Alphonse Mucha tarot poster style. Dual-layer armor case engineered for maximum drop resistance.',
      'Tags': 'anime phone case, pirate captain, great wave off kanagawa, tarot card case, mucha art nouveau, manga phone case, japanese wave art, aesthetic tough case',
      'Design Image': 'anime_wave_pirate.jpg',
      'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
      'Price': 24.99,
      'SKU': 'PIRATE-WAVE-TOUGH',
    },
    {
      'Product ID': 'CASE-003',
      'Product Template': 'Tough Phone Cases',
      'Print Provider': 'Printify Choice',
      'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
      'Title': 'Celestial Witch and Spirit Wolf Tough Case',
      'Description': 'Ethereal anime witch maiden with crystal staff accompanied by a luminous cyan spirit wolf familiar in a magical amethyst forest beneath a gothic cathedral rose-window mandala. Polycarbonate hard shell with black silicone inner cushion.',
      'Tags': 'witch phone case, spirit wolf, gothic stained glass, fantasy artwork, celestial magic, pagan phone cover, anime witch aesthetic, protective tough case',
      'Design Image': 'celestial_witch_wolf.jpg',
      'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
      'Price': 24.99,
      'SKU': 'WITCH-WOLF-TOUGH',
    },
    {
      'Product ID': 'CASE-004',
      'Product Template': 'Tough Phone Cases',
      'Print Provider': 'Printify Choice',
      'Variants / Phone Models': 'All 34 Tough Case Models (All iPhones & Samsung)',
      'Title': 'Kitsune Samurai Stained Glass Tough Phone Case',
      'Description': 'Masked kitsune samurai warrior in embroidered haori holding a katana, surrounded by floating cyan will-o-wisps and blooming red spider lilies (higanbana) under a radiant blood moon. Premium 3D wrap dye sublimation print.',
      'Tags': 'kitsune samurai, fox mask case, japanese warrior, red spider lily, higanbana art, blood moon cover, stained glass vitrail, anime armor case',
      'Design Image': 'kitsune_samurai.jpg',
      'Google Drive Folder': 'https://drive.google.com/drive/folders/108aZnUBJ64BJdeaF6DTou9U5tyrthksO?usp=sharing',
      'Price': 24.99,
      'SKU': 'KITSUNE-SAMURAI-TOUGH',
    },
  ];

  const productsWorksheet = XLSX.utils.json_to_sheet(sampleData);
  productsWorksheet['!cols'] = [
    { wch: 14 }, // Product ID
    { wch: 24 }, // Product Template
    { wch: 20 }, // Print Provider
    { wch: 45 }, // Variants / Phone Models
    { wch: 48 }, // Title
    { wch: 75 }, // Description
    { wch: 55 }, // Tags
    { wch: 28 }, // Design Image
    { wch: 45 }, // Google Drive Folder
    { wch: 10 }, // Price
    { wch: 22 }, // SKU
  ];

  // Sheet 2: Tough Phone Cases Blueprint 269 Models Reference
  const toughVariantMap = DEFAULT_PRINTIFY_VARIANT_MAP;
  const toughModelsData = Object.entries(toughVariantMap).map(([model, variantId]) => {
    const isApple = model.startsWith('iPhone');
    return {
      'Device Brand': isApple ? 'Apple iPhone' : 'Samsung Galaxy',
      'Phone Model': model,
      'Printify Variant ID': Number(variantId),
      'Product Template': 'Tough Phone Cases',
      'Blueprint ID': 269,
      'Print Provider': 'Printify Choice',
      'Provider ID': 99,
      'Print Area Dimensions': '1311 × 2220 px',
      'Decoration Method': 'Dye-sublimation',
      'Printify Editor URL': 'https://printify.com/app/editor/269/99/dye-sublimation',
      'How To Use': 'Copy model name or write "All 34 Tough Case Models" in Sheet 1',
    };
  });

  const toughWorksheet = XLSX.utils.json_to_sheet(toughModelsData);
  toughWorksheet['!cols'] = [
    { wch: 18 }, // Device Brand
    { wch: 28 }, // Phone Model
    { wch: 20 }, // Printify Variant ID
    { wch: 22 }, // Product Template
    { wch: 14 }, // Blueprint ID
    { wch: 18 }, // Print Provider
    { wch: 14 }, // Provider ID
    { wch: 24 }, // Print Area Dimensions
    { wch: 20 }, // Decoration Method
    { wch: 55 }, // Printify Editor URL
    { wch: 55 }, // How To Use
  ];

  // Sheet 3: Other Case Blueprints Reference
  const otherBlueprintsData = [
    {
      'Template Name': 'Tough Phone Cases (Recommended)',
      'Blueprint ID': 269,
      'Default Provider': 'Printify Choice',
      'Provider ID': 99,
      'Case Type': 'Dual-layer (Polycarbonate + TPU)',
      'Decoration Method': 'Dye-sublimation (Full wrap)',
      'Print Area': '1311 × 2220 px',
      'Supported Models': '34 Models (iPhone 18 Pro Max to 11, Samsung S26 to S21)',
      'Printify URL': 'https://printify.com/app/editor/269/99/dye-sublimation',
    },
    {
      'Template Name': 'Slim Phone Cases',
      'Blueprint ID': 268,
      'Default Provider': 'SPOKE Custom Products',
      'Provider ID': 1,
      'Case Type': 'Slim Hard Shell',
      'Decoration Method': 'Dye-sublimation (Full wrap)',
      'Print Area': '1311 × 2220 px',
      'Supported Models': '26 Models (iPhone 17 Air/Pro Max to 11)',
      'Printify URL': 'https://printify.com/app/editor/268/1/dye-sublimation',
    },
    {
      'Template Name': 'Clear Cases',
      'Blueprint ID': 529,
      'Default Provider': 'WOYC',
      'Provider ID': 23,
      'Case Type': 'Transparent TPU / PC',
      'Decoration Method': 'UV Printing',
      'Print Area': '1200 × 2100 px',
      'Supported Models': '28 Models (iPhone 17 Pro Max to 12, Samsung S21)',
      'Printify URL': 'https://printify.com/app/editor/529/23/uv-printing',
    },
    {
      'Template Name': 'Flip / Folio Wallet Cases',
      'Blueprint ID': 1230,
      'Default Provider': 'WOYC',
      'Provider ID': 23,
      'Case Type': 'Faux Leather Folio / Wallet',
      'Decoration Method': 'UV Printing',
      'Print Area': '1500 × 2300 px',
      'Supported Models': '16 Models (iPhone 17 to 12, Samsung S22)',
      'Printify URL': 'https://printify.com/app/editor/1230/23/uv-printing',
    },
    {
      'Template Name': 'Biodegradable Eco Cases',
      'Blueprint ID': 477,
      'Default Provider': 'WOYC',
      'Provider ID': 23,
      'Case Type': 'Eco-friendly PLA Plant-based',
      'Decoration Method': 'UV Printing',
      'Print Area': '1200 × 2100 px',
      'Supported Models': '22 Models (iPhone 18 to 11, Samsung S21)',
      'Printify URL': 'https://printify.com/app/editor/477/23/uv-printing',
    },
    {
      'Template Name': 'Snap Cases',
      'Blueprint ID': 371,
      'Default Provider': 'WOYC',
      'Provider ID': 23,
      'Case Type': 'Slim Snap-on Shell',
      'Decoration Method': 'Sublimation',
      'Print Area': '1311 × 2220 px',
      'Supported Models': '35 Models (iPhone 18 to 7, Samsung S26 to S20)',
      'Printify URL': 'https://printify.com/app/editor/371/23/dye-sublimation',
    },
    {
      'Template Name': 'Flexi Cases',
      'Blueprint ID': 370,
      'Default Provider': 'WOYC',
      'Provider ID': 23,
      'Case Type': 'Flexible TPU',
      'Decoration Method': 'UV Printing',
      'Print Area': '1200 × 2100 px',
      'Supported Models': '32 Models (iPhone 18 to 7, Samsung S26 to S21)',
      'Printify URL': 'https://printify.com/app/editor/370/23/uv-printing',
    },
  ];

  const blueprintsWorksheet = XLSX.utils.json_to_sheet(otherBlueprintsData);
  blueprintsWorksheet['!cols'] = [
    { wch: 30 }, // Template Name
    { wch: 14 }, // Blueprint ID
    { wch: 24 }, // Default Provider
    { wch: 14 }, // Provider ID
    { wch: 28 }, // Case Type
    { wch: 28 }, // Decoration Method
    { wch: 20 }, // Print Area
    { wch: 45 }, // Supported Models
    { wch: 55 }, // Printify URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, productsWorksheet, 'Printify_Products');
  XLSX.utils.book_append_sheet(workbook, toughWorksheet, 'Tough_Cases_Models_269');
  XLSX.utils.book_append_sheet(workbook, blueprintsWorksheet, 'Other_Case_Blueprints');

  XLSX.writeFile(workbook, 'Printify_Tough_Cases_Bulk_Import_Template.xlsx');
}

/**
 * Creates and downloads a sample CSV template reference
 */
export function generateReferenceCsvFile(): void {
  const headers = [
    'Product ID',
    'Product Template',
    'Print Provider',
    'Variants / Phone Models',
    'Title',
    'Description',
    'Tags',
    'Design Image',
    'Google Drive Folder',
    'Price',
    'SKU',
  ];
  const sampleRows = [
    [
      'CASE-001',
      'Tough Phone Cases',
      'Printify Choice',
      'All 34 Tough Case Models (All iPhones & Samsung)',
      'Stained Glass Woodland Fox Tough Phone Case',
      'Premium double-layer protective tough phone case with vibrant stained glass fox artwork. Impact-resistant polycarbonate shell with shock-absorbing TPU liner.',
      'stained glass case, woodland fox, aesthetic iphone case, tough phone case, gift for her',
      'fox_stained_glass.png',
      'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      '24.99',
      'FOX-VITRAIL-TOUGH',
    ],
    [
      'CASE-002',
      'Tough Phone Cases',
      'Printify Choice',
      'iPhone 18 Pro Max, iPhone 18 Pro, iPhone 17 Pro Max, iPhone 17 Pro, iPhone 16 Pro Max, iPhone 15 Pro Max',
      'Botanical Wildflower Garden Floral Tough Case',
      'Hand-drawn vintage wildflower meadow pattern. Ultra-durable double-layer tough case with raised camera bezel.',
      'wildflower case, botanical flowers, floral phone case, spring phone case',
      'wildflower_meadow.png',
      'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      '24.99',
      'FLORAL-MEADOW-002',
    ],
    [
      'CASE-003',
      'Tough Phone Cases',
      'Printify Choice',
      'Samsung Galaxy S26, Samsung Galaxy S25, Samsung Galaxy S24, Samsung Galaxy S23',
      'Cosmic Galaxy Nebula Starfield Tough Case',
      'Deep space spiral nebula with luminous celestial dust and glowing star clusters. Dual-layer shockproof construction engineered for high drop protection.',
      'galaxy phone case, space nebula, astronomy gift, cosmic stars, deep space art',
      'cosmic_nebula.png',
      'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      '26.99',
      'COSMIC-NEBULA-003',
    ],
  ];

  const escapeVal = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const csv = [
    headers.map(escapeVal).join(','),
    ...sampleRows.map((r) => r.map(escapeVal).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Printify_Tough_Cases_Bulk_Import_Template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Sequential Importer configuration options
 */
export interface SequentialImportConfig {
  shopId: string | number;
  defaultBlueprintId: string | number;
  defaultPrintProviderId: string | number;
  defaultVariantIds: number[];
  defaultPrice: number;
  customToken?: string;
  googleToken?: string;
  masterDriveFolderUrl?: string;
  delayBetweenItemsMs?: number; // small delay between API requests to avoid rate limits
}

export type SequentialImportCallbacks = {
  onItemStart?: (index: number, row: ExcelProductRow) => void;
  onItemUploadingImage?: (index: number, row: ExcelProductRow) => void;
  onItemCreatingProduct?: (index: number, row: ExcelProductRow, imageId: string) => void;
  onItemSuccess?: (index: number, row: ExcelProductRow, printifyProductId: string, result: any) => void;
  onItemError?: (index: number, row: ExcelProductRow, error: Error) => void;
  onProgress?: (current: number, total: number, percentage: number) => void;
  onComplete?: (summary: { total: number; success: number; failed: number }) => void;
};

/**
 * Processes items one by one sequentially into Printify
 */
export async function processSequentialPrintifyImport(
  items: ExcelProductRow[],
  config: SequentialImportConfig,
  callbacks: SequentialImportCallbacks = {},
  signal?: { isCancelled: boolean; isPaused: boolean }
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  const token = config.customToken || getStoredPrintifyToken();

  for (let i = 0; i < items.length; i++) {
    // Check cancellation
    if (signal?.isCancelled) {
      break;
    }

    // Check pause loop
    while (signal?.isPaused && !signal?.isCancelled) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (signal?.isCancelled) break;

    const row = items[i];
    row.error = undefined;
    callbacks.onItemStart?.(i, row);

    // Validation
    if (!row.title || (!row.imageUrl && !row.driveFolderUrl && !config.masterDriveFolderUrl)) {
      const err = new Error('Row is missing required Title or Design Image / Google Drive link.');
      row.status = 'failed';
      row.error = err.message;
      failedCount++;
      callbacks.onItemError?.(i, row, err);
      callbacks.onProgress?.(i + 1, items.length, Math.round(((i + 1) / items.length) * 100));
      continue;
    }

    try {
      // Auto-resolve Google Drive image if not already a direct HTTP/Data URL
      const hasDirectHttpImage =
        Boolean(row.imageUrl) &&
        (row.imageUrl.startsWith('http') || row.imageUrl.startsWith('data:')) &&
        !row.imageUrl.includes('drive.google.com');

      if (
        !row.isDriveResolved &&
        (!hasDirectHttpImage || Boolean(config.googleToken)) &&
        (!row.imageUrl ||
          row.imageUrl.includes('drive.google.com') ||
          !row.imageUrl.startsWith('http') ||
          row.driveFolderUrl ||
          config.masterDriveFolderUrl)
      ) {
        callbacks.onItemUploadingImage?.(i, row);
        const resolved = await resolveGoogleDriveImagesForRows(
          [row],
          row.driveFolderUrl || config.masterDriveFolderUrl,
          config.googleToken
        );
        if (resolved.updatedRows[0]?.isDriveResolved) {
          row.imageUrl = resolved.updatedRows[0].imageUrl;
          row.driveFileId = resolved.updatedRows[0].driveFileId;
          row.driveFileName = resolved.updatedRows[0].driveFileName;
          row.isDriveResolved = true;
        }
      }

      if (!row.imageUrl || (!row.imageUrl.startsWith('http') && !row.imageUrl.startsWith('data:'))) {
        throw new Error(
          row.driveError ||
            'Could not find or download the design image from Google Drive for this product.'
        );
      }

      // Step 1: Upload image to Printify
      row.status = 'uploading-image';
      callbacks.onItemUploadingImage?.(i, row);

      const fileName = `${row.sku || `product_${i + 1}`}_artwork.png`;
      const uploadRes = await uploadPrintifyImage(fileName, row.imageUrl, token);
      row.printifyImageId = uploadRes.imageId;

      // Step 2: Create product draft on Printify
      row.status = 'creating-product';
      callbacks.onItemCreatingProduct?.(i, row, uploadRes.imageId);

      const blueprintId = row.blueprintId || config.defaultBlueprintId || '269';
      const providerId = row.printProviderId || config.defaultPrintProviderId || '99';
      const variantIds = (row.variantIds && row.variantIds.length > 0)
        ? row.variantIds
        : (config.defaultVariantIds && config.defaultVariantIds.length > 0)
        ? config.defaultVariantIds
        : resolveVariantsFromInput('All', blueprintId).variantIds;
      const price = row.price || config.defaultPrice;

      const productPayload = {
        action: 'create',
        shopId: config.shopId,
        title: row.title,
        description: row.description,
        tags: row.tags,
        blueprintId,
        printProviderId: providerId,
        variantIds,
        artworkImageId: uploadRes.imageId,
        price,
        token,
      };

      const response = await fetch('/api/printify', {
        method: 'POST',
        headers: getPrintifyHeaders(token),
        body: JSON.stringify(productPayload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.product?.id) {
        throw new Error(data.error || data.message || `Failed to create product in Printify (${response.status})`);
      }

      // Success
      row.status = 'completed';
      row.printifyProductId = String(data.product.id);
      row.printifyProductUrl = `https://printify.com/app/store/products/${data.product.id}`;
      row.designatedMockups =
        data.designatedMockups || data.product?.designatedMockups || data.product?.images || [];
      row.error = undefined;
      row.processedAt = Date.now();
      successCount++;

      callbacks.onItemSuccess?.(i, row, String(data.product.id), data);
    } catch (err: any) {
      let errorMsg = err.message || 'Import failed';
      if (errorMsg === 'Not found' || errorMsg.includes('Not found')) {
        errorMsg = 'Printify upload failed: Resource not found. Please verify shop connection.';
      }
      row.status = 'failed';
      row.error = errorMsg;
      failedCount++;
      callbacks.onItemError?.(i, row, err);
    }

    callbacks.onProgress?.(i + 1, items.length, Math.round(((i + 1) / items.length) * 100));

    // Optional delay between items to respect API rate limits
    if (config.delayBetweenItemsMs && i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, config.delayBetweenItemsMs));
    }
  }

  callbacks.onComplete?.({ total: items.length, success: successCount, failed: failedCount });
  return { success: successCount, failed: failedCount };
}
