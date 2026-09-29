import { GoogleGenAI, Type } from '@google/genai';

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export interface ExtractedDesignConcepts {
  subject: string;
  artStyle: string;
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    palette: string[];
  };
  mood: string;
  elements: string[];
  targetAudience: string[];
  giftOccasions: string[];
}

export interface SuggestedProductAttributes {
  category: string;
  categoryPath: string[];
  primaryColor: string;
  secondaryColor: string;
  artStyle: string;
  theme: string;
  subject: string;
  recipient: string;
  occasion: string;
  finish: string;
  material: string;
  compatibleDevices: string[];
}

export interface SeoRecommendations {
  primarySearchQuery: string;
  longTailStrategy: string;
  searchIntentSummary: string;
  conversionAdvice: string;
  keywordRationale: string;
}

export interface GeneratedMetadata {
  title: string;
  shortDescription: string;
  description: string;
  tags: string[]; // exactly 13 Etsy tags (max 20 chars each, unique)
  primaryKeywords: string[];
  longTailKeywords: string[];
  relevantSearchTerms: string[];
  searchIntent: string[];
  suggestedAttributes: SuggestedProductAttributes;
  relevantCategories: string[];
  personalizationSuggestions: string[];
  seoRecommendations: SeoRecommendations;
  extractedConcepts: ExtractedDesignConcepts;
  // Legacy / Direct flat fields for easy mapping
  category: string;
  primaryColor: string;
  secondaryColor: string;
  designStyle: string[];
  occasion: string;
  targetCustomer: string[];
  keywordRationale: string;
}

/**
 * Call Gemini models with automatic retry on transient spikes.
 */
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxRetries = 2
) {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.status || err?.code || 0);
      const errMsg = String(err?.message || '');
      const isQuotaExhausted =
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('quota metric') ||
        errMsg.includes('rate-limit') ||
        status === 429;

      if (isQuotaExhausted) {
        throw err;
      }

      const isRetryable =
        status === 503 ||
        status === 500 ||
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE');

      if (isRetryable && attempt < maxRetries - 1) {
        const delay = 400 * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Clean design titles and prompts by stripping extensions, timestamps, and formatting separators.
 */
export function sanitizeTitleString(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\.(png|jpe?g|webp|svg|gif)$/i, '')
    .replace(/_\d{10,15}$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and format an Etsy tag to strictly obey Etsy requirements:
 * - Maximum 20 characters
 * - Only alphanumeric and spaces
 * - Lowercase / clean formatting
 */
function cleanEtsyTag(rawTag: string): string {
  if (!rawTag) return '';
  const cleaned = rawTag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, ' ')
    .trim()
    .slice(0, 20)
    .trim();
  return cleaned;
}

/**
 * Ensure exactly 13 unique valid Etsy tags under 20 chars
 */
function ensureThirteenEtsyTags(tags: string[], contextKeywords: string[]): string[] {
  const seen = new Set<string>();
  const validTags: string[] = [];

  const candidates = [...tags, ...contextKeywords];

  for (const item of candidates) {
    const cleaned = cleanEtsyTag(item);
    if (cleaned.length >= 2 && cleaned.length <= 20 && !seen.has(cleaned)) {
      seen.add(cleaned);
      validTags.push(cleaned);
      if (validTags.length === 13) break;
    }
  }

  // Backup tags if still under 13
  const backups = [
    'phone case gift',
    'aesthetic case',
    'tough phone case',
    'iphone 16 case',
    'iphone 15 cover',
    'samsung galaxy case',
    'unique art case',
    'custom phone cover',
    'protective case',
    'gift for her',
    'gift for him',
    'designer case',
    'matte phone case',
    'glossy phone cover',
  ];

  for (const b of backups) {
    if (validTags.length >= 13) break;
    const cleaned = cleanEtsyTag(b);
    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      validTags.push(cleaned);
    }
  }

  return validTags.slice(0, 13);
}

/**
 * Smart keyword & title extractor from prompt when API is temporarily unavailable or quota exhausted.
 * Deeply extracts subjects, style, theme, colors, objects, mood, audience from the design prompt text.
 */
