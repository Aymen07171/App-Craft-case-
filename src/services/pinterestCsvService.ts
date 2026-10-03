/**
 * Pinterest Bulk Posting CSV Service
 * Handles RFC-4180 compliant CSV serialization, parsing, validation,
 * and automated mapping from Unified Product Records into Pinterest Bulk Pins.
 */

import {
  PinterestCsvRow,
  PINTEREST_CSV_HEADERS,
  PinterestGenerationOptions,
  PinterestParseResult,
} from '../types/pinterest';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';

/**
 * Escapes and quotes a field value according to RFC-4180 rules.
 */
export const escapeCsvValue = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  // If field contains comma, double-quote, or newline, enclose in quotes and double internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Serializes an array of PinterestCsvRow objects into an official Pinterest-compatible CSV string.
 */
export const serializePinterestCsv = (rows: PinterestCsvRow[]): string => {
  const headerLine = PINTEREST_CSV_HEADERS.map((h) => escapeCsvValue(h)).join(',');
  const rowLines = rows.map((row) =>
    PINTEREST_CSV_HEADERS.map((header) => escapeCsvValue(row[header] ?? '')).join(',')
  );
  return [headerLine, ...rowLines].join('\n');
};

/**
 * Robust RFC-4180 CSV parser that properly handles multiline values, escaped quotes (""), and commas.
 */
export const parseRawCsvGrid = (csvText: string): string[][] => {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentVal += '"';
          i++; // skip next quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal);
        // Only push non-empty rows or rows with content
        if (currentRow.some((c) => c.trim().length > 0)) {
          result.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  // Push remainder
  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal);
    if (currentRow.some((c) => c.trim().length > 0)) {
      result.push(currentRow);
    }
  }

  return result;
};

/**
 * Parses any incoming Pinterest CSV text, validates the headers,
 * normalizes rows, and reports syntax errors or missing required fields.
 */
