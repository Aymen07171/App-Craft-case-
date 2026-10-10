import { GeneratedDesign } from '../types';

export type ListingStatus = 'DRAFT' | 'READY' | 'PROCESSING' | 'PUBLISHED' | 'ERROR' | 'PAUSED';

export interface ListingSettings {
  defaultPrice: string;
  blueprintId: string;
  printProviderId: string;
  variantIds: Record<string, string>;
}

export interface EtsyListingDraft {
  designId: string;
  productId: string;
  designName: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  primaryColor: string;
  secondaryColor: string;
  style: string;
  occasion: string;
  recipient: string;
  sku: string;
  price: string;
  designFileUrl: string;
  mockupUrls: string[];
  blueprintId: string;
  printProviderId: string;
  selectedModels: string[];
  status: ListingStatus;
  printifyProductId: string;
  etsyListingId: string;
  error: string;
  createdDate: string;
  publishedDate: string;
  primaryKeywords: string[];
  longTailKeywords: string[];
  searchIntent: string[];
  keywordRationale: string;
}

export const PHONE_MODELS = [
  // Apple iPhone (Latest downwards)
  'iPhone 18 Pro Max',
  'iPhone 18 Pro',
  'iPhone 17 Pro Max',
  'iPhone 17 Pro',
  'iPhone 17 Air',
  'iPhone 17',
  'iPhone 17e',
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  'iPhone 16e',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 13 Mini',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 12 Mini',
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
  'iPhone XS MAX',
  'iPhone XS',
  'iPhone XR',
  'iPhone X',
  'iPhone 8 Plus',
  'iPhone 8',
  'iPhone 7 Plus',
  'iPhone 7',

  // Samsung Galaxy (Latest downwards)
  'Samsung Galaxy S26 Ultra',
  'Samsung Galaxy S26 Plus',
  'Samsung Galaxy S26',
  'Samsung Galaxy S25 Ultra',
  'Samsung Galaxy S25 Plus',
  'Samsung Galaxy S25',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24 Plus',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23 Ultra',
  'Samsung Galaxy S23 Plus',
  'Samsung Galaxy S23',
  'Samsung Galaxy S22 Ultra',
  'Samsung Galaxy S22 Plus',
  'Samsung Galaxy S22',
  'Samsung Galaxy S21 Ultra',
  'Samsung Galaxy S21 Plus',
  'Samsung Galaxy S21',
  'Samsung Galaxy S21 FE',
  'Samsung Galaxy S20 Ultra',
  'Samsung Galaxy S20+',
  'Samsung Galaxy S20',
  'Samsung Galaxy S20 FE',
] as const;

export type PhoneModel = typeof PHONE_MODELS[number];

export const IPHONE_MODELS: PhoneModel[] = PHONE_MODELS.filter((m) => m.startsWith('iPhone'));
export const SAMSUNG_MODELS: PhoneModel[] = PHONE_MODELS.filter((m) => m.startsWith('Samsung'));

export interface CaseBlueprintConfig {
  id: string;
  name: string;
  caseType: 'tough' | 'slim' | 'clear' | 'wallet' | 'eco-friendly' | 'snap' | 'flexi';
  printProviderId: string;
  providerName: string;
  defaultPrice: string;
  variantMap: Record<string, string>;
}

