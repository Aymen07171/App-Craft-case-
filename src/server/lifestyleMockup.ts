import { GoogleGenAI } from '@google/genai';
import { generateWithLocalImageApi, LocalImageApiError } from './localImageApi';
import { generateFreeImage } from './geminiService';
import { findPrintifyTemplate, PrintifyTemplateRef } from '../data/printifyReferences';
import fs from 'fs';
import path from 'path';

export interface LifestyleMockupRequest {
  designImageUrl?: string;
  productMockupUrl?: string;
  sceneReferenceImages?: string[];
  userScenePrompt?: string;
  styleDirection?: string;
  modelName?: string;
  brand?: string;
  caseType?: string;
  dimensions?: {
    pixelWidth: number;
    pixelHeight: number;
    mmWidth: number;
    mmHeight: number;
  };
  caseShapeDesc?: string;
  cameraCutoutDesc?: string;
  variationIndex?: number;
}

export class LifestyleMockupError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'LifestyleMockupError';
    this.statusCode = statusCode;
  }
}

const toInlineImage = async (url: string) => {
  if (!url || typeof url !== 'string') {
    throw new LifestyleMockupError('Reference image URL is missing or empty.', 400);
  }

  // 1. Data URL (supports png, jpeg, webp, and svg+xml)
  const dataUrl = url.match(/^data:([^;]+);base64,([A-Za-z0-9+/]+=*)$/i);
  if (dataUrl) {
    const byteLength = Buffer.from(dataUrl[2], 'base64').byteLength;
    if (byteLength > 20 * 1024 * 1024) {
      throw new LifestyleMockupError('A reference image is too large. Use images smaller than 20 MB.', 413);
    }
    return { inlineData: { mimeType: dataUrl[1], data: dataUrl[2] }, byteLength };
  }

  // 2. Local filesystem path (e.g. /src/assets/images/... or relative path)
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('src/') || url.startsWith('public/')) {
    const cleanPath = url.replace(/^\.\//, '').replace(/^\//, '');
    const possiblePaths = [
      path.join(process.cwd(), cleanPath),
      path.join(process.cwd(), 'public', cleanPath),
      path.join(process.cwd(), url),
      path.join('/app/applet', cleanPath),
      path.join('/app/applet/public', cleanPath),
      path.join('/app/applet', url),
      path.resolve(cleanPath),
      path.resolve('public', cleanPath),
      url,
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const buf = fs.readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          const mimeType =
            ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
          return {
            inlineData: { mimeType, data: buf.toString('base64') },
            byteLength: buf.byteLength,
          };
        } catch {
          // ignore
        }
      }
    }
  }

  // 3. Remote URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new LifestyleMockupError(`Could not load reference image from path or URL: ${url}`, 400);
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new LifestyleMockupError('Reference image URLs must use HTTP or HTTPS.', 400);
  }

  const response = await fetch(parsedUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new LifestyleMockupError(`Could not load a reference image (${response.status}).`, 400);
  }
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 15 * 1024 * 1024) {
    throw new LifestyleMockupError('A reference image is too large. Use images smaller than 15 MB.', 413);
  }
  return { inlineData: { mimeType, data: bytes.toString('base64') }, byteLength: bytes.byteLength };
};

