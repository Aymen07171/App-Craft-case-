/**
 * Pinterest Bulk Posting CSV Data Model & Types
 * Strictly aligned with Pinterest's official Bulk Create Pins CSV format
 */

export interface PinterestCsvRow {
  Title: string;
  'Media URL': string;
  'Pinterest board': string;
  Thumbnail: string;
  Description: string;
  Link: string;
  'Publish date': string;
  Keywords: string;
}

export const PINTEREST_CSV_HEADERS: (keyof PinterestCsvRow)[] = [
  'Title',
  'Media URL',
  'Pinterest board',
  'Thumbnail',
  'Description',
  'Link',
  'Publish date',
  'Keywords',
];

export interface PinterestGenerationOptions {
  boardName: string;
  defaultDestinationLink?: string;
  includeDesignAsset: boolean;
  includePrimaryMockup: boolean;
  includeAllMockups: boolean;
  titleFormat: 'product-title' | 'title-with-callout' | 'seo-focused';
  descriptionFormat: 'full-description' | 'hook-and-tags' | 'story-format';
  tagsAsKeywords: boolean;
  utmCampaign?: string;
  startDate?: string;
  scheduleIntervalDays?: number; // e.g. 1 pin every 1 or 2 days
}

export interface PinterestParseResult {
  headers: string[];
  rows: PinterestCsvRow[];
  isValidFormat: boolean;
  errors: string[];
  warnings: string[];
}