export const PRINTIFY_BLUEPRINT_CONFIGS: Record<string, CaseBlueprintConfig> = {
  tough: {
    id: '269',
    name: 'Tough Phone Cases (Printify Choice)',
    caseType: 'tough',
    printProviderId: '99',
    providerName: 'Printify Choice',
    defaultPrice: '22.20',
    variantMap: {
    "iPhone 11": "62582",
    "iPhone 11 Pro": "62583",
    "iPhone 11 Pro Max": "62584",
    "iPhone 12": "70871",
    "iPhone 12 Mini": "70872",
    "iPhone 12 Pro": "70873",
    "iPhone 12 Pro Max": "70874",
    "iPhone 13": "76611",
    "iPhone 13 Mini": "76612",
    "iPhone 13 Pro": "76613",
    "iPhone 13 Pro Max": "76614",
    "iPhone 14": "93905",
    "iPhone 14 Pro": "93906",
    "iPhone 14 Pro Max": "93907",
    "iPhone 14 Plus": "93908",
    "iPhone 15": "103561",
    "iPhone 15 Pro": "103562",
    "iPhone 15 Plus": "103563",
    "iPhone 15 Pro Max": "103564",
    "Samsung Galaxy S24": "105527",
    "Samsung Galaxy S23": "105528",
    "Samsung Galaxy S22": "105529",
    "Samsung Galaxy S21": "105530",
    "iPhone 16 Pro": "112812",
    "iPhone 16 Pro Max": "112813",
    "iPhone 16": "112814",
    "iPhone 16 Plus": "112815",
    "Samsung Galaxy S25": "125531",
    "iPhone 17": "130115",
    "iPhone 17 Pro": "130116",
    "iPhone 17 Pro Max": "130117",
    "Samsung Galaxy S26": "254190",
    "iPhone 18 Pro": "423467",
    "iPhone 18 Pro Max": "423468"
},
  },
  slim: {
    id: '268',
    name: 'Slim Phone Cases (SPOKE)',
    caseType: 'slim',
    printProviderId: '1',
    providerName: 'SPOKE Custom Products',
    defaultPrice: '19.80',
    variantMap: {
    "iPhone 11": "63360",
    "iPhone 11 Pro": "63361",
    "iPhone 11 Pro Max": "63362",
    "iPhone 13": "75625",
    "iPhone 13 Mini": "75626",
    "iPhone 13 Pro": "75627",
    "iPhone 13 Pro Max": "75628",
    "iPhone 12": "75629",
    "iPhone 12 Mini": "75630",
    "iPhone 12 Pro Max": "75631",
    "iPhone 14": "93901",
    "iPhone 14 Pro": "93902",
    "iPhone 14 Pro Max": "93903",
    "iPhone 14 Plus": "93904",
    "iPhone 15": "102543",
    "iPhone 15 Plus": "102544",
    "iPhone 15 Pro": "102545",
    "iPhone 15 Pro Max": "102546",
    "iPhone 16": "112816",
    "iPhone 16 Pro": "112817",
    "iPhone 16 Plus": "112818",
    "iPhone 16 Pro Max": "112819",
    "iPhone 17": "130103",
    "iPhone 17 Pro": "130104",
    "iPhone 17 Pro Max": "130105",
    "iPhone 17 Air": "130106"
},
  },
  clear: {
    id: '529',
    name: 'Clear Cases (WOYC)',
    caseType: 'clear',
    printProviderId: '23',
    providerName: 'WOYC',
    defaultPrice: '18.90',
    variantMap: {
    "iPhone 12 Mini": "68750",
    "iPhone 12": "68751",
    "iPhone 12 Pro": "68752",
    "iPhone 12 Pro Max": "68753",
    "Samsung Galaxy S21": "72536",
    "Samsung Galaxy S21 Plus": "72538",
    "Samsung Galaxy S21 Ultra": "72540",
    "iPhone 13": "75415",
    "iPhone 13 Mini": "75417",
    "iPhone 13 Pro": "75419",
    "iPhone 13 Pro Max": "75421",
    "iPhone 16": "113898",
    "iPhone 16 Pro": "113900",
    "iPhone 16 Plus": "113902",
    "iPhone 16 Pro Max": "113904",
    "iPhone 15": "113906",
    "iPhone 15 Pro": "113908",
    "iPhone 15 Plus": "113910",
    "iPhone 15 Pro Max": "113912",
    "iPhone 14": "113914",
    "iPhone 14 Pro": "113916",
    "iPhone 14 Plus": "113918",
    "iPhone 14 Pro Max": "113920",
    "iPhone 17": "150702",
    "iPhone 17 Air": "150703",
    "iPhone 17 Pro": "150704",
    "iPhone 17 Pro Max": "150705"
},
  },
  wallet: {
    id: '1230',
    name: 'Flip / Folio Wallet Cases (WOYC)',
    caseType: 'wallet',
    printProviderId: '23',
    providerName: 'WOYC',
    defaultPrice: '24.90',
    variantMap: {
    "Samsung Galaxy S22": "96365",
    "Samsung Galaxy S22 Plus": "96366",
    "Samsung Galaxy S22 Ultra": "96367",
    "iPhone 13": "96368",
    "iPhone 13 Mini": "96369",
    "iPhone 13 Pro": "96370",
    "iPhone 13 Pro Max": "96371",
    "iPhone 12": "96372",
    "iPhone 12 Mini": "96373",
    "iPhone 12 Pro": "96374",
    "iPhone 12 Pro Max": "96375",
    "iPhone 11": "96376",
    "iPhone 11 Pro": "96377",
    "iPhone 11 Pro Max": "96378",
    "Samsung Galaxy S21": "96379",
    "Samsung Galaxy S21 Plus": "96380",
    "Samsung Galaxy S21 Ultra": "96381",
    "iPhone 16": "113483",
    "iPhone 16 Pro": "113484",
    "iPhone 16 Plus": "113485",
    "iPhone 16 Pro Max": "113486",
    "iPhone 15": "113487",
    "iPhone 15 Pro": "113488",
    "iPhone 15 Plus": "113489",
    "iPhone 15 Pro Max": "113490",
    "iPhone 14": "113491",
    "iPhone 14 Pro": "113492",
    "iPhone 14 Plus": "113493",
    "iPhone 14 Pro Max": "113494",
    "Samsung Galaxy S23": "119875",
    "Samsung Galaxy S23 Plus": "119876",
    "Samsung Galaxy S23 Ultra": "119877",
    "Samsung Galaxy S24": "119878",
    "Samsung Galaxy S24 Plus": "119879",
    "Samsung Galaxy S24 Ultra": "119880",
    "Samsung Galaxy S25": "119881",
    "Samsung Galaxy S25 Plus": "119882",
    "Samsung Galaxy S25 Ultra": "119883",
    "iPhone 17": "244114",
    "iPhone 17 Air": "244115",
    "iPhone 17 Pro": "244116",
    "iPhone 17 Pro Max": "244117"
},
  },
  'eco-friendly': {
    id: '477',
    name: 'Biodegradable Eco Cases (WOYC)',
    caseType: 'eco-friendly',
    printProviderId: '23',
    providerName: 'WOYC',
    defaultPrice: '21.50',
    variantMap: {
    "iPhone 11 Pro": "65215",
    "Samsung Galaxy S20 Ultra": "65358",
    "Samsung Galaxy S20+": "65359",
    "iPhone 12 Mini": "68654",
    "iPhone 12": "68655",
    "iPhone 12 Pro": "68656",
    "iPhone 12 Pro Max": "68657",
    "iPhone 13": "76748",
    "iPhone 13 Mini": "76749",
    "iPhone 13 Pro": "76750",
    "iPhone 13 Pro Max": "76751",
    "iPhone 11": "77847",
    "iPhone 11 Pro Max": "77848",
    "Samsung Galaxy S21 Plus": "77853",
    "iPhone 15": "105436",
    "iPhone 15 Pro": "105437",
    "iPhone 15 Plus": "105438",
    "iPhone 15 Pro Max": "105439",
    "iPhone 14": "105440",
    "iPhone 14 Pro": "105441",
    "iPhone 14 Plus": "105442",
    "iPhone 14 Pro Max": "105443",
    "iPhone 16": "112386",
    "iPhone 16 Plus": "112387",
    "iPhone 16 Pro": "112388",
    "iPhone 16 Pro Max": "112389",
    "iPhone 17": "155631",
    "iPhone 17 Air": "155632",
    "iPhone 17 Pro": "155633",
    "iPhone 17 Pro Max": "155634",
    "iPhone 18 Pro": "460162",
    "iPhone 18 Pro Max": "460163"
},
  },
  snap: {
    id: '371',
    name: 'Snap Cases (WOYC)',
    caseType: 'snap',
    printProviderId: '23',
    providerName: 'WOYC',
    defaultPrice: '19.50',
    variantMap: {
    "iPhone 8": "45039",
    "iPhone 8 Plus": "45041",
    "iPhone X": "45043",
    "iPhone XR": "45191",
    "iPhone XS": "45192",
    "iPhone XS MAX": "45193",
    "iPhone 11": "63354",
    "iPhone 11 Pro": "63355",
    "iPhone 11 Pro Max": "63356",
    "Samsung Galaxy S20": "65231",
    "Samsung Galaxy S20 Ultra": "65233",
    "Samsung Galaxy S20+": "65235",
    "iPhone 12 Mini": "67978",
    "iPhone 12": "67990",
    "iPhone 12 Pro": "67992",
    "iPhone 12 Pro Max": "67994",
    "iPhone 13": "75399",
    "iPhone 13 Mini": "75401",
    "iPhone 13 Pro": "75403",
    "iPhone 13 Pro Max": "75405",
    "Samsung Galaxy S20 FE": "79538",
    "Samsung Galaxy S21 FE": "79540",
    "Samsung Galaxy S21": "79542",
    "Samsung Galaxy S21 Plus": "79544",
    "Samsung Galaxy S21 Ultra": "79546",
    "Samsung Galaxy S22": "80283",
    "Samsung Galaxy S22 Plus": "80285",
    "Samsung Galaxy S22 Ultra": "80287",
    "iPhone 14": "96151",
    "iPhone 14 Pro": "96153",
    "iPhone 14 Plus": "96155",
    "iPhone 14 Pro Max": "96157",
    "iPhone 16": "113863",
    "iPhone 16 Pro": "113865",
    "iPhone 16 Plus": "113867",
    "iPhone 16 Pro Max": "113869",
    "iPhone 15": "113871",
    "iPhone 15 Pro": "113873",
    "iPhone 15 Plus": "113875",
    "iPhone 15 Pro Max": "113877",
    "Samsung Galaxy S24": "113879",
    "Samsung Galaxy S24 Plus": "113881",
    "Samsung Galaxy S24 Ultra": "113883",
    "Samsung Galaxy S23": "113885",
    "Samsung Galaxy S23 Plus": "113887",
    "Samsung Galaxy S23 Ultra": "113889",
    "iPhone 17": "148537",
    "iPhone 17 Air": "148539",
    "iPhone 17 Pro": "148541",
    "iPhone 17 Pro Max": "148543",
    "Samsung Galaxy S25": "148580",
    "Samsung Galaxy S25 Plus": "148581",
    "Samsung Galaxy S25 Ultra": "148583",
    "Samsung Galaxy S26": "244230",
    "Samsung Galaxy S26 Plus": "244232",
    "Samsung Galaxy S26 Ultra": "244234",
    "iPhone 18 Pro": "407787",
    "iPhone 18 Pro Max": "407789"
},
  },
  flexi: {
    id: '370',
    name: 'Flexi Cases (WOYC)',
    caseType: 'flexi',
    printProviderId: '23',
    providerName: 'WOYC',
    defaultPrice: '17.90',
    variantMap: {
    "iPhone 8": "45045",
    "iPhone 8 Plus": "45046",
    "iPhone X": "45047",
    "iPhone 7": "45052",
    "iPhone 7 Plus": "45053",
    "iPhone XR": "45188",
    "iPhone XS": "45189",
    "iPhone XS MAX": "45190",
    "iPhone 11": "62579",
    "iPhone 11 Pro": "62580",
    "iPhone 11 Pro Max": "62581",
    "iPhone 12 Mini": "68165",
    "iPhone 12": "68166",
    "iPhone 12 Pro": "68167",
    "iPhone 12 Pro Max": "68168",
    "iPhone 13": "75178",
    "iPhone 13 Mini": "75179",
    "iPhone 13 Pro": "75180",
    "iPhone 13 Pro Max": "75181",
    "Samsung Galaxy S21": "78744",
    "Samsung Galaxy S21 Plus": "78745",
    "Samsung Galaxy S21 Ultra": "78746",
    "Samsung Galaxy S22": "80936",
    "Samsung Galaxy S22 Plus": "80937",
    "Samsung Galaxy S22 Ultra": "80938",
    "iPhone 14": "101223",
    "iPhone 14 Pro": "101224",
    "iPhone 14 Plus": "101225",
    "iPhone 14 Pro Max": "101226",
    "Samsung Galaxy S23": "101227",
    "Samsung Galaxy S23 Plus": "101228",
    "Samsung Galaxy S23 Ultra": "101229",
    "iPhone 15": "105310",
    "iPhone 15 Pro": "105311",
    "iPhone 15 Plus": "105312",
    "iPhone 15 Pro Max": "105313",
    "iPhone 16 Pro": "112621",
    "iPhone 16 Pro Max": "112622",
    "iPhone 16": "112623",
    "iPhone 16 Plus": "112624",
    "Samsung Galaxy S25": "117868",
    "Samsung Galaxy S25 Plus": "117869",
    "Samsung Galaxy S25 Ultra": "117870",
    "Samsung Galaxy S24": "122668",
    "Samsung Galaxy S24 Plus": "122669",
    "Samsung Galaxy S24 Ultra": "122670",
    "iPhone 17": "129869",
    "iPhone 17 Air": "129870",
    "iPhone 17 Pro": "129871",
    "iPhone 17 Pro Max": "129872",
    "Samsung Galaxy S26": "246812",
    "Samsung Galaxy S26 Plus": "246813",
    "Samsung Galaxy S26 Ultra": "246814",
    "iPhone 18 Pro": "407797",
    "iPhone 18 Pro Max": "407798"
},
  },
};

