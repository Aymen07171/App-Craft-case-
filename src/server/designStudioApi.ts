import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  getGeminiClient,
  generateKeywordsAndTitle,
  generateFreeImage,
  generateContentWithRetry,
} from './geminiService';
import {
  describeHuggingFaceImageError,
  generateHuggingFaceImage,
  getQuotaStatus,
  hasHuggingFaceImageFallback,
  isGeminiQuotaError,
} from './imageGenerationFallback';

const router = express.Router();

async function resolveToDataUrl(imageUrl?: string): Promise<string | undefined> {
  if (!imageUrl || typeof imageUrl !== 'string') return undefined;
  if (/^data:image\/(?:png|jpe?g|webp|svg\+xml);base64,/i.test(imageUrl)) {
    return imageUrl;
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const mime = res.headers.get('content-type') || 'image/jpeg';
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch (err) {
      console.warn('Failed to fetch remote image in resolveToDataUrl:', err);
    }
  }
  if (imageUrl.startsWith('/') || imageUrl.startsWith('./') || imageUrl.startsWith('src/') || imageUrl.startsWith('public/')) {
    const cleanPath = imageUrl.replace(/^\.\//, '').replace(/^\//, '');
    const possiblePaths = [
      path.join(process.cwd(), cleanPath),
      path.join(process.cwd(), 'public', cleanPath),
      path.join('/app/applet', cleanPath),
      path.join('/app/applet/public', cleanPath),
      path.resolve(cleanPath),
      path.resolve('public', cleanPath),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
          return `data:${mime};base64,${buf.toString('base64')}`;
        } catch {
          // ignore
        }
      }
    }
  }
  return undefined;
}

// Fallback curated suggestions per common placeholder tag
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  SUBJECT_POSE: [
    'celestial kitsune blade dancer soaring through golden clouds',
    'armored cyber samurai preparing an unsheathing strike',
    'ancient forest guardian stag crowned with blooming wisteria',
    'moonlit valkyrie warrior brandishing a spear of pure starlight',
    'neon streetwear ronin standing on a rain-drenched neon overpass',
    'winged anime oracle clutching a glowing celestial astrolabe',
  ],
  BOTANICAL: [
    'cherry blossoms dancing across swirling iridescent wind trails',
    'delicate spider lilies with creeping thorny vines',
    'golden ginkgo leaves descending into a radiant pool of starlight',
    'bioluminescent neon moss entwined with weeping willow fronds',
    'art nouveau lotus blossoms with serpentine gilded stems',
    'cascading midnight jasmine and deep indigo bellflowers',
  ],
  COMPANION: [
    'spirit fox with nine swirling azure flame tails',
    'cybernetic scout falcon with glowing geometric wings',
    'ethereal jade koi gliding effortlessly through mid-air stardust',
    'golden scarab beetle with wings encrusted in luminous lapis',
    'shadow dragon whelp curling softly around a celestial orb',
    'crystallized origami crane with faint prism light trails',
  ],
  COLOR_PALETTE: [
    'deep sapphire indigo, molten gold, crimson scarlet, and ethereal cyan',
    'neon magenta, electric cyan, midnight charcoal, and acid yellow',
    'burnished antique gold, velvety sage green, and obsidian black',
    'pastel sunset peach, lavender dusk, warm cream, and iridescent opal',
    'deep emerald pine, champagne bronze, and rich burgundy wine',
    'monochrome graphite with radiant liquid gold accents',
  ],
  BORDER_THEME: [
    'ornate art nouveau brass filigree with constellation charts',
    'tactical holographic telemetry frame with neon corner brackets',
    'gothic cathedral pointed stained-glass arch with trefoil relief',
    'infinite synthwave perspective wireframe horizon with retro grids',
    'celestial zodiac wheel with gilded lunar phase cycles',
    'clean modern double-line gold leaf border with crosshair corners',
  ],
};