export const parsePinterestCsv = (csvContent: string): PinterestParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!csvContent || !csvContent.trim()) {
    return {
      headers: [],
      rows: [],
      isValidFormat: false,
      errors: ['The CSV content is empty.'],
      warnings: [],
    };
  }

  const grid = parseRawCsvGrid(csvContent);
  if (grid.length === 0) {
    return {
      headers: [],
      rows: [],
      isValidFormat: false,
      errors: ['No data rows found in the CSV.'],
      warnings: [],
    };
  }

  const rawHeaders = grid[0].map((h) => h.trim());
  const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase());

  // Check required headers: Title, Media URL, Pinterest board
  const requiredFields: (keyof PinterestCsvRow)[] = ['Title', 'Media URL', 'Pinterest board'];
  const missingRequired = requiredFields.filter(
    (req) => !normalizedHeaders.includes(req.toLowerCase())
  );

  if (missingRequired.length > 0) {
    errors.push(`Missing required Pinterest CSV headers: ${missingRequired.join(', ')}`);
  }

  // Build index map
  const headerMap: Partial<Record<keyof PinterestCsvRow, number>> = {};
  PINTEREST_CSV_HEADERS.forEach((header) => {
    const idx = normalizedHeaders.findIndex((h) => h === header.toLowerCase());
    if (idx !== -1) {
      headerMap[header] = idx;
    }
  });

  const parsedRows: PinterestCsvRow[] = [];

  for (let r = 1; r < grid.length; r++) {
    const rowValues = grid[r];
    const rowObj: PinterestCsvRow = {
      Title: '',
      'Media URL': '',
      'Pinterest board': '',
      Thumbnail: '',
      Description: '',
      Link: '',
      'Publish date': '',
      Keywords: '',
    };

    PINTEREST_CSV_HEADERS.forEach((header) => {
      const idx = headerMap[header];
      if (idx !== undefined && idx < rowValues.length) {
        rowObj[header] = rowValues[idx].trim();
      }
    });

    // Row validations
    if (!rowObj.Title) {
      warnings.push(`Row ${r}: Missing 'Title'.`);
    } else if (rowObj.Title.length > 100) {
      warnings.push(`Row ${r}: Title exceeds recommended 100 characters (${rowObj.Title.length} chars).`);
    }

    if (!rowObj['Media URL']) {
      warnings.push(`Row ${r}: Missing 'Media URL'.`);
    } else if (!/^https?:\/\//i.test(rowObj['Media URL'])) {
      warnings.push(`Row ${r}: 'Media URL' is not a valid HTTPS link.`);
    }

    if (!rowObj['Pinterest board']) {
      warnings.push(`Row ${r}: Missing 'Pinterest board'.`);
    }

    if (rowObj.Description && rowObj.Description.length > 500) {
      warnings.push(`Row ${r}: Description exceeds Pinterest max 500 characters (${rowObj.Description.length} chars).`);
    }

    parsedRows.push(rowObj);
  }

  return {
    headers: rawHeaders,
    rows: parsedRows,
    isValidFormat: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Automatically maps a UnifiedProductRecord into Pinterest Bulk Pin CSV rows.
 * Can create multiple pins for a single product (one for Design, and one for each Lifestyle Mockup).
 */
export const mapProductToPinterestPins = (
  product: UnifiedProductRecord,
  options: PinterestGenerationOptions
): PinterestCsvRow[] => {
  const pins: PinterestCsvRow[] = [];
  const baseTitle = product.listing.title || product.designName || 'Aesthetic Phone Case';
  const cleanDescription = (product.listing.description || '')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate description to 490 chars with ellipsis if longer than 500
  const pinDescription =
    cleanDescription.length > 490
      ? cleanDescription.substring(0, 487) + '...'
      : cleanDescription;

  // Format comma-separated keywords from listing tags & SEO keywords
  const allKeywords = Array.from(
    new Set([
      ...(product.listing.tags || []),
      ...(product.listing.primaryKeywords || []),
      ...(product.listing.longTailKeywords || []),
    ])
  )
    .filter((k) => k && k.trim())
    .map((k) => k.replace(/#/g, '').trim());

  const keywordsString = allKeywords.slice(0, 15).join(', ');

  // Base destination link
  let destinationLink = options.defaultDestinationLink || '';
  if (!destinationLink && product.automation.etsyListingId) {
    destinationLink = `https://www.etsy.com/listing/${product.automation.etsyListingId}`;
  }
  if (!destinationLink) {
    destinationLink = 'https://myshop.example.com';
  }

  // Add UTM tags if specified
  if (options.utmCampaign && destinationLink) {
    try {
      const url = new URL(destinationLink);
      url.searchParams.set('utm_source', 'pinterest');
      url.searchParams.set('utm_medium', 'bulk_pin');
      url.searchParams.set('utm_campaign', options.utmCampaign);
      destinationLink = url.toString();
    } catch {
      // ignore invalid URL
    }
  }

  // Calculate schedule dates if interval set
  const getPublishDateForIndex = (index: number): string => {
    if (!options.startDate || !options.scheduleIntervalDays) return '';
    try {
      const date = new Date(options.startDate);
      date.setDate(date.getDate() + index * options.scheduleIntervalDays);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return '';
    }
  };

  let pinIndex = 0;

  // 1. Design Artwork Pin
  if (options.includeDesignAsset) {
    const mediaUrl =
      product.design.webContentLink ||
      product.design.fileUrl ||
      product.design.sourceUrl ||
      product.design.localUrl;

    if (mediaUrl) {
      let pinTitle = baseTitle;
      if (options.titleFormat === 'title-with-callout') {
        pinTitle = `Original Art | ${baseTitle}`.substring(0, 100);
      } else if (options.titleFormat === 'seo-focused') {
        pinTitle = `${product.design.niche || 'Aesthetic Art'} • ${baseTitle}`.substring(0, 100);
      }

      pins.push({
        Title: pinTitle.substring(0, 100),
        'Media URL': mediaUrl,
        'Pinterest board': options.boardName || 'Aesthetic Tech & Accessories',
        Thumbnail: '',
        Description: pinDescription,
        Link: destinationLink,
        'Publish date': getPublishDateForIndex(pinIndex++),
        Keywords: keywordsString,
      });
    }
  }

  // 2. Primary Lifestyle Mockup Pin
  if (options.includePrimaryMockup) {
    const primaryMockup =
      product.mockups.find((m) => m.isPrimary && (m.fileUrl || m.localUrl)) ||
      product.mockups.find((m) => m.fileUrl || m.localUrl);

    if (primaryMockup) {
      const mediaUrl =
        primaryMockup.webContentLink ||
        primaryMockup.fileUrl ||
        primaryMockup.localUrl ||
        '';

      if (mediaUrl) {
        let pinTitle = baseTitle;
        if (options.titleFormat === 'title-with-callout') {
          pinTitle = `On Device • ${primaryMockup.modelName || 'Phone Case'} | ${baseTitle}`.substring(0, 100);
        }

        pins.push({
          Title: pinTitle.substring(0, 100),
          'Media URL': mediaUrl,
          'Pinterest board': options.boardName || 'Aesthetic Tech & Accessories',
          Thumbnail: '',
          Description: pinDescription,
          Link: destinationLink,
          'Publish date': getPublishDateForIndex(pinIndex++),
          Keywords: keywordsString,
        });
      }
    }
  }

  // 3. All Mockups (Slots 0..5)
  if (options.includeAllMockups) {
    product.mockups.forEach((mockup, idx) => {
      // skip primary if already added
      if (options.includePrimaryMockup && (mockup.isPrimary || idx === 0)) return;

      const mediaUrl =
        mockup.webContentLink ||
        mockup.fileUrl ||
        mockup.localUrl ||
        '';

      if (mediaUrl) {
        const pinTitle = `${mockup.modelName || `Scene ${idx + 1}`} | ${baseTitle}`.substring(0, 100);

        pins.push({
          Title: pinTitle,
          'Media URL': mediaUrl,
          'Pinterest board': options.boardName || 'Aesthetic Tech & Accessories',
          Thumbnail: '',
          Description: pinDescription,
          Link: destinationLink,
          'Publish date': getPublishDateForIndex(pinIndex++),
          Keywords: keywordsString,
        });
      }
    });
  }

  return pins;
};

/**
 * Triggers a browser download of the generated CSV file.
 */
export const downloadCsvFile = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

/**
 * Example default Pinterest template rows provided by Pinterest
 */
export const SAMPLE_PINTEREST_CSV_ROWS: PinterestCsvRow[] = [
  {
    Title: 'Boho Terracotta Botanical Sun Art Print | Minimalist Wall Decor Poster',
    'Media URL': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    'Pinterest board': 'Minimalist Wall Decor & Art',
    Thumbnail: '',
    Description:
      'Discover this gorgeous Boho Terracotta Botanical Sun Art Print. Explore this design for earthy wall decor, neutral living room aesthetic, and minimalist art prints. Design details include Warm Terracotta, Mid-Century Modern style.',
    Link: 'https://myshop.example.com/products/boho-sun-art-print',
    'Publish date': '',
    Keywords: 'earthy wall decor, neutral living room aesthetic, minimalist art prints, boho prints',
  },
  {
    Title: 'Vintage Floral Botanical Phone Case for iPhone 15 14 13 | Aesthetic Cottagecore Cover',
    'Media URL': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
    'Pinterest board': 'Aesthetic Tech & Accessories',
    Thumbnail: '',
    Description:
      'Discover the Vintage Floral Botanical Phone Case for iPhone 15 14 13. Explore this design for cottagecore aesthetic, wildflower phone cover, and cute gifts for her. Design details include Sage Green, botanical illustrations.',
    Link: 'https://myshop.example.com/products/vintage-botanical-case',
    'Publish date': '',
    Keywords: 'cottagecore aesthetic, wildflower phone cover, cute gifts for her, iPhone case aesthetic',
  },
];