function extractSmartListingFallback(prompt: string, designTitle?: string, niche?: string): GeneratedMetadata {
  const cleanPrompt = (prompt || '').replace(/[\n\r]+/g, ' ').trim();
  const cleanTitle = sanitizeTitleString(designTitle);
  const lowerPrompt = cleanPrompt.toLowerCase();

  // Subject extraction
  const subjectTerms = [
    'stained glass fox', 'sleeping fox', 'fox', 'wolf', 'dragon', 'kitsune', 'samurai',
    'valkyrie', 'cat', 'kitten', 'botanical garden', 'wild roses', 'sunflower', 'cherry blossom',
    'moon and stars', 'celestial sun', 'moth', 'butterfly', 'mushroom', 'chanterelle',
    'forest stag', 'koi fish', 'ocean wave', 'mountain landscape', 'skull', 'tarot',
    'cyberpunk warrior', 'retro synthwave', 'art nouveau maiden', 'astronomy galaxy'
  ];

  let detectedSubject = '';
  for (const s of subjectTerms) {
    if (lowerPrompt.includes(s)) {
      detectedSubject = s;
      break;
    }
  }
  if (!detectedSubject && cleanTitle && cleanTitle.length > 3) {
    detectedSubject = cleanTitle;
  }
  if (!detectedSubject) {
    detectedSubject = niche ? `${niche} Art` : 'Aesthetic Illustrated Artwork';
  }

  // Art Style extraction
  const styleTerms = [
    'stained glass', 'vitrail', 'art nouveau', 'watercolor', 'oil painting', 'woodblock print',
    'synthwave', 'cyberpunk', 'gothic', 'cottagecore', 'minimalist line art', 'vintage botanical',
    'retro 80s', 'renaissance', 'japanese ukiyo-e', 'celestial engraving', 'linocut'
  ];
  let detectedStyle = 'Artistic Illustration';
  for (const st of styleTerms) {
    if (lowerPrompt.includes(st)) {
      detectedStyle = st.charAt(0).toUpperCase() + st.slice(1);
      break;
    }
  }

  // Color extraction
  const colorTerms = [
    'amber gold', 'emerald green', 'sapphire blue', 'midnight indigo', 'ruby red',
    'sunset orange', 'pastel pink', 'lavender purple', 'matte black', 'iridescent pearl',
    'terracotta', 'forest moss', 'crimson', 'turquoise', 'gold filigree'
  ];
  const detectedColors: string[] = [];
  for (const col of colorTerms) {
    if (lowerPrompt.includes(col)) {
      detectedColors.push(col);
    }
  }
  const primaryColor = detectedColors[0] || (lowerPrompt.includes('gold') ? 'Gold' : lowerPrompt.includes('blue') ? 'Blue' : 'Multicolor');
  const secondaryColor = detectedColors[1] || (lowerPrompt.includes('black') ? 'Black' : lowerPrompt.includes('amber') ? 'Amber' : 'Dark Blue');

  // Mood extraction
  const detectedMood = lowerPrompt.includes('serene') || lowerPrompt.includes('peaceful') || lowerPrompt.includes('sleeping')
    ? 'Serene, Mystical, and Calming'
    : lowerPrompt.includes('dark') || lowerPrompt.includes('gothic')
    ? 'Moody, Gothic, and Atmospheric'
    : lowerPrompt.includes('cyber') || lowerPrompt.includes('neon')
    ? 'Futuristic, High-Energy, and Bold'
    : 'Vibrant, Expressive, and Decorative';

  // Capitalize subject for Title
  const capitalizedSubject = detectedSubject
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Formulate natural, high-SEO Title under 140 chars
  const title = `${capitalizedSubject} Phone Case | ${detectedStyle} Protective Tough Cover for iPhone 16 15 Pro Max & Samsung S25`.slice(0, 140).trim();

  // Short description
  const shortDescription = `Wrap your phone in the enchanting beauty of this ${detectedStyle.toLowerCase()} ${detectedSubject} design, offering heavy-duty dual-layer protection without sacrificing artistic style.`;

  // Full description
  const description = [
    `Elevate your device with this distinctive ${detectedSubject} phone case, showcasing high-definition ${detectedStyle.toLowerCase()} artwork inspired by ${niche || 'fine craftsmanship'}.`,
    '',
    '✨ DESIGN & ARTWORK',
    `• Featuring an original ${detectedStyle.toLowerCase()} composition with vivid ${primaryColor.toLowerCase()} and ${secondaryColor.toLowerCase()} tones.`,
    `• Mood & aesthetic: ${detectedMood}.`,
    '• Crisp, edge-to-edge full-bleed sublimation print that wraps around corners without fading or peeling.',
    '',
    '📱 TOUGH PHONE CASE FEATURES',
    '• Dual-Layer Defense: Impact-resistant polycarbonate outer shell + shock-absorbing TPU inner liner.',
    '• Raised Bezel: Raised lip protects your front glass screen and camera lenses from flat-surface scratches.',
    '• Wireless Charging: Full support for Qi wireless charging without removing the case.',
    '• Tactile responsive button covers and precision laser-cut port openings.',
    '',
    '🎨 AESTHETIC & PALETTE',
    `• Primary Colors: ${primaryColor}, ${secondaryColor}.`,
    `• Style category: ${detectedStyle}, Botanical, Decorative Arts.`,
    '',
    '🎁 PERFECT GIFT IDEA',
    `• An ideal gift for art lovers, ${detectedSubject} enthusiasts, nature lovers, or anyone who appreciates detailed aesthetic accessories.`,
    '• Great for birthdays, holidays, graduations, anniversaries, or treating yourself.',
    '',
    '📦 SPECIFICATIONS',
    '• Available for Apple iPhone 16/15/14 series and Samsung Galaxy S25/S24 series.',
    '• Glossy or satin premium protective finish.',
    '• Made to order with premium inspection before dispatch.',
  ].join('\n');

  // Search terms & tags
  const rawTagSeeds = [
    `${detectedSubject.slice(0, 15)} case`,
    `${detectedStyle.slice(0, 14)} case`,
    `${detectedSubject.slice(0, 14)} cover`,
    `${primaryColor.toLowerCase().slice(0, 14)} phone case`,
    'iphone 16 pro case',
    'iphone 15 pro max',
    'samsung s25 case',
    'tough phone case',
    'aesthetic art case',
    'nature lover gift',
    'unique phone cover',
    'art phone case',
    'protective case',
  ];

  const tags = ensureThirteenEtsyTags(rawTagSeeds, [
    'phone case gift',
    'designer case',
    'botanical cover',
    'celestial case',
  ]);

  const primaryKeywords = [
    `${detectedSubject} phone case`,
    `${detectedStyle} case`,
    'tough phone case',
    'iphone 16 pro max case',
    'samsung galaxy cover',
  ];

  const longTailKeywords = [
    `aesthetic ${detectedSubject} tough phone case`,
    `${detectedStyle.toLowerCase()} protective phone cover`,
    `unique ${primaryColor.toLowerCase()} phone case art`,
    `shockproof ${detectedSubject} iphone case`,
    `${detectedSubject} gift for her`,
  ];

  const relevantSearchTerms = [
    `${detectedSubject} case iphone`,
    `${detectedStyle} phone cover`,
    'durable aesthetic phone case',
    'artistic phone case gift',
    'dual layer tough phone case',
  ];

  const extractedConcepts: ExtractedDesignConcepts = {
    subject: capitalizedSubject,
    artStyle: detectedStyle,
    theme: niche || `${capitalizedSubject} Decorative Art`,
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      palette: [primaryColor, secondaryColor, 'Black', 'Gold'],
    },
    mood: detectedMood,
    elements: [detectedSubject, 'Decorative frame', 'Nature motifs', 'Vibrant glass textures'],
    targetAudience: ['Art enthusiasts', 'Wildlife lovers', 'Aesthetic tech trendsetters', 'Gift shoppers'],
    giftOccasions: ['Birthday Gift', 'Holiday Present', 'Graduation', 'Self-care accessory'],
  };

  const suggestedAttributes: SuggestedProductAttributes = {
    category: 'Electronics Cases',
    categoryPath: ['Electronics & Accessories', 'Cases & Covers', 'Phone Cases', 'Tough Cases'],
    primaryColor,
    secondaryColor,
    artStyle: detectedStyle,
    theme: niche || 'Nature & Decorative Art',
    subject: capitalizedSubject,
    recipient: 'Art Lover, Tech Enthusiast, Nature Lover',
    occasion: 'Everyday, Birthday, Anniversary',
    finish: 'Glossy Full-Wrap',
    material: 'Polycarbonate & Shock-Absorbing TPU',
    compatibleDevices: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 15 Pro Max', 'Samsung Galaxy S25 Ultra'],
  };

  const personalizationSuggestions = [
    'Optional custom name or monogram centered at the base',
    'Selectable matte or high-gloss protective finish',
    'Custom device model compatibility on request',
  ];

  const seoRecommendations: SeoRecommendations = {
    primarySearchQuery: `${detectedSubject} phone case`,
    longTailStrategy: `Target shoppers combining subject ("${detectedSubject}"), art style ("${detectedStyle}"), and protective device features ("tough dual layer case").`,
    searchIntentSummary: 'High-intent gift and aesthetic buyers seeking durable protection paired with gallery-quality illustration.',
    conversionAdvice: 'Lead with visual craftsmanship in images and highlight drop-protection specs in the first paragraph to address both aesthetic and durability buyer concerns.',
    keywordRationale: 'Balancing high-volume keywords (iPhone case, tough case) with low-competition, high-converting long-tail design queries.',
  };

  return {
    title,
    shortDescription,
    description,
    tags,
    primaryKeywords,
    longTailKeywords,
    relevantSearchTerms,
    searchIntent: relevantSearchTerms,
    suggestedAttributes,
    relevantCategories: [
      'Electronics & Accessories > Cases & Covers > Phone Cases',
      'Art & Collectibles > Prints > Digital Prints',
    ],
    personalizationSuggestions,
    seoRecommendations,
    extractedConcepts,
    category: 'Electronics Cases',
    primaryColor,
    secondaryColor,
    designStyle: [detectedStyle],
    occasion: 'Everyday / Gift',
    targetCustomer: extractedConcepts.targetAudience,
    keywordRationale: seoRecommendations.keywordRationale,
  };
}

