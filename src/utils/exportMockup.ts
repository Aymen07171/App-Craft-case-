import { DeviceType, CaseFinish, FrameColor } from '../types';
import { FRAME_COLORS } from '../data/presets';
import { getPrintifyTemplate } from '../data/printifyReferences';

interface RenderProductMockupOptions {
  artworkUrl: string;
  device: DeviceType;
  finish: CaseFinish;
  frameColorId: string;
  showMagsafe?: boolean;
  glossIntensity?: number;
}

/**
 * Loads an image with CORS handling
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Draws rounded rectangle path
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws the high-detail phone case directly onto a canvas context
 */
export async function drawPhoneCaseProduct(
  ctx: CanvasRenderingContext2D,
  artworkImg: HTMLImageElement,
  x: number,
  y: number,
  targetWidth: number,
  device: DeviceType,
  finish: CaseFinish,
  frameColorId: string,
  showMagsafe = false,
  glossIntensity = 75
) {
  const template = getPrintifyTemplate(device);
  const isApple = template ? template.brand === 'apple' : !device.toLowerCase().includes('samsung');
  const aspectRatio = template
    ? template.dimensions.pixelHeight / template.dimensions.pixelWidth
    : isApple
      ? 574 / 280
      : 588 / 280;
  const targetHeight = targetWidth * aspectRatio;

  const curvature = template?.cameraCutout.cornerCurvature || (isApple ? 'round' : 'sharp');
  const borderRadius =
    curvature === 'round'
      ? targetWidth * 0.16
      : curvature === 'tight'
        ? targetWidth * 0.09
        : targetWidth * 0.045;

  const frameColor: FrameColor =
    FRAME_COLORS.find((c) => c.id === frameColorId) || FRAME_COLORS[0];

  ctx.save();
  ctx.translate(x, y);

  // 1. Outer Phone Frame
  ctx.save();
  roundRect(ctx, 0, 0, targetWidth, targetHeight, borderRadius);
  if (finish === 'clear-hybrid') {
    // Semi-transparent frosted TPU bumper
    ctx.fillStyle = 'rgba(230, 235, 245, 0.45)';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();
  } else if (finish === 'wallet-leather') {
    // Rich faux leather outer shell
    ctx.fillStyle = '#1c1815';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3d342c';
    ctx.stroke();
  } else if (finish === 'eco-matte') {
    // Plant composite wheat straw matte body
    ctx.fillStyle = '#222822';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3d473d';
    ctx.stroke();
  } else {
    // Standard polycarbonate / tough frame
    ctx.fillStyle = frameColor.hex;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = frameColor.accentHex;
    ctx.stroke();
  }

  // 2. Armor Corner Bumpers (Tough Cases)
  if (finish === 'tough-armor') {
    const bumperSize = targetWidth * 0.12;
    ctx.fillStyle = 'rgba(12, 14, 18, 0.95)';
    roundRect(ctx, 0, 0, bumperSize, bumperSize, borderRadius * 0.8);
    ctx.fill();
    roundRect(ctx, targetWidth - bumperSize, 0, bumperSize, bumperSize, borderRadius * 0.8);
    ctx.fill();
    roundRect(ctx, 0, targetHeight - bumperSize, bumperSize, bumperSize, borderRadius * 0.8);
    ctx.fill();
    roundRect(ctx, targetWidth - bumperSize, targetHeight - bumperSize, bumperSize, bumperSize, borderRadius * 0.8);
    ctx.fill();
  }

  // 3. Clip for inner backplate and artwork
  const innerInset = finish === 'clear-hybrid' ? 8 : finish === 'wallet-leather' ? 4 : 3;
  roundRect(
    ctx,
    innerInset,
    innerInset,
    targetWidth - innerInset * 2,
    targetHeight - innerInset * 2,
    Math.max(borderRadius - innerInset, 4)
  );
  ctx.clip();

  // Background for backplate
  ctx.fillStyle = finish === 'clear-hybrid' ? '#0f1115' : '#0a0a0c';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 4. Draw Artwork covering the case back
  const artRatio = artworkImg.width / artworkImg.height;
  const caseRatio = targetWidth / targetHeight;
  let sWidth = artworkImg.width;
  let sHeight = artworkImg.height;
  let sx = 0;
  let sy = 0;

  if (artRatio > caseRatio) {
    sWidth = artworkImg.height * caseRatio;
    sx = (artworkImg.width - sWidth) / 2;
  } else {
    sHeight = artworkImg.width / caseRatio;
    sy = (artworkImg.height - sHeight) / 2;
  }

  ctx.drawImage(
    artworkImg,
    sx,
    sy,
    sWidth,
    sHeight,
    innerInset,
    innerInset,
    targetWidth - innerInset * 2,
    targetHeight - innerInset * 2
  );

  // 5. Special Case Overlays
  if (finish === 'clear-hybrid') {
    // Frosted clear rim reflection & glass sheen
    const glassGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.03)');
    glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (finish === 'wallet-leather') {
    // Leather folio stitch seam on left spine
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(targetWidth * 0.12, 0);
    ctx.lineTo(targetWidth * 0.12, targetHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    // Spine crease shadow
    const spineGrad = ctx.createLinearGradient(0, 0, targetWidth * 0.16, 0);
    spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    spineGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
    spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, targetWidth * 0.16, targetHeight);
    ctx.restore();
  } else if (finish === 'eco-matte') {
    // Organic speckled wheat straw fibers
    ctx.save();
    ctx.fillStyle = 'rgba(235, 225, 205, 0.07)';
    for (let i = 0; i < 40; i++) {
      const rx = (Math.sin(i * 12.3) * 0.5 + 0.5) * targetWidth;
      const ry = (Math.cos(i * 17.8) * 0.5 + 0.5) * targetHeight;
      const rw = 2 + (i % 3);
      const rh = 1.5;
      ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();
  }

  // 6. MagSafe Ring
  if (showMagsafe) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(targetWidth / 2, targetHeight / 2, targetWidth * 0.22, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    roundRect(
      ctx,
      targetWidth / 2 - 2,
      targetHeight / 2 + targetWidth * 0.22 + 4,
      4,
      targetWidth * 0.1,
      2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.restore();
  }

  // 7. Specular Gloss or Velvet Matte Sheen
  if (finish === 'liquid-gloss') {
    const glossGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    const intensity = (glossIntensity / 100) * 0.55;
    glossGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    glossGrad.addColorStop(0.22, `rgba(255, 255, 255, ${intensity * 0.35})`);
    glossGrad.addColorStop(0.38, 'rgba(255, 255, 255, 0)');
    glossGrad.addColorStop(0.68, 'rgba(255, 255, 255, 0)');
    glossGrad.addColorStop(0.85, `rgba(255, 255, 255, ${intensity * 0.2})`);
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (finish === 'velvet-matte' || finish === 'eco-matte') {
    const matteGrad = ctx.createRadialGradient(
      targetWidth * 0.5,
      targetHeight * 0.3,
      10,
      targetWidth * 0.5,
      targetHeight * 0.5,
      targetWidth * 0.7
    );
    matteGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    matteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = matteGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Inner Edge Bevel Shadow
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  roundRect(
    ctx,
    innerInset,
    innerInset,
    targetWidth - innerInset * 2,
    targetHeight - innerInset * 2,
    Math.max(borderRadius - innerInset, 4)
  );
  ctx.stroke();
  ctx.restore(); // restore clip

  // ----------------- 8. CAMERA CUTOUT RENDERING -----------------
  const cutoutType =
    template?.cameraCutout.type || (isApple ? 'square-triple-pro' : 'floating-vertical');

  // Helper to draw realistic glass camera lens with metallic ring
  const drawDetailedLens = (cx: number, cy: number, radius: number) => {
    ctx.save();
    // Lens outer metallic ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0e12';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = frameColor.accentHex || '#525a66';
    ctx.stroke();

    // Dark glass aperture
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = '#05070a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Blue AR anti-reflective glint
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 2, radius * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();
    ctx.restore();
  };

  if (cutoutType === 'square-triple-pro') {
    // iPhone Pro / Pro Max Triple Camera Plateau
    const pWidth = targetWidth * 0.41;
    const pHeight = targetWidth * 0.44;
    const pRadius = targetWidth * 0.11;
    const px = targetWidth * 0.05;
    const py = targetWidth * 0.05;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, px, py, pWidth, pHeight, pRadius);
    ctx.fillStyle = frameColor.hex;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${frameColor.accentHex}bb`;
    ctx.stroke();
    ctx.restore();

    const lensRadius = targetWidth * 0.077;
    drawDetailedLens(px + lensRadius + 6, py + lensRadius + 6, lensRadius);
    drawDetailedLens(px + lensRadius + 6, py + pHeight - lensRadius - 6, lensRadius);
    drawDetailedLens(px + pWidth - lensRadius - 6, py + pHeight / 2, lensRadius);

    // LiDAR & Flash
    ctx.beginPath();
    ctx.arc(px + pWidth - 14, py + 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + pWidth - 14, py + pHeight - 14, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  } else if (cutoutType === 'pill-horizontal') {
    // iPhone 17 Air / iPhone 8 Plus Horizontal Visor Island
    const pWidth = targetWidth * 0.52;
    const pHeight = targetWidth * 0.22;
    const pRadius = pHeight * 0.48;
    const px = targetWidth * 0.06;
    const py = targetWidth * 0.06;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, px, py, pWidth, pHeight, pRadius);
    ctx.fillStyle = frameColor.hex;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${frameColor.accentHex}cc`;
    ctx.stroke();
    ctx.restore();

    const lensRadius = pHeight * 0.32;
    drawDetailedLens(px + pRadius + 2, py + pHeight / 2, lensRadius);
    drawDetailedLens(px + pRadius + lensRadius * 2 + 10, py + pHeight / 2, lensRadius);

    // Flash on the right
    ctx.beginPath();
    ctx.arc(px + pWidth - pRadius + 2, py + pHeight / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  } else if (cutoutType === 'pill-vertical') {
    // iPhone 17 / 16 / 16 Plus / X / XS Vertical Capsule Pill
    const pWidth = targetWidth * 0.24;
    const pHeight = targetWidth * 0.48;
    const pRadius = pWidth * 0.48;
    const px = targetWidth * 0.06;
    const py = targetWidth * 0.06;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, px, py, pWidth, pHeight, pRadius);
    ctx.fillStyle = frameColor.hex;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${frameColor.accentHex}cc`;
    ctx.stroke();
    ctx.restore();

    const lensRadius = pWidth * 0.34;
    drawDetailedLens(px + pWidth / 2, py + pRadius + 2, lensRadius);
    drawDetailedLens(px + pWidth / 2, py + pHeight - pRadius - 2, lensRadius);

    // Side Flash
    ctx.beginPath();
    ctx.arc(px + pWidth + 10, py + pHeight / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  } else if (cutoutType === 'square-diagonal-dual') {
    // iPhone 15 / 14 / 13 Diagonal Dual Lens Plateau
    const pWidth = targetWidth * 0.38;
    const pHeight = targetWidth * 0.40;
    const pRadius = targetWidth * 0.10;
    const px = targetWidth * 0.05;
    const py = targetWidth * 0.05;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, px, py, pWidth, pHeight, pRadius);
    ctx.fillStyle = frameColor.hex;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${frameColor.accentHex}bb`;
    ctx.stroke();
    ctx.restore();

    const lensRadius = targetWidth * 0.074;
    drawDetailedLens(px + lensRadius + 6, py + lensRadius + 6, lensRadius);
    drawDetailedLens(px + pWidth - lensRadius - 6, py + pHeight - lensRadius - 6, lensRadius);

    // Flash at top right
    ctx.beginPath();
    ctx.arc(px + pWidth - 14, py + 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  } else if (cutoutType === 'floating-ultra') {
    // Samsung Galaxy S26/S25/S24/S23/S22 Ultra Penta-Lens Floating Array
    const sLensRadius = targetWidth * 0.072;
    const sx = targetWidth * 0.06;
    let sy = targetWidth * 0.06;

    // Primary 3 Large Lenses
    for (let i = 0; i < 3; i++) {
      drawDetailedLens(sx + sLensRadius, sy + sLensRadius, sLensRadius);
      sy += sLensRadius * 2 + 10;
    }

    // Secondary Sensor Column (Laser AF, Flash, Periscope Telephoto)
    const secX = sx + sLensRadius * 2 + 12;
    // Laser AF
    ctx.beginPath();
    ctx.arc(secX + targetWidth * 0.03, targetWidth * 0.09, targetWidth * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = '#450a0a';
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // Flash
    ctx.beginPath();
    ctx.arc(secX + targetWidth * 0.025, targetWidth * 0.17, targetWidth * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // 3x Telephoto Lens
    drawDetailedLens(secX + sLensRadius * 0.7, targetWidth * 0.25, sLensRadius * 0.7);
  } else if (cutoutType === 'floating-vertical') {
    // Samsung Galaxy S26/S25/S24/S23/S22/S21 Floating 3-Lens Column
    const sLensRadius = targetWidth * 0.072;
    const sx = targetWidth * 0.06;
    let sy = targetWidth * 0.06;

    for (let i = 0; i < 3; i++) {
      drawDetailedLens(sx + sLensRadius, sy + sLensRadius, sLensRadius);
      sy += sLensRadius * 2 + 10;
    }

    // Flash beside top lens
    const secX = sx + sLensRadius * 2 + 12;
    ctx.beginPath();
    ctx.arc(secX + targetWidth * 0.025, targetWidth * 0.08, targetWidth * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
  } else {
    // Center Rounded / Legacy Single Lens
    const cRadius = targetWidth * 0.09;
    const cx = targetWidth / 2;
    const cy = targetWidth * 0.15;
    drawDetailedLens(cx, cy, cRadius);

    ctx.beginPath();
    ctx.arc(cx, cy + cRadius + 12, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Generates an isolated clean studio product mockup on transparent or cyclorama background
 */
export async function generateProductMockupCanvas(
  options: RenderProductMockupOptions,
  width = 1200,
  height = 1400
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Studio Cyclorama Gradient (Neutral high-end commercial backdrop)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1c1f26');
  bgGrad.addColorStop(0.5, '#13151b');
  bgGrad.addColorStop(1, '#0b0c10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft Studio Spotlight
  const spotGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.42,
    width * 0.05,
    width / 2,
    height * 0.45,
    width * 0.55
  );
  spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);

  // Load Artwork
  const artworkImg = await loadImage(options.artworkUrl);

  const phoneW = Math.round(width * 0.44);
  const template = getPrintifyTemplate(options.device);
  const ratio = template
    ? template.dimensions.pixelHeight / template.dimensions.pixelWidth
    : options.device.toLowerCase().includes('samsung')
      ? 588 / 280
      : 574 / 280;

  const phoneH = Math.round(phoneW * ratio);
  const phoneX = (width - phoneW) / 2;
  const phoneY = (height - phoneH) / 2 - 20;

  // Contact Shadow under device
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    width / 2,
    phoneY + phoneH + 18,
    phoneW * 0.48,
    phoneW * 0.08,
    0,
    0,
    Math.PI * 2
  );
  const shadowGrad = ctx.createRadialGradient(
    width / 2,
    phoneY + phoneH + 18,
    10,
    width / 2,
    phoneY + phoneH + 18,
    phoneW * 0.48
  );
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();

  // Draw Case
  await drawPhoneCaseProduct(
    ctx,
    artworkImg,
    phoneX,
    phoneY,
    phoneW,
    options.device,
    options.finish,
    options.frameColorId,
    options.showMagsafe ?? false,
    options.glossIntensity ?? 80
  );

  return canvas.toDataURL('image/png');
}

/**
 * Downloads a data URL as a file
 */
export function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