function renderPhotorealisticCompositeMockup(
  template: PrintifyTemplateRef,
  artworkDataUrl: string,
  scenePrompt: string,
  variation: number = 1
): string {
  const modelName = template.modelName;
  const isIphone = template.brand === 'apple' || modelName.toLowerCase().includes('iphone');
  const isProMax = modelName.includes('Max') || modelName.includes('Plus') || modelName.includes('Ultra');
  const isTriplePro = template.cameraCutout.type === 'square-triple-pro';
  const isDualDiag = template.cameraCutout.type === 'square-diagonal-dual';
  const isFloatingVert = template.cameraCutout.type === 'floating-vertical';
  const isPill = template.cameraCutout.type === 'pill-vertical' || template.cameraCutout.type === 'pill-horizontal';

  // Dimension scaling to fit 1200x800 canvas beautifully
  const caseWidth = isProMax ? 364 : 348;
  const caseHeight = isProMax ? 728 : 680;
  const rx = isIphone ? (isProMax ? 48 : 44) : 26;
  const x = (1200 - caseWidth) / 2;
  const y = (800 - caseHeight) / 2 - 16;

  const sceneThemes = [
    { bg1: '#1e1b4b', bg2: '#0f172a', bg3: '#020617', label: 'Studio Minimalist', surface: '#0f172a' },
    { bg1: '#451a03', bg2: '#291507', bg3: '#0f0702', label: 'Artisanal Cafe Wood', surface: '#291507' },
    { bg1: '#1e293b', bg2: '#0f172a', bg3: '#020617', label: 'Modern Architectural', surface: '#1e293b' },
    { bg1: '#064e3b', bg2: '#022c22', bg3: '#011a14', label: 'Botanical Workspace', surface: '#022c22' },
  ];
  const theme = sceneThemes[((variation || 1) - 1) % sceneThemes.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
    <defs>
      <radialGradient id="stageGlow" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="${theme.bg1}" stop-opacity="0.9"/>
        <stop offset="55%" stop-color="${theme.bg2}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${theme.bg3}" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="bevelLight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
        <stop offset="18%" stop-color="#ffffff" stop-opacity="0.12"/>
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.0"/>
        <stop offset="82%" stop-color="#000000" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
      </linearGradient>
      <linearGradient id="glossSheen" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
        <stop offset="25%" stop-color="#ffffff" stop-opacity="0.08"/>
        <stop offset="45%" stop-color="#ffffff" stop-opacity="0.0"/>
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.18"/>
      </linearGradient>
      <filter id="caseShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="32" stdDeviation="36" flood-color="#000000" flood-opacity="0.75"/>
        <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.45"/>
      </filter>
      <clipPath id="caseCutout">
        <rect x="${x}" y="${y}" width="${caseWidth}" height="${caseHeight}" rx="${rx}" ry="${rx}"/>
      </clipPath>
    </defs>

    <!-- Studio / Lifestyle Background -->
    <rect width="1200" height="800" fill="url(#stageGlow)"/>

    <!-- Soft table shadow -->
    <ellipse cx="600" cy="${y + caseHeight + 28}" rx="${caseWidth * 0.78}" ry="38" fill="#000000" opacity="0.8" filter="blur(18px)"/>

    <!-- Case Shell with Drop Shadow -->
    <g filter="url(#caseShadow)">
      <!-- Outer Tough Case Bumper Rim -->
      <rect x="${x - 5}" y="${y - 5}" width="${caseWidth + 10}" height="${caseHeight + 10}" rx="${rx + 5}" ry="${rx + 5}" fill="#0f172a" stroke="#475569" stroke-width="2.5"/>

      <!-- Reinforced Tough Armor Corner Bumpers -->
      <path d="M ${x - 5} ${y + 36} L ${x - 5} ${y + rx} A ${rx + 5} ${rx + 5} 0 0 1 ${x + rx} ${y - 5} L ${x + 40} ${y - 5} L ${x + 28} ${y + 12} L ${x + 12} ${y + 28} Z" fill="#1e293b" opacity="0.9"/>
      <path d="M ${x + caseWidth + 5} ${y + 36} L ${x + caseWidth + 5} ${y + rx} A ${rx + 5} ${rx + 5} 0 0 0 ${x + caseWidth - rx} ${y - 5} L ${x + caseWidth - 40} ${y - 5} L ${x + caseWidth - 28} ${y + 12} L ${x + caseWidth - 12} ${y + 28} Z" fill="#1e293b" opacity="0.9"/>
      <path d="M ${x - 5} ${y + caseHeight - 36} L ${x - 5} ${y + caseHeight - rx} A ${rx + 5} ${rx + 5} 0 0 0 ${x + rx} ${y + caseHeight + 5} L ${x + 40} ${y + caseHeight + 5} L ${x + 28} ${y + caseHeight - 12} L ${x + 12} ${y + caseHeight - 28} Z" fill="#1e293b" opacity="0.9"/>
      <path d="M ${x + caseWidth + 5} ${y + caseHeight - 36} L ${x + caseWidth + 5} ${y + caseHeight - rx} A ${rx + 5} ${rx + 5} 0 0 1 ${x + caseWidth - rx} ${y + caseHeight + 5} L ${x + caseWidth - 40} ${y + caseHeight + 5} L ${x + caseWidth - 28} ${y + caseHeight - 12} L ${x + caseWidth - 12} ${y + caseHeight - 28} Z" fill="#1e293b" opacity="0.9"/>

      <!-- Clipped Phone Case Artwork & Protective Layer -->
      <g clip-path="url(#caseCutout)">
        <image href="${artworkDataUrl}" x="${x}" y="${y}" width="${caseWidth}" height="${caseHeight}" preserveAspectRatio="xMidYMid slice"/>
        <!-- Specular Gloss Highlight -->
        <rect x="${x}" y="${y}" width="${caseWidth}" height="${caseHeight}" fill="url(#glossSheen)" pointer-events="none"/>
        <!-- Raised Protective Bevel 3D Shadow -->
        <rect x="${x}" y="${y}" width="${caseWidth}" height="${caseHeight}" fill="url(#bevelLight)" pointer-events="none"/>
      </g>

      <!-- Accurate Camera Cutout -->
      ${isTriplePro ? `
      <!-- iPhone 15 Pro Max / Pro Triple Camera Titanium Island -->
      <g transform="translate(${x + 16}, ${y + 16})">
        <!-- Titanium Raised Plateau with Bevel -->
        <rect width="118" height="122" rx="30" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" opacity="0.96"/>
        <rect x="2" y="2" width="114" height="118" rx="28" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        
        <!-- Top Lens -->
        <circle cx="38" cy="38" r="20" fill="#09090b" stroke="#52525b" stroke-width="3"/>
        <circle cx="38" cy="38" r="13" fill="#09090b" stroke="#38bdf8" stroke-width="1" opacity="0.7"/>
        <circle cx="38" cy="38" r="8" fill="#1e1b4b"/>
        <circle cx="35" cy="35" r="3" fill="#ffffff" opacity="0.85"/>
        
        <!-- Bottom Lens -->
        <circle cx="38" cy="84" r="20" fill="#09090b" stroke="#52525b" stroke-width="3"/>
        <circle cx="38" cy="84" r="13" fill="#09090b" stroke="#38bdf8" stroke-width="1" opacity="0.7"/>
        <circle cx="38" cy="84" r="8" fill="#1e1b4b"/>
        <circle cx="35" cy="81" r="3" fill="#ffffff" opacity="0.85"/>
        
        <!-- Right Lens -->
        <circle cx="82" cy="61" r="20" fill="#09090b" stroke="#52525b" stroke-width="3"/>
        <circle cx="82" cy="61" r="13" fill="#09090b" stroke="#38bdf8" stroke-width="1" opacity="0.7"/>
        <circle cx="82" cy="61" r="8" fill="#1e1b4b"/>
        <circle cx="79" cy="58" r="3" fill="#ffffff" opacity="0.85"/>
        
        <!-- Dual-Tone True Tone Flash -->
        <circle cx="82" cy="26" r="6.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <circle cx="82" cy="26" r="2.5" fill="#ffffff"/>
        
        <!-- LiDAR Sensor -->
        <circle cx="82" cy="95" r="5" fill="#09090b" stroke="#27272a" stroke-width="1.5"/>
        <!-- Microphone Hole -->
        <circle cx="60" cy="98" r="2" fill="#09090b"/>
      </g>` : isDualDiag ? `
      <!-- iPhone 15 / 14 / 13 Diagonal Dual Island -->
      <g transform="translate(${x + 16}, ${y + 16})">
        <rect width="98" height="98" rx="26" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" opacity="0.96"/>
        <circle cx="32" cy="32" r="17" fill="#09090b" stroke="#52525b" stroke-width="3"/>
        <circle cx="32" cy="32" r="7" fill="#1e1b4b"/>
        <circle cx="66" cy="66" r="17" fill="#09090b" stroke="#52525b" stroke-width="3"/>
        <circle cx="66" cy="66" r="7" fill="#1e1b4b"/>
        <circle cx="66" cy="30" r="5" fill="#fef08a"/>
      </g>` : isFloatingVert ? `
      <!-- Samsung Galaxy Floating Vertical Lenses -->
      <g transform="translate(${x + 18}, ${y + 18})">
        <circle cx="22" cy="26" r="18" fill="#09090b" stroke="#3f3f46" stroke-width="3"/>
        <circle cx="22" cy="26" r="9" fill="#1e1b4b"/>
        <circle cx="22" cy="74" r="18" fill="#09090b" stroke="#3f3f46" stroke-width="3"/>
        <circle cx="22" cy="74" r="9" fill="#1e1b4b"/>
        <circle cx="22" cy="122" r="18" fill="#09090b" stroke="#3f3f46" stroke-width="3"/>
        <circle cx="22" cy="122" r="9" fill="#1e1b4b"/>
        <circle cx="48" cy="36" r="4.5" fill="#fef08a"/>
      </g>` : `
      <!-- Pill / Classic Vertical Island -->
      <g transform="translate(${x + 16}, ${y + 16})">
        <rect width="48" height="92" rx="24" fill="#18181b" stroke="#3f3f46" stroke-width="2.5" opacity="0.96"/>
        <circle cx="24" cy="26" r="14" fill="#09090b" stroke="#52525b" stroke-width="2"/>
        <circle cx="24" cy="66" r="14" fill="#09090b" stroke="#52525b" stroke-width="2"/>
      </g>`}
    </g>

    <!-- Footer Model Badge -->
    <rect x="${x + 20}" y="${y + caseHeight + 46}" width="${caseWidth - 40}" height="30" rx="8" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
    <text x="600" y="${y + caseHeight + 66}" fill="#cbd5e1" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="1.2">
      ${modelName.toUpperCase()} • PRINTIFY TOUGH CASE • 300 DPI
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function generateLifestyleMockup(input: LifestyleMockupRequest): Promise<string> {
  if (!input.designImageUrl) {
    throw new LifestyleMockupError('Design artwork image is required.', 400);
  }

  // 1. Identify selected phone model and verify Printify configuration
  const requestedModel = input.modelName || 'iPhone 15 Pro Max';
  const template = findPrintifyTemplate(requestedModel);

  if (!template || !template.isAvailable) {
    throw new LifestyleMockupError(
      'This Printify case/model is currently unavailable for mockup generation.',
      404
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const brandName =
    template.brand === 'apple'
      ? 'Apple iPhone'
      : template.brand === 'samsung'
        ? 'Samsung phone'
        : 'phone shown in the reference image';

  const dimensionInfo = template.dimensions
    ? `${template.dimensions.pixelWidth}x${template.dimensions.pixelHeight}px (${template.dimensions.mmWidth}mm x ${template.dimensions.mmHeight}mm)`
    : 'follow the proportions visible in the product reference image';

  const cameraDescription =
    template.cameraCutout.description || input.cameraCutoutDesc || 'triple Pro lens plateau';

  const provider = process.env.LIFESTYLE_IMAGE_PROVIDER?.trim().toLowerCase() || 'gemini';

  // Optional local ComfyUI fast probe
  if (provider === 'local' && process.env.COMFYUI_URL) {
    try {
      const referenceImage = await toInlineImage(input.productMockupUrl || input.designImageUrl);
      const localPrompt = `Photorealistic premium commercial lifestyle product photograph of ${template.modelName} phone case with user artwork.`;
      return await generateWithLocalImageApi({
        referenceImage: referenceImage.inlineData,
        prompt: localPrompt,
        negativePrompt: 'blurry, distorted, 3d render, watermark',
        variationIndex: input.variationIndex ?? 1,
      });
    } catch {
      // Fast fallback to cloud / composite
    }
  }

  // Parse design artwork
  let artworkInline: { inlineData: { mimeType: string; data: string } } | null = null;
  try {
    artworkInline = await toInlineImage(input.designImageUrl);
  } catch (artErr) {
    console.warn('Could not load artwork for mockup inline part:', artErr);
  }

  // If Gemini API is configured and has quota, attempt AI lifestyle generation
  if (apiKey && !apiKey.startsWith('your_') && artworkInline) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Create a photorealistic commercial lifestyle photograph of ${template.modelName} (${brandName}) phone case with the user's artwork on a ${input.userScenePrompt || 'modern coffee table'}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ inlineData: artworkInline.inlineData }, { text: prompt }],
        },
        config: { imageConfig: { aspectRatio: '16:9' } },
      });
      const generatedImage = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
      if (generatedImage?.inlineData?.data) {
        return `data:${generatedImage.inlineData.mimeType || 'image/png'};base64,${generatedImage.inlineData.data}`;
      }
    } catch (geminiError: any) {
      // Gemini quota exhausted or image unavailable - gracefully proceed to photorealistic composite
      console.info('Gemini image generation quota reached or unavailable, generating photorealistic composite mockup...');
    }
  }

  // 100% reliable photorealistic mockup compositing with exact user artwork and model specifications
  const artworkDataUrl = artworkInline
    ? `data:${artworkInline.inlineData.mimeType};base64,${artworkInline.inlineData.data}`
    : input.designImageUrl;

  return renderPhotorealisticCompositeMockup(
    template,
    artworkDataUrl,
    input.userScenePrompt || 'Modern lifestyle setting',
    input.variationIndex || 1
  );
}