// API: Generate design artwork with free Gemini API + Title & Keywords
router.post('/generate-design', async (req, res) => {
  const { prompt, aspectRatio = '9:16', seed, niche = '' } = req.body || {};
  const allowedRatios = ['9:16', '1:1', '3:4', '4:3', '16:9'] as const;
  const requestedRatio = String(aspectRatio);
  const ratio = (allowedRatios as readonly string[]).includes(requestedRatio)
    ? (requestedRatio as (typeof allowedRatios)[number])
    : '9:16';
  const variation = Number.isFinite(Number(seed)) ? Number(seed) : Math.floor(Math.random() * 1_000_000_000);

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const dimensions: Record<(typeof allowedRatios)[number], { width: number; height: number }> = {
    '9:16': { width: 768, height: 1344 },
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '16:9': { width: 1344, height: 768 },
  };

  const { width, height } = dimensions[ratio];

  // 1. Generate intelligent Title & Keywords using Gemini 3.8 Flash
  let aiTitle = `${niche || 'Original'} Phone Case Art`;
  let aiKeywords: string[] = [];

  try {
    const meta = await generateKeywordsAndTitle({
      prompt: prompt.trim(),
      niche,
    });
    if (meta.title) aiTitle = meta.title;
    if (meta.primaryKeywords?.length) aiKeywords = meta.primaryKeywords;
  } catch (metaErr) {
    console.warn('Metadata generation with Gemini skipped:', metaErr);
  }

  // 2. Image Generation: Try Gemini 3.1 Flash Lite Image first, then free AI engine
  const ai = getGeminiClient();
  let generatedImageUrl: string | null = null;
  let providerName = 'Gemini AI';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: `Create original, polished phone-case artwork from this brief. Make the artwork edge-to-edge, visually clear, and free of text, logos, watermarks, mockup devices, or borders unless explicitly requested.\n\n${prompt.trim()}\n\nComposition variation: ${variation}.`,
        config: { imageConfig: { aspectRatio: ratio } },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
      if (imagePart?.inlineData?.data) {
        generatedImageUrl = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
        providerName = 'Gemini Image';
      }
    } catch (geminiErr: any) {
      console.info('Gemini image generation unavailable or quota limit reached, switching to free engine...');
    }
  }

  // 3. Fallback to free image generation if Gemini image quota is 0 or unavailable
  if (!generatedImageUrl) {
    try {
      if (hasHuggingFaceImageFallback()) {
        const hf = await generateHuggingFaceImage(prompt.trim(), ratio, variation);
        generatedImageUrl = hf.imageUrl;
        providerName = 'Hugging Face';
      } else {
        const freeImg = await generateFreeImage(prompt.trim(), ratio, variation);
        generatedImageUrl = freeImg.imageUrl;
        providerName = 'Free AI Engine (Gemini Powered)';
      }
    } catch (fallbackErr: any) {
      console.error('All image generation methods failed:', fallbackErr);
      return res.status(502).json({
        error: `Image generation failed: ${fallbackErr.message || 'Please check your connection and try again.'}`,
      });
    }
  }

  return res.json({
    imageUrl: generatedImageUrl,
    title: aiTitle,
    keywords: aiKeywords,
    seed: variation,
    width,
    height,
    aspectRatio: ratio,
    provider: providerName,
  });
});

// API: Direct Keywords & Title Generator using Gemini 3.8 Flash
router.post('/generate-keywords-title', async (req, res) => {
  try {
    const { prompt, designTitle, niche, imageDataUrl } = req.body || {};
    if (!prompt && !imageDataUrl) {
      return res.status(400).json({ error: 'Either prompt or imageDataUrl is required.' });
    }

    const metadata = await generateKeywordsAndTitle({
      prompt: prompt || 'Phone case graphic artwork',
      designTitle,
      niche,
      imageDataUrl,
    });

    return res.json(metadata);
  } catch (error: any) {
    console.error('Error in generate-keywords-title:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate keywords and title with Gemini.',
    });
  }
});