export function getBlueprintConfigForCaseType(caseType: string): CaseBlueprintConfig {
  return PRINTIFY_BLUEPRINT_CONFIGS[caseType] || PRINTIFY_BLUEPRINT_CONFIGS.tough;
}

export function getVariantMapForBlueprint(blueprintId: string): Record<string, string> {
  const match = Object.values(PRINTIFY_BLUEPRINT_CONFIGS).find(c => c.id === String(blueprintId));
  return match ? match.variantMap : PRINTIFY_BLUEPRINT_CONFIGS.tough.variantMap;
}

export const DEFAULT_PRINTIFY_VARIANT_MAP: Record<string, string> = PRINTIFY_BLUEPRINT_CONFIGS.tough.variantMap;

export const DEFAULT_LISTING_SETTINGS: ListingSettings = {
  defaultPrice: '22.20',
  blueprintId: '269',
  printProviderId: '99',
  variantIds: { ...DEFAULT_PRINTIFY_VARIANT_MAP },
};

const DRAFTS_KEY = 'casecraft-etsy-listing-drafts-v1';
const SETTINGS_KEY = 'casecraft-etsy-listing-settings-v1';
const PRODUCT_SEQUENCE_KEY = 'casecraft-product-sequence-v1';

export const loadListingDrafts = (): Record<string, EtsyListingDraft> => {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}') as Record<string, EtsyListingDraft>;
  } catch {
    return {};
  }
};

