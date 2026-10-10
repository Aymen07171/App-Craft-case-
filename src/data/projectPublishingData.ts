/**
 * Master Data Specifications for Phone Case Manufacturing & Publishing
 * Covers:
 * 1. 34 Target Device Models (Apple iPhone & Samsung Galaxy) with exact mm & px dimensions
 * 2. 26 Commercial Variants per Design (Tough Glossy & Matte across flagship models)
 * 3. Predefined Production Themes adhering to the Character-Centric Safe-Zone Standard
 * 4. CaseCraft 41-Column Master SEO Spreadsheet Schema
 */

export interface DeviceModelSpec {
  brand: 'Apple iPhone' | 'Samsung Galaxy';
  modelName: string;
  variantId: number;
  printAreaPx: { width: number; height: number };
  dimensionsMm: { width: number; height: number };
  aspectRatio: string;
  dpi: number;
  caseType: 'Tough Case';
  cameraCutout: {
    type: string;
    position: 'top-left' | 'top-center';
    safeZoneTopPercent: number; // Top 35% safe margin
    description: string;
  };
}

export const TARGET_DEVICE_MODELS_34: DeviceModelSpec[] = [
  // --- Apple iPhone (23 Models) ---
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 18 Pro Max',
    variantId: 107200,
    printAreaPx: { width: 2400, height: 4800 },
    dimensionsMm: { width: 113.37, height: 192.62 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Square plateau Pro triple-lens cluster with LiDAR scanner',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 18 Pro',
    variantId: 107201,
    printAreaPx: { width: 2200, height: 4400 },
    dimensionsMm: { width: 106.5, height: 184.2 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Compact Pro triple-lens module',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 18 Plus',
    variantId: 107202,
    printAreaPx: { width: 2400, height: 4800 },
    dimensionsMm: { width: 112.8, height: 193.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Dual diagonal lens pill cluster',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 18',
    variantId: 107203,
    printAreaPx: { width: 2200, height: 4400 },
    dimensionsMm: { width: 105.8, height: 182.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Dual diagonal lens plateau',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 17 Pro Max',
    variantId: 105100,
    printAreaPx: { width: 2350, height: 4700 },
    dimensionsMm: { width: 112.5, height: 191.8 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Large triple lens Pro housing with microphone sensor',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 17 Pro',
    variantId: 105101,
    printAreaPx: { width: 2150, height: 4300 },
    dimensionsMm: { width: 105.4, height: 183.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Standard triple Pro cluster',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 17 Plus',
    variantId: 105102,
    printAreaPx: { width: 2350, height: 4700 },
    dimensionsMm: { width: 112.0, height: 191.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'dual-pill',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Vertical dual pill arrangement',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 17',
    variantId: 105103,
    printAreaPx: { width: 2150, height: 4300 },
    dimensionsMm: { width: 105.0, height: 182.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'dual-pill',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Vertical dual pill camera',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 16 Pro Max',
    variantId: 102145,
    printAreaPx: { width: 2324, height: 4624 },
    dimensionsMm: { width: 111.8, height: 190.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Contoured triple pro plateau with sapphire rim',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 16 Pro',
    variantId: 102144,
    printAreaPx: { width: 2136, height: 4248 },
    dimensionsMm: { width: 104.9, height: 181.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-plateau',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Triple camera system plateau',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 16 Plus',
    variantId: 102143,
    printAreaPx: { width: 2324, height: 4624 },
    dimensionsMm: { width: 111.5, height: 190.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'vertical-pill',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Vertical pill camera bumper',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 16',
    variantId: 102142,
    printAreaPx: { width: 2136, height: 4248 },
    dimensionsMm: { width: 104.5, height: 180.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'vertical-pill',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Vertical pill camera cutout',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 15 Pro Max',
    variantId: 96256,
    printAreaPx: { width: 2312, height: 4596 },
    dimensionsMm: { width: 111.0, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-square',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Square triple Pro lens cluster',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 15 Pro',
    variantId: 96255,
    printAreaPx: { width: 2124, height: 4220 },
    dimensionsMm: { width: 104.0, height: 180.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-square',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Square triple Pro lens cutout',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 15 Plus',
    variantId: 96254,
    printAreaPx: { width: 2312, height: 4596 },
    dimensionsMm: { width: 111.0, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Diagonal dual camera cutout',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 15',
    variantId: 96253,
    printAreaPx: { width: 2124, height: 4220 },
    dimensionsMm: { width: 104.0, height: 180.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Diagonal dual camera module',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 14 Pro Max',
    variantId: 88412,
    printAreaPx: { width: 2312, height: 4596 },
    dimensionsMm: { width: 111.0, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-square',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'High-profile square triple lens bump',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 14 Pro',
    variantId: 88411,
    printAreaPx: { width: 2124, height: 4220 },
    dimensionsMm: { width: 104.0, height: 180.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-square',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Square triple lens module',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 14 Plus',
    variantId: 88410,
    printAreaPx: { width: 2312, height: 4596 },
    dimensionsMm: { width: 111.0, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Diagonal dual lens cutout',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 14',
    variantId: 88409,
    printAreaPx: { width: 2124, height: 4220 },
    dimensionsMm: { width: 104.0, height: 180.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Diagonal dual lens housing',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 13 Pro Max',
    variantId: 74820,
    printAreaPx: { width: 2312, height: 4596 },
    dimensionsMm: { width: 111.0, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'triple-pro-square',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Square triple camera cutout',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 13',
    variantId: 74818,
    printAreaPx: { width: 2124, height: 4220 },
    dimensionsMm: { width: 104.0, height: 180.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'diagonal-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Diagonal dual lens opening',
    },
  },
  {
    brand: 'Apple iPhone',
    modelName: 'iPhone 11',
    variantId: 45102,
    printAreaPx: { width: 2100, height: 4200 },
    dimensionsMm: { width: 103.0, height: 179.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'vertical-dual',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Vertical dual lens cutout',
    },
  },

  // --- Samsung Galaxy (11 Models) ---
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S26 Ultra',
    variantId: 108100,
    printAreaPx: { width: 2400, height: 4850 },
    dimensionsMm: { width: 115.0, height: 194.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-ultra-p-shape',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Five floating individual circular lenses with laser autofocus',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S26+',
    variantId: 108101,
    printAreaPx: { width: 2300, height: 4700 },
    dimensionsMm: { width: 110.0, height: 190.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-vertical-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Three vertical floating camera rings',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S26',
    variantId: 108102,
    printAreaPx: { width: 2150, height: 4400 },
    dimensionsMm: { width: 103.5, height: 178.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-vertical-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Compact vertical floating lens column',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S25 Ultra',
    variantId: 104210,
    printAreaPx: { width: 2380, height: 4800 },
    dimensionsMm: { width: 114.5, height: 193.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Floating quad-camera and sensor array',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S25+',
    variantId: 104211,
    printAreaPx: { width: 2280, height: 4680 },
    dimensionsMm: { width: 109.5, height: 189.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-vertical-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Three floating circular lens rings',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S25',
    variantId: 104212,
    printAreaPx: { width: 2140, height: 4380 },
    dimensionsMm: { width: 103.0, height: 178.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-vertical-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Floating vertical triple lenses',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S24 Ultra',
    variantId: 98450,
    printAreaPx: { width: 2380, height: 4800 },
    dimensionsMm: { width: 114.0, height: 193.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Quad camera floating lens cutouts',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S23 Ultra',
    variantId: 94100,
    printAreaPx: { width: 2380, height: 4800 },
    dimensionsMm: { width: 114.0, height: 193.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Floating lens column with periscope telephoto',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S22 Ultra',
    variantId: 87200,
    printAreaPx: { width: 2380, height: 4800 },
    dimensionsMm: { width: 114.0, height: 193.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Waterdrop floating multi-lens pattern',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S21',
    variantId: 105530,
    printAreaPx: { width: 2100, height: 4300 },
    dimensionsMm: { width: 102.0, height: 176.0 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'contour-cut-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Contour-cut corner bumper wrapper',
    },
  },
  {
    brand: 'Samsung Galaxy',
    modelName: 'Samsung Galaxy S20',
    variantId: 105531,
    printAreaPx: { width: 2100, height: 4300 },
    dimensionsMm: { width: 101.5, height: 175.5 },
    aspectRatio: '9:16',
    dpi: 300,
    caseType: 'Tough Case',
    cameraCutout: {
      type: 'rectangle-island-triple',
      position: 'top-left',
      safeZoneTopPercent: 35,
      description: 'Rectangular camera island on upper left edge',
    },
  },
];

/**
 * Standard 26 Commercial Variants Matrix per Design
 * (13 Flagships x 2 Finishes: Glossy & Matte)
 */
export interface DesignVariantSpec {
  variantIndex: number;
  modelName: string;
  finish: 'Glossy' | 'Matte';
  caseType: 'Tough Case';
  skuSuffix: string;
  msrp: number;
  printAreaPx: { width: number; height: number };
  aspectRatio: string;
}

export const COMMERCIAL_26_FLAGSHIP_MODELS: string[] = [
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16',
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 13 Pro Max',
  'iPhone 13',
  'iPhone 11',
  'Samsung Galaxy S26 Ultra',
  'Samsung Galaxy S25 Ultra',
];

export function generate26VariantsForDesign(designSkuPrefix: string): DesignVariantSpec[] {
  const variants: DesignVariantSpec[] = [];
  let index = 1;

  for (const modelName of COMMERCIAL_26_FLAGSHIP_MODELS) {
    const model = TARGET_DEVICE_MODELS_34.find((m) => m.modelName === modelName) || TARGET_DEVICE_MODELS_34[0];
    const code = modelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);

    // 1. Glossy Finish Variant
    variants.push({
      variantIndex: index++,
      modelName,
      finish: 'Glossy',
      caseType: 'Tough Case',
      skuSuffix: `${designSkuPrefix}-${code}-GLOSS`,
      msrp: 24.99,
      printAreaPx: model.printAreaPx,
      aspectRatio: '9:16',
    });

    // 2. Matte Finish Variant
    variants.push({
      variantIndex: index++,
      modelName,
      finish: 'Matte',
      caseType: 'Tough Case',
      skuSuffix: `${designSkuPrefix}-${code}-MATTE`,
      msrp: 24.99,
      printAreaPx: model.printAreaPx,
      aspectRatio: '9:16',
    });
  }

  return variants;
}

/**
 * Curated Production Themes adhering to Character Element & 9:16 Safe Zone Rules
 */
export interface ProductionThemePreset {
  id: string;
  name: string;
  category: string;
  characterDescription: string;
  haloBackground: string;
  botanicalOrProps: string;
  colorPalette: string;
  borderStyle: string;
  defaultPrompt: string;
  sampleTitles: string[];
  suggestedTags: string[];
}

export const PRODUCTION_THEMES: ProductionThemePreset[] = [
  {
    id: 'theme-vitrail-fox',
    name: 'Gothic Vitrail Fox (Cathedral Glass)',
    category: 'Stained Glass / Fantasy Animals',
    characterDescription: 'peaceful sleeping red woodland fox curled serenely with bushy tail wrapped around body, centered in the lower 60% of canvas',
    haloBackground: 'radiant segmented cathedral sunburst halo with amber glass rays, surrounded by crescent moon and celestial star glass panes in the top 35% safe zone',
    botanicalOrProps: 'red fly agaric mushrooms, golden chanterelles, autumn oak leaves, forest berries, and miniature glowing woodland sprites',
    colorPalette: 'warm amber gold, fiery autumn orange, rich ruby red, deep moss emerald, and dark leaded came metallic outlines',
    borderStyle: 'intricate Art Nouveau cathedral pointed arched vitrail frame with curving leadline tracery',
    defaultPrompt: 'Masterpiece authentic cathedral stained glass window (vitrail), symmetrical vertical 9:16 composition. In the lower-middle, a peaceful sleeping red fox curled with fluffy tail. Directly behind is a radiant segmented sunburst halo. Upper 35% has celestial twilight glass and stars. Framed with oak leaves, fly agaric mushrooms, and leaded came solder outlines. Pure 2D flat-lay graphic art print, vibrant translucent jewel-tone glass radiance. Zero mockups, no phone hardware.',
    sampleTitles: [
      'Stained Glass Woodland Fox Tough Phone Case, Cathedral Vitrail Autumn Cover',
      'Sleeping Fox Art Nouveau Phone Case, Leaded Glass Forest Animal Cover',
      'Cathedral Sunburst Fox Protective Case, Jewel Tone Autumn Wildlife Art',
    ],
    suggestedTags: [
      'stained glass case',
      'woodland fox',
      'cathedral vitrail',
      'autumn fox cover',
      'tough phone case',
      'iphone 16 case',
      'samsung s25 case',
      'art nouveau print',
      'cottagecore aesthetic',
      'jewel tone glass',
      'animal illustration',
      'protective case',
      'unique art gift',
    ],
  },
  {
    id: 'theme-ukiyo-pirate',
    name: 'Anime Sea Pirate (Ukiyo-e Great Wave)',
    category: 'Anime / Japanese Woodblock',
    characterDescription: 'heroic anime pirate captain holding straw hat with windblown trench coat, centered proudly in the lower canvas',
    haloBackground: 'surging stylized Japanese Great Waves with foaming crests, cherry blossom gusts, and a radiant crimson rising sun crest in the upper background',
    botanicalOrProps: 'flying sakura blossoms, nautical compass rose, weathered anchor ropes, and spray droplets',
    colorPalette: 'deep Prussian indigo blue, crimson vermillion, warm parchment cream, and polished brass gold',
    borderStyle: 'Alphonse Mucha tarot border with geometric Japanese wave patterns and gilded decorative corner brackets',
    defaultPrompt: 'Heroic anime pirate captain touching brim of straw hat against surging Japanese ukiyo-e Great Waves, vertical 9:16 aspect ratio. Character centered in lower two-thirds of canvas, upper safe zone contains ocean spray and stylized clouds. Alphonse Mucha tarot poster styling, bold linework, rich flat colors. Full bleed pure graphic artwork, no phone borders, no mockups.',
    sampleTitles: [
      'Anime Pirate Great Wave Tough Phone Case, Mucha Tarot Sea Captain Cover',
      'Ukiyo-e Straw Hat Pirate Phone Case, Japanese Wave Japanese Art Cover',
      'Ocean Captain Anime Tough Case, Stylized Indigo Wave Graphic Cover',
    ],
    suggestedTags: [
      'anime phone case',
      'pirate captain',
      'great wave ukiyoe',
      'tarot card case',
      'mucha art nouveau',
      'japanese wave art',
      'tough phone case',
      'straw hat pirate',
      'manga phone cover',
      'iphone 15 case',
      'galaxy s24 case',
      'cool anime gift',
      'protective phone cover',
    ],
  },
  {
    id: 'theme-celestial-wolf',
    name: 'Celestial Witch & Spirit Wolf (Gothic Arcana)',
    category: 'Dark Fantasy / Celestial',
    characterDescription: 'ethereal anime witch maiden with crystal staff accompanied by a luminous cyan spirit wolf familiar curled beside her feet',
    haloBackground: 'gothic cathedral rose-window mandala with silver crescent moon phases and starlight nebulas in upper safe zone',
    botanicalOrProps: 'midnight purple bellflowers, creeping thorn brambles, floating runic crystals, and glowing spirit motes',
    colorPalette: 'deep midnight obsidian, bioluminescent cyan, amethyst violet, and burnished silver metallic came',
    borderStyle: 'gothic stained glass tracery arch with celestial zodiac glyphs and filigree corners',
    defaultPrompt: 'Ethereal anime witch maiden with crystal staff accompanied by a luminous cyan spirit wolf familiar, vertical 9:16 full-bleed artwork. Gothic cathedral rose-window mandala with crescent moon in upper safe area. Rich jewel-tone glass textures, glowing bioluminescent runes, dark leaded solder outlines. High contrast, clean 2D vector graphic art print. Zero mockups, no phone case borders.',
    sampleTitles: [
      'Celestial Witch and Spirit Wolf Tough Case, Gothic Stained Glass Magic Cover',
      'Spirit Wolf Familiar Phone Case, Dark Fantasy Arcana Witch Cover',
      'Gothic Rose Window Witch Case, Amethyst Purple Tough Phone Cover',
    ],
    suggestedTags: [
      'witch phone case',
      'spirit wolf',
      'gothic stained glass',
      'celestial magic',
      'anime witch cover',
      'fantasy artwork',
      'tough phone case',
      'iphone 16 pro max',
      'samsung s25 ultra',
      'amethyst purple',
      'wiccan aesthetic',
      'pagan phone case',
      'protective cover',
    ],
  },
  {
    id: 'theme-kitsune-samurai',
    name: 'Kitsune Samurai (Blood Moon Bushido)',
    category: 'Japanese Folklore / Cyber Fantasy',
    characterDescription: 'masked kitsune fox warrior in ornate embroidered haori wielding a gleaming katana in ready stance in the lower composition',
    haloBackground: 'massive radiant blood moon with drifting dark storm clouds and floating azure will-o-wisps in the upper sky',
    botanicalOrProps: 'blooming red spider lilies (higanbana), falling black raven feathers, and iridescent soul flames',
    colorPalette: 'crimson scarlet, midnight charcoal, ghost cyan, and liquid gold trim',
    borderStyle: 'ornate Japanese shoji woodblock border with dynamic wind swirls and golden crest stamps',
    defaultPrompt: 'Masked kitsune samurai warrior in embroidered haori holding a katana, surrounded by floating cyan will-o-wisps and blooming red spider lilies (higanbana), vertical 9:16 layout. Giant radiant blood moon in upper background safe zone. Crisp graphic illustration, dynamic linework, vivid crimson and midnight tones. Pure 2D flat artwork, zero phone hardware, no mockups.',
    sampleTitles: [
      'Kitsune Samurai Stained Glass Tough Case, Fox Mask Japanese Warrior Cover',
      'Blood Moon Kitsune Phone Case, Red Spider Lily Samurai Armor Cover',
      'Japanese Warrior Fox Mask Tough Case, Crimson Higanbana Art Cover',
    ],
    suggestedTags: [
      'kitsune samurai',
      'fox mask case',
      'blood moon cover',
      'red spider lily',
      'higanbana art',
      'japanese warrior',
      'tough phone case',
      'anime armor case',
      'iphone 14 case',
      'samsung s26 case',
      'bushido artwork',
      'aesthetic phone case',
      'gift for anime fan',
    ],
  },
  {
    id: 'theme-cyber-ronin',
    name: 'Neon Cyber Ronin (Synthwave Overpass)',
    category: 'Cyberpunk / Sci-Fi',
    characterDescription: 'cybernetic street ronin with glowing visor and carbon-fiber trench coat, centered in lower-third on a rain-drenched overpass',
    haloBackground: 'neon megalopolis skyline with holographic kanji billboards and retro perspective wireframe grid horizon',
    botanicalOrProps: 'neon reflection puddles, holographic scout drone hovering, and electric arcs',
    colorPalette: 'cyber neon cyan, hot magenta pink, deep asphalt black, and acid lime accents',
    borderStyle: 'tactical HUD telemetry border with corner reticles and digital framing brackets',
    defaultPrompt: 'Cybernetic neon ronin with glowing visor standing on a wet neon street overpass, vertical 9:16 print. Character anchored in lower-middle; upper safe zone features distant cyberpunk towers and misty rain. Dynamic lighting, crisp hard-surface details, 80s synthwave vapor aesthetic. Full bleed print-ready graphic art. No phone devices, zero mockups.',
    sampleTitles: [
      'Neon Cyber Ronin Tough Phone Case, Cyberpunk Synthwave Tokyo Cover',
      'Futuristic Street Ronin Phone Case, Holographic Neon City Cover',
      'Retro Cyberpunk Warrior Tough Case, Magenta Cyan Sci-Fi Cover',
    ],
    suggestedTags: [
      'cyberpunk phone case',
      'neon ronin',
      'synthwave aesthetic',
      'cyber samurai cover',
      'tokyo neon city',
      'tough phone case',
      'iphone 16 pro',
      'samsung s24 ultra',
      'sci fi artwork',
      'gamer phone case',
      'vaporwave cover',
      'futuristic gift',
      'protective armor case',
    ],
  },
];

/**
 * CaseCraft 41-Column Master SEO Spreadsheet Schema
 */
export const CASECRAFT_41_COLUMNS = [
  'Listing_ID',
  'Product_ID',
  'Design_Title',
  'Product_Title',
  'Etsy_Title_SEO',
  'Description_5_Part',
  'Primary_Keyword_01',
  'Primary_Keyword_02',
  'Primary_Keyword_03',
  'LongTail_Keyword_01',
  'LongTail_Keyword_02',
  'LongTail_Keyword_03',
  'Tag_01',
  'Tag_02',
  'Tag_03',
  'Tag_04',
  'Tag_05',
  'Tag_06',
  'Tag_07',
  'Tag_08',
  'Tag_09',
  'Tag_10',
  'Tag_11',
  'Tag_12',
  'Tag_13',
  'Category_Taxonomy',
  'Primary_Color',
  'Secondary_Color',
  'Design_Style',
  'Occasion',
  'Target_Audience',
  'Aspect_Ratio',
  'Print_Dimensions_PX',
  'Print_Dimensions_MM',
  'Printify_Blueprint_ID',
  'Printify_Provider_ID',
  'Supported_Models_Count',
  'Variants_Count',
  'MSRP_Price_USD',
  'Google_Drive_Folder_URL',
  'Status',
] as const;