// API: Placeholder suggestions with Gemini 3.8 Flash and curated fallbacks
router.post('/suggest-values', async (req, res) => {
  try {
    const { placeholder, niche, currentPrompt } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      const promptContent = `You are a creative director for graphic illustration and print artwork.
For the placeholder tag "${placeholder}" in the niche "${niche}" (context: "${currentPrompt || ''}"):
Provide 6 vivid, creative, unique options to fill this placeholder.
Return ONLY a valid JSON array of 6 short strings, for example: ["option 1", "option 2", "option 3", "option 4", "option 5", "option 6"]. Do not include any other markdown or commentary.`;

      for (const modelName of candidateModels) {
        try {
          const response = await generateContentWithRetry(ai, {
            model: modelName,
            contents: promptContent,
            config: { responseMimeType: 'application/json', temperature: 0.8 },
          });

          const parsed = JSON.parse((response.text || '[]').replace(/```json\s*|```/gi, '').trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanSuggestions = parsed
              .map((item) => (typeof item === 'string' ? item : item.idea || item.title || JSON.stringify(item)))
              .filter(Boolean)
              .slice(0, 6);
            if (cleanSuggestions.length > 0) {
              return res.json({ suggestions: cleanSuggestions });
            }
          }
        } catch {
          // Try next model candidate
        }
      }
    }

    // Default curated fallback if API call fails
    const key = (placeholder || '').toUpperCase().trim();
    const suggestions = FALLBACK_SUGGESTIONS[key] || [
      `radiant ${placeholder} infused with celestial energy`,
      `intricate dynamic ${placeholder} with fine details`,
      `ethereal glowing ${placeholder} in motion`,
      `stylized minimalist ${placeholder} with bold lines`,
      `ornate vintage ${placeholder} with gilded accents`,
      `cybernetic high-tech ${placeholder} with neon pulses`,
    ];

    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error suggesting values:', error);
    return res.status(500).json({ suggestions: [] });
  }
});

// API: Full Etsy listing generation powered by Gemini 3.8 Flash
router.post('/generate-etsy-listing', async (req, res) => {
  const { prompt, imageDataUrl, designTitle, niche } = req.body || {};
  const resolvedImageData = await resolveToDataUrl(imageDataUrl);

  try {
    const meta = await generateKeywordsAndTitle({
      prompt: (prompt || '').trim() || 'Phone case graphic artwork',
      designTitle: typeof designTitle === 'string' ? designTitle : '',
      niche: typeof niche === 'string' ? niche : '',
      imageDataUrl: resolvedImageData,
    });

    const listing = {
      productTitle: meta.title,
      title: meta.title,
      shortDescription: meta.shortDescription,
      productDescription: meta.description,
      description: meta.description,
      primaryKeywords: meta.primaryKeywords,
      longTailKeywords: meta.longTailKeywords,
      etsyTags: meta.tags,
      tags: meta.tags,
      relevantSearchTerms: meta.relevantSearchTerms,
      suggestedAttributes: meta.suggestedAttributes,
      relevantCategories: meta.relevantCategories,
      personalizationSuggestions: meta.personalizationSuggestions,
      seoRecommendations: meta.seoRecommendations,
      extractedConcepts: meta.extractedConcepts,
      category: meta.category,
      primaryColor: meta.primaryColor,
      secondaryColor: meta.secondaryColor,
      occasion: meta.occasion,
      targetCustomer: meta.targetCustomer,
      designStyle: meta.designStyle,
      searchIntent: meta.searchIntent,
      keywordRationale: meta.keywordRationale,
    };

    return res.json({ listing });
  } catch (error: any) {
    console.error('Error generating Etsy listing with Gemini:', error);
    return res.status(502).json({
      error: `Gemini listing generation failed: ${error?.message || 'Please retry.'}`,
    });
  }
});

export default router;