/**
 * Generate SEO Keywords, Catchy Title, and Full Listing Metadata using Gemini 3.8 Flash.
 * Uses the user's design prompt as the primary source of truth!
 */
export async function generateKeywordsAndTitle(options: {
  prompt: string;
  designTitle?: string;
  niche?: string;
  imageDataUrl?: string;
}): Promise<GeneratedMetadata> {
  const ai = getGeminiClient();
  const { prompt, designTitle = '', niche = '', imageDataUrl } = options;
  const cleanTitle = sanitizeTitleString(designTitle);
  const cleanPrompt = (prompt || '').trim();

  if (!ai) {
    return extractSmartListingFallback(cleanPrompt, cleanTitle, niche);
  }

  const systemInstruction = `You are a world-class Etsy E-Commerce & SEO Specialist for handcrafted and print-on-demand aesthetic phone cases.

Your task is to analyze the provided DESIGN PROMPT (and optional artwork image) to produce a COMPLETE, high-converting, SEO-optimized Etsy listing.

CRITICAL RULES:
1. THE DESIGN PROMPT IS YOUR PRIMARY SOURCE OF TRUTH:
   Extract all specific details from the prompt:
   - Specific Subject / Creature / Hero figure
   - Art Style (e.g. cathedral stained glass / vitrail, vintage botanical watercolor, cyberpunk neon, art nouveau, synthwave, gothic lineart)
   - Theme (e.g. woodland wildlife, celestial cosmos, dark academia, retro 80s, fantasy folklore)
   - Specific Color Palette (primary, secondary, and accent colors mentioned or implied)
   - Mood / Atmosphere (e.g. serene, mystical, gritty, dreamy, vibrant)
   - Specific Objects / Elements (e.g. sleeping red fox, fly agaric mushrooms, sunburst halo, crescent moon, oak leaves, gold filigree)
   - Target Audience (e.g. fox lovers, cottagecore fans, witchy aesthetic enthusiasts, tech trendsetters)
   - Potential Gift Occasions (e.g. Birthday, Christmas, Mother's Day, Anniversary)

2. ABSOLUTELY NO GENERIC TITLES OR KEYWORDS:
   Do NOT generate generic phrases like "Nice Phone Case", "Cool Pattern Cover", "Phone Case Art".
   Every keyword, title word, and tag MUST directly represent the exact design described in the prompt.

3. PRODUCT TITLE CONSTRAINTS:
   - Natural, highly readable, buyer-friendly format.
   - Maximum 140 characters.
   - Place the primary design subject, style, and top search intent first.
   - Avoid keyword stuffing, unnatural pipes, or excessive repetition.

4. 13 ETSY SEARCH TAGS:
   - Provide EXACTLY 13 distinct Etsy tags.
   - Every single tag MUST be 20 characters or fewer.
   - Multi-word search phrases that buyers actually type into Etsy search (e.g. "stained glass fox", "vitrail phone case", "fox lover gift", "woodland phone case", "celestial art cover").
   - No duplicate tags, no punctuation/symbols except spaces and hyphens.

5. PRODUCT DESCRIPTION CONSTRAINTS:
   - Beautiful, persuasive, customer-focused structure with clear formatting:
     - 1-2 sentence compelling opening hook with top keywords
     - ✨ DESIGN & ARTWORK: Detail the exact artwork, style, motifs, and composition from the prompt.
     - 📱 TOUGH PHONE CASE FEATURES: Explain the dual-layer protection (polycarbonate shell + TPU liner), raised screen/camera bezels, full-bleed wrap print, and Qi wireless charging compatibility.
     - 🎨 AESTHETIC & PALETTE: Highlight the color harmony, mood, and visual vibe.
     - 🎁 GIFT IDEA & OCCASIONS: Suggest thoughtful gift ideas based on the subject and theme.
     - 📦 PRODUCT SPECIFICATIONS: Supported phone models (iPhone 16/15 Pro Max, Samsung Galaxy S25 Ultra, etc.), glossy/matte finish options, made-to-order quality.

6. PERSONALIZATION SUGGESTIONS:
   - Provide practical ideas if a customer requests customization (e.g. custom monogram, name plate, color tint preference, or "Standard non-personalized full-bleed art").

7. SEO RECOMMENDATIONS:
   - Clear strategic advice on why these keywords were chosen, how to rank in organic search, and how to maximize buyer click-through rate.`;

  const userPromptContent = `Please analyze this phone case design prompt and create the complete Etsy listing:

========================================
DESIGN PROMPT:
${cleanPrompt || 'Phone case graphic artwork'}

DESIGN TITLE:
${cleanTitle || 'Custom Phone Case Artwork'}

NICHE / ART THEME:
${niche || 'Phone Case Art'}
========================================

Analyze the exact prompt content above to extract the subject, style, colors, mood, elements, audience, and gift occasions, then generate the full JSON structure.`;

  const parts: any[] = [{ text: userPromptContent }];

  if (imageDataUrl) {
    const match = imageDataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of candidateModels) {
    try {
      const response = await generateContentWithRetry(ai, {
        model,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productTitle: { type: Type.STRING, description: 'Readable, natural SEO title max 140 chars' },
              shortDescription: { type: Type.STRING, description: '1-2 sentence hook for search snippet and overview' },
              productDescription: { type: Type.STRING, description: 'Full formatted Etsy description' },
              etsyTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 13 unique Etsy tags, max 20 chars each',
              },
              primaryKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 high-volume core search terms',
              },
              longTailKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 specific long-tail buyer queries',
              },
              relevantSearchTerms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 relevant search queries used by shoppers',
              },
              suggestedAttributes: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  categoryPath: { type: Type.ARRAY, items: { type: Type.STRING } },
                  primaryColor: { type: Type.STRING },
                  secondaryColor: { type: Type.STRING },
                  artStyle: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  recipient: { type: Type.STRING },
                  occasion: { type: Type.STRING },
                  finish: { type: Type.STRING },
                  material: { type: Type.STRING },
                  compatibleDevices: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'category',
                  'categoryPath',
                  'primaryColor',
                  'secondaryColor',
                  'artStyle',
                  'theme',
                  'subject',
                  'recipient',
                  'occasion',
                  'finish',
                  'material',
                  'compatibleDevices',
                ],
              },
              relevantCategories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Etsy categories taxonomy hierarchy',
              },
              personalizationSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Personalization and custom options',
              },
              seoRecommendations: {
                type: Type.OBJECT,
                properties: {
                  primarySearchQuery: { type: Type.STRING },
                  longTailStrategy: { type: Type.STRING },
                  searchIntentSummary: { type: Type.STRING },
                  conversionAdvice: { type: Type.STRING },
                  keywordRationale: { type: Type.STRING },
                },
                required: [
                  'primarySearchQuery',
                  'longTailStrategy',
                  'searchIntentSummary',
                  'conversionAdvice',
                  'keywordRationale',
                ],
              },
              extractedConcepts: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  artStyle: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  colors: {
                    type: Type.OBJECT,
                    properties: {
                      primary: { type: Type.STRING },
                      secondary: { type: Type.STRING },
                      palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['primary', 'secondary', 'palette'],
                  },
                  mood: { type: Type.STRING },
                  elements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                  giftOccasions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'subject',
                  'artStyle',
                  'theme',
                  'colors',
                  'mood',
                  'elements',
                  'targetAudience',
                  'giftOccasions',
                ],
              },
            },
            required: [
              'productTitle',
              'shortDescription',
              'productDescription',
              'etsyTags',
              'primaryKeywords',
              'longTailKeywords',
              'relevantSearchTerms',
              'suggestedAttributes',
              'relevantCategories',
              'personalizationSuggestions',
              'seoRecommendations',
              'extractedConcepts',
            ],
          },
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      if (parsed && parsed.productTitle) {
        const rawTags: string[] = Array.isArray(parsed.etsyTags) ? parsed.etsyTags : [];
        const primaryKws: string[] = Array.isArray(parsed.primaryKeywords) ? parsed.primaryKeywords : [];
        const longTailKws: string[] = Array.isArray(parsed.longTailKeywords) ? parsed.longTailKeywords : [];
        const validatedTags = ensureThirteenEtsyTags(rawTags, [...primaryKws, ...longTailKws]);

        const title = (parsed.productTitle || '').slice(0, 140).trim();
        const shortDescription =
          parsed.shortDescription ||
          `Stunning ${parsed.extractedConcepts?.artStyle || 'artistic'} phone case featuring ${parsed.extractedConcepts?.subject || 'unique design'}, engineered for heavy-duty dual-layer protection.`;
        const description = parsed.productDescription || '';

        const attrs: SuggestedProductAttributes = {
          category: parsed.suggestedAttributes?.category || 'Electronics Cases',
          categoryPath: Array.isArray(parsed.suggestedAttributes?.categoryPath)
            ? parsed.suggestedAttributes.categoryPath
            : ['Electronics & Accessories', 'Cases & Covers', 'Phone Cases'],
          primaryColor: parsed.suggestedAttributes?.primaryColor || parsed.extractedConcepts?.colors?.primary || 'Multicolor',
          secondaryColor: parsed.suggestedAttributes?.secondaryColor || parsed.extractedConcepts?.colors?.secondary || 'Black',
          artStyle: parsed.suggestedAttributes?.artStyle || parsed.extractedConcepts?.artStyle || 'Contemporary Art',
          theme: parsed.suggestedAttributes?.theme || parsed.extractedConcepts?.theme || niche || 'Artistic Phone Cases',
          subject: parsed.suggestedAttributes?.subject || parsed.extractedConcepts?.subject || cleanTitle || 'Illustrated Art',
          recipient: parsed.suggestedAttributes?.recipient || (Array.isArray(parsed.extractedConcepts?.targetAudience) ? parsed.extractedConcepts.targetAudience.join(', ') : 'Art Lover, Tech Enthusiast'),
          occasion: parsed.suggestedAttributes?.occasion || (Array.isArray(parsed.extractedConcepts?.giftOccasions) ? parsed.extractedConcepts.giftOccasions.join(', ') : 'Birthday, Everyday Gift'),
          finish: parsed.suggestedAttributes?.finish || 'Glossy Full Wrap',
          material: parsed.suggestedAttributes?.material || 'Polycarbonate & TPU Shock Lining',
          compatibleDevices: Array.isArray(parsed.suggestedAttributes?.compatibleDevices) && parsed.suggestedAttributes.compatibleDevices.length > 0
            ? parsed.suggestedAttributes.compatibleDevices
            : ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 15 Pro Max', 'Samsung Galaxy S25 Ultra'],
        };

        const extracted: ExtractedDesignConcepts = {
          subject: parsed.extractedConcepts?.subject || cleanTitle || 'Artistic Subject',
          artStyle: parsed.extractedConcepts?.artStyle || 'Original Artwork',
          theme: parsed.extractedConcepts?.theme || niche || 'Art Illustration',
          colors: {
            primary: parsed.extractedConcepts?.colors?.primary || attrs.primaryColor,
            secondary: parsed.extractedConcepts?.colors?.secondary || attrs.secondaryColor,
            palette: Array.isArray(parsed.extractedConcepts?.colors?.palette)
              ? parsed.extractedConcepts.colors.palette
              : [attrs.primaryColor, attrs.secondaryColor],
          },
          mood: parsed.extractedConcepts?.mood || 'Aesthetic and striking',
          elements: Array.isArray(parsed.extractedConcepts?.elements) ? parsed.extractedConcepts.elements : ['Central artwork', 'Border detail'],
          targetAudience: Array.isArray(parsed.extractedConcepts?.targetAudience) ? parsed.extractedConcepts.targetAudience : ['Art enthusiasts', 'Tech lovers'],
          giftOccasions: Array.isArray(parsed.extractedConcepts?.giftOccasions) ? parsed.extractedConcepts.giftOccasions : ['Birthday', 'Holidays'],
        };

        const seoRecs: SeoRecommendations = {
          primarySearchQuery: parsed.seoRecommendations?.primarySearchQuery || `${extracted.subject} phone case`,
          longTailStrategy: parsed.seoRecommendations?.longTailStrategy || `Targeting ${extracted.artStyle.toLowerCase()} lovers looking for durable ${extracted.subject.toLowerCase()} cases.`,
          searchIntentSummary: parsed.seoRecommendations?.searchIntentSummary || 'Shoppers seeking distinctive, non-generic illustrated phone cases with durable drop protection.',
          conversionAdvice: parsed.seoRecommendations?.conversionAdvice || 'Showcase the edge-to-edge full bleed artwork in lifestyle photography and emphasize the raised camera guard.',
          keywordRationale: parsed.seoRecommendations?.keywordRationale || `High-intent SEO optimized specifically for ${extracted.subject} and ${extracted.artStyle}.`,
        };

        return {
          title,
          shortDescription,
          description,
          tags: validatedTags,
          primaryKeywords: primaryKws,
          longTailKeywords: longTailKws,
          relevantSearchTerms: Array.isArray(parsed.relevantSearchTerms) ? parsed.relevantSearchTerms : primaryKws,
          searchIntent: Array.isArray(parsed.relevantSearchTerms) ? parsed.relevantSearchTerms : primaryKws,
          suggestedAttributes: attrs,
          relevantCategories: Array.isArray(parsed.relevantCategories) && parsed.relevantCategories.length > 0
            ? parsed.relevantCategories
            : ['Electronics & Accessories > Cases & Covers > Phone Cases'],
          personalizationSuggestions: Array.isArray(parsed.personalizationSuggestions) && parsed.personalizationSuggestions.length > 0
            ? parsed.personalizationSuggestions
            : ['Add optional custom initials or name', 'Choose between glossy and matte finish'],
          seoRecommendations: seoRecs,
          extractedConcepts: extracted,
          category: attrs.category,
          primaryColor: attrs.primaryColor,
          secondaryColor: attrs.secondaryColor,
          designStyle: [extracted.artStyle],
          occasion: attrs.occasion,
          targetCustomer: extracted.targetAudience,
          keywordRationale: seoRecs.keywordRationale,
        };
      }
    } catch {
      // Continue to next candidate model or fallback
    }
  }

  // Resilient fallback if AI call encounters transient issue
  return extractSmartListingFallback(cleanPrompt, cleanTitle, niche);
}

/**
 * Fetch a high-resolution 2D graphic artwork using the free engine.
 */
export async function generateFreeImage(
  prompt: string,
  aspectRatio: '9:16' | '1:1' | '3:4' | '4:3' | '16:9' = '9:16',
  seed?: number
): Promise<{ imageUrl: string; width: number; height: number; provider: string }> {
  const dimensions = {
    '9:16': { width: 768, height: 1344 },
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '16:9': { width: 1344, height: 768 },
  }[aspectRatio] || { width: 768, height: 1344 };

  const chosenSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1_000_000_000);
  const cleanPrompt = prompt.replace(/\s+/g, ' ').trim().slice(0, 1500);

  // Use Pollinations free AI image endpoint
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    cleanPrompt
  )}?width=${dimensions.width}&height=${dimensions.height}&seed=${chosenSeed}&nologo=true`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    throw new Error(`Free image generation failed with status ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString('base64');
  const mimeType = res.headers.get('content-type') || 'image/jpeg';

  return {
    imageUrl: `data:${mimeType};base64,${base64}`,
    width: dimensions.width,
    height: dimensions.height,
    provider: 'Free AI Engine',
  };
}