export const saveListingDrafts = (drafts: Record<string, EtsyListingDraft>): void => {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

export const loadListingSettings = (): ListingSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as Partial<ListingSettings>;
    // Merge saved settings with default blueprint, provider and variant map
    const mergedVariantIds = { ...DEFAULT_PRINTIFY_VARIANT_MAP };
    if (saved.variantIds) {
      for (const [model, id] of Object.entries(saved.variantIds)) {
        if (id && String(id).trim()) {
          mergedVariantIds[model] = String(id).trim();
        }
      }
    }

    return {
      defaultPrice: saved.defaultPrice || DEFAULT_LISTING_SETTINGS.defaultPrice,
      blueprintId: saved.blueprintId || DEFAULT_LISTING_SETTINGS.blueprintId,
      printProviderId: saved.printProviderId || DEFAULT_LISTING_SETTINGS.printProviderId,
      variantIds: mergedVariantIds,
    };
  } catch {
    return DEFAULT_LISTING_SETTINGS;
  }
};

export const saveListingSettings = (settings: ListingSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const nextProductId = (): string => {
  try {
    const previous = Number.parseInt(localStorage.getItem(PRODUCT_SEQUENCE_KEY) || '0', 10);
    const next = Number.isSafeInteger(previous) && previous > 0 ? previous + 1 : 1;
    localStorage.setItem(PRODUCT_SEQUENCE_KEY, String(next));
    return `CASE-${String(next).padStart(5, '0')}`;
  } catch {
    return `CASE-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  }
};

const initialDesignUrl = (design: GeneratedDesign): string => {
  if (design.sourceUrl) return design.sourceUrl;
  if (/^data:image\//i.test(design.imageUrl)) return '';
  try {
    return new URL(design.imageUrl, window.location.origin).toString();
  } catch {
    return '';
  }
};

export const createListingDraft = (
  design: GeneratedDesign,
  settings: ListingSettings,
  existing?: EtsyListingDraft
): EtsyListingDraft => {
  const productId = existing?.productId || nextProductId();
  return {
    designId: design.id,
    productId,
    designName: existing?.designName || design.title,
    title: existing?.title || '',
    description: existing?.description || '',
    tags: existing?.tags?.length === 13 ? [...existing.tags] : Array(13).fill(''),
    category: existing?.category || '',
    primaryColor: existing?.primaryColor || '',
    secondaryColor: existing?.secondaryColor || '',
    style: existing?.style || '',
    occasion: existing?.occasion || '',
    recipient: existing?.recipient || '',
    sku: existing?.sku || productId,
    price: existing?.price || settings.defaultPrice,
    designFileUrl: existing?.designFileUrl || initialDesignUrl(design),
    mockupUrls: existing?.mockupUrls?.length === 6 ? [...existing.mockupUrls] : Array(6).fill(''),
    blueprintId: existing?.blueprintId || settings.blueprintId,
    printProviderId: existing?.printProviderId || settings.printProviderId,
    selectedModels: existing?.selectedModels?.length ? existing.selectedModels : [...PHONE_MODELS],
    status: existing?.status || 'DRAFT',
    printifyProductId: existing?.printifyProductId || '',
    etsyListingId: existing?.etsyListingId || '',
    error: existing?.error || '',
    createdDate: existing?.createdDate || new Date().toISOString(),
    publishedDate: existing?.publishedDate || '',
    primaryKeywords: existing?.primaryKeywords || [],
    longTailKeywords: existing?.longTailKeywords || [],
    searchIntent: existing?.searchIntent || [],
    keywordRationale: existing?.keywordRationale || '',
  };
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const isSupportedImageReference = (value: string): boolean =>
  isHttpUrl(value) || /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value);

export const validateListingDraft = (
  draft: EtsyListingDraft,
  settings: ListingSettings,
  mockupFiles: (File | null)[],
  hasDesignSource: boolean
): string[] => {
  const errors: string[] = [];
  const required: [string, string][] = [
    ['Product_ID', draft.productId],
    ['Design_Name', draft.designName],
    ['Title', draft.title],
    ['Description', draft.description],
    ['SKU', draft.sku],
    ['Status', draft.status],
  ];
  required.forEach(([name, value]) => {
    if (!value.trim()) errors.push(`${name} is required.`);
  });

  if (draft.title.length > 140) errors.push(`Title is ${draft.title.length} characters. Maximum allowed: 140.`);
  if (draft.tags.length !== 13) errors.push(`Exactly 13 Etsy tags are required; currently ${draft.tags.length}.`);
  const normalizedTags = draft.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  if (new Set(normalizedTags).size !== normalizedTags.length) errors.push('Etsy tags must be unique. Remove repeated tags.');
  draft.tags.forEach((tag, index) => {
    const label = `Tag ${String(index + 1).padStart(2, '0')}`;
    if (!tag.trim()) errors.push(`${label} is required.`);
    else if (tag.length > 20) errors.push(`${label} is ${tag.length} characters. Maximum allowed: 20.`);
    else if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(tag)) errors.push(`${label} contains unsupported characters.`);
  });

  if (!draft.designFileUrl.trim() && !hasDesignSource) errors.push('Design_File_URL is required.');
  else if (draft.designFileUrl.trim() && !isSupportedImageReference(draft.designFileUrl.trim())) {
    errors.push('Design_File_URL must be an HTTP/HTTPS URL or supported image data URL.');
  }
  const availableMockups = draft.mockupUrls.filter((url) => url.trim()).length + mockupFiles.filter(Boolean).length;
  if (availableMockups === 0) errors.push('Add at least one mockup URL or image file.');
  draft.mockupUrls.forEach((url, index) => {
    if (url.trim() && !isSupportedImageReference(url.trim())) {
      errors.push(`Mockup ${String(index + 1).padStart(2, '0')} must be an HTTP/HTTPS URL or supported image data URL.`);
    }
  });
  if (!draft.price.trim() || !Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0) {
    errors.push('Price must be a number greater than 0.');
  }
  if (!draft.blueprintId.trim()) errors.push('Printify Blueprint_ID is required.');
  if (!draft.printProviderId.trim()) errors.push('Printify Print_Provider_ID is required.');
  if (draft.selectedModels.length === 0) errors.push('Select at least one phone model.');
  draft.selectedModels.forEach((model) => {
    if (!settings.variantIds[model]?.trim()) errors.push(`Configure the Printify Variant_ID for ${model}.`);
  });

  return errors;
};

export const listingToSheetRow = (
  draft: EtsyListingDraft,
  settings: ListingSettings,
  status: ListingStatus
): (string | number)[] => [
  draft.productId,
  draft.designName,
  draft.title,
  draft.description,
  ...Array.from({ length: 13 }, (_, index) => draft.tags[index] || ''),
  draft.category,
  draft.primaryColor,
  draft.secondaryColor,
  draft.style,
  draft.occasion,
  draft.recipient,
  draft.designFileUrl,
  ...Array.from({ length: 6 }, (_, index) => draft.mockupUrls[index] || ''),
  draft.sku,
  Number(draft.price),
  draft.blueprintId,
  draft.printProviderId,
  draft.selectedModels.map((model) => settings.variantIds[model]).filter(Boolean).join(','),
  status,
  draft.printifyProductId,
  draft.etsyListingId,
  draft.error,
  draft.createdDate,
  draft.publishedDate,
];