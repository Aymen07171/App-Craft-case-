import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Move,
  Maximize2,
  RotateCcw,
  Sparkles,
  Smartphone,
  Shield,
  Layers,
  Info,
  RefreshCw,
} from 'lucide-react';
import { PRINTIFY_TEMPLATES, PrintifyTemplateRef, validateArtworkResolution, findPrintifyTemplate } from '../data/printifyReferences';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';

interface CustomDesignUploadProps {
  product: UnifiedProductRecord;
  onUpdateProduct: (updated: UnifiedProductRecord) => void;
  onApplyDesignToMockup?: () => void;
}

export const CustomDesignUpload: React.FC<CustomDesignUploadProps> = ({
  product,
  onUpdateProduct,
  onApplyDesignToMockup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    product.printify.selectedModels?.[0] ? 
      (findPrintifyTemplate(product.printify.selectedModels[0])?.id || 'iphone-15-pro-max') : 
      'iphone-15-pro-max'
  );
  const [selectedCaseType, setSelectedCaseType] = useState<string>('Tough Cases');
  const [scale, setScale] = useState<number>(product.design.transform?.scale || 1.0);
  const [offsetX, setOffsetX] = useState<number>(product.design.transform?.offsetX || 0);
  const [offsetY, setOffsetY] = useState<number>(product.design.transform?.offsetY || 0);
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'stretch'>(product.design.transform?.fitMode || 'cover');
  const [showPrintAreaGuide, setShowPrintAreaGuide] = useState<boolean>(true);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Custom metadata & prompt state for Workflows B and C
  const [customDesignTitle, setCustomDesignTitle] = useState<string>(
    product.design.title || product.designName || ''
  );
  const [customPrompt, setCustomPrompt] = useState<string>(
    product.design.prompt || ''
  );

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (product.design.title && product.design.title !== customDesignTitle && !customDesignTitle) {
      setCustomDesignTitle(product.design.title);
    }
    if (product.design.prompt && product.design.prompt !== customPrompt && !customPrompt) {
      setCustomPrompt(product.design.prompt);
    }
  }, [product.design.title, product.design.prompt]);

  const handleUpdateTitleAndPrompt = (newTitle: string, newPrompt: string) => {
    setCustomDesignTitle(newTitle);
    setCustomPrompt(newPrompt);
    onUpdateProduct({
      ...product,
      designName: newTitle || product.designName,
      design: {
        ...product.design,
        title: newTitle,
        prompt: newPrompt,
      },
    });
  };

  const handleAnalyzeDesign = async () => {
    if (!product.design.localUrl) {
      setAnalysisError('Please upload a design artwork file first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const promptToSend = (customPrompt || customDesignTitle || product.design.title || product.designName || 'Custom phone case graphic artwork').trim();

    try {
      const res = await fetch('/design-api/generate-etsy-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          imageDataUrl: product.design.localUrl,
          designTitle: customDesignTitle || product.design.title || product.designName,
          niche: product.design.niche || 'Phone Case Art',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.listing) {
        throw new Error(data.error || 'Failed to complete design analysis.');
      }

      const l = data.listing;
      setAnalysisResult(l);

      // Save to product record so it flows downstream
      onUpdateProduct({
        ...product,
        designName: customDesignTitle || product.designName,
        design: {
          ...product.design,
          title: customDesignTitle || product.design.title,
          prompt: promptToSend,
        },
        listing: {
          title: l.productTitle || l.title || `${customDesignTitle || product.designName} Tough Case`,
          shortDescription: l.shortDescription || '',
          description: l.productDescription || l.description || '',
          tags: Array.isArray(l.etsyTags) ? l.etsyTags.slice(0, 13) : Array.isArray(l.tags) ? l.tags.slice(0, 13) : Array(13).fill(''),
          category: l.category || 'Electronics Cases',
          primaryColor: l.primaryColor || '',
          secondaryColor: l.secondaryColor || '',
          style: Array.isArray(l.designStyle) ? l.designStyle.join(', ') : (l.designStyle || ''),
          occasion: l.occasion || '',
          recipient: Array.isArray(l.targetCustomer) ? l.targetCustomer.join(', ') : (l.targetCustomer || ''),
          primaryKeywords: l.primaryKeywords || [],
          longTailKeywords: l.longTailKeywords || [],
          relevantSearchTerms: l.relevantSearchTerms || l.searchIntent || [],
          searchIntent: l.searchIntent || [],
          suggestedAttributes: l.suggestedAttributes,
          relevantCategories: l.relevantCategories || [],
          personalizationSuggestions: l.personalizationSuggestions || [],
          seoRecommendations: l.seoRecommendations,
          extractedConcepts: l.extractedConcepts,
          keywordRationale: l.keywordRationale || '',
        },
      });
      setAppliedNotice('Etsy listing details generated & saved for this custom design!');
      setTimeout(() => setAppliedNotice(null), 4000);
    } catch (err: any) {
      setAnalysisError(err?.message || 'Error occurred during AI design analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeTemplate: PrintifyTemplateRef =
    findPrintifyTemplate(selectedModelId) ||
    PRINTIFY_TEMPLATES.find((t) => t.id === 'iphone-15-pro-max') ||
    PRINTIFY_TEMPLATES[0];

  // Validate current artwork resolution when template or design changes
  const resolutionInfo = product.design.resolution || {
    width: 0,
    height: 0,
    isSufficient: false,
    rating: 'warning',
    message: 'Upload an artwork file to verify resolution.',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Format validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid PNG, JPG, or WebP image file.');
      return;
    }

    // 2. File size validation (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File is too large. Please upload an image under 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      // Calculate natural image dimensions
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const validation = validateArtworkResolution(width, height, activeTemplate);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
        const initialCustomPrompt = `Original custom graphic artwork: ${cleanName}. High-definition full-bleed phone case graphic art print.`;

        setCustomDesignTitle(cleanName);
        setCustomPrompt(initialCustomPrompt);

        const updated: UnifiedProductRecord = {
          ...product,
          designName: cleanName,
          design: {
            ...product.design,
            id: `custom-design-${Date.now()}`,
            title: cleanName,
            prompt: initialCustomPrompt,
            localUrl: dataUrl,
            sourceUrl: dataUrl,
            sourceType: 'user-upload',
            verified: false,
            fileId: '',
            fileUrl: '',
            resolution: {
              width,
              height,
              dpiEstimate: validation.dpiEstimate,
              isSufficient: validation.isSufficient,
              rating: validation.rating,
              message: validation.message,
            },
            transform: {
              scale,
              offsetX,
              offsetY,
              fitMode,
            },
          },
          printify: {
            ...product.printify,
            selectedModels: [activeTemplate.modelName],
            variantIds: [activeTemplate.variantId || '104273'],
            blueprintId: activeTemplate.blueprintId || '68',
            printProviderId: activeTemplate.printProviderId || '1',
          },
        };

        onUpdateProduct(updated);
        setAppliedNotice('Artwork uploaded and validated successfully!');
        setTimeout(() => setAppliedNotice(null), 4000);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const tmpl = findPrintifyTemplate(modelId);
    if (!tmpl) return;

    if (product.design.resolution?.width && product.design.resolution?.height) {
      const validation = validateArtworkResolution(
        product.design.resolution.width,
        product.design.resolution.height,
        tmpl
      );
      onUpdateProduct({
        ...product,
        design: {
          ...product.design,
          resolution: {
            ...product.design.resolution,
            dpiEstimate: validation.dpiEstimate,
            isSufficient: validation.isSufficient,
            rating: validation.rating,
            message: validation.message,
          },
        },
        printify: {
          ...product.printify,
          selectedModels: [tmpl.modelName],
          variantIds: [tmpl.variantId || '104273'],
          blueprintId: tmpl.blueprintId || '68',
          printProviderId: tmpl.printProviderId || '1',
        },
      });
    } else {
      onUpdateProduct({
        ...product,
        printify: {
          ...product.printify,
          selectedModels: [tmpl.modelName],
          variantIds: [tmpl.variantId || '104273'],
          blueprintId: tmpl.blueprintId || '68',
          printProviderId: tmpl.printProviderId || '1',
        },
      });
    }
  };

  const handleApplyTransform = () => {
    onUpdateProduct({
      ...product,
      design: {
        ...product.design,
        transform: {
          scale,
          offsetX,
          offsetY,
          fitMode,
        },
      },
    });
    setAppliedNotice('Position and scale saved to print area configuration!');
    setTimeout(() => setAppliedNotice(null), 3000);
    if (onApplyDesignToMockup) {
      onApplyDesignToMockup();
    }
  };

  const handleResetTransform = () => {
    setScale(1.0);
    setOffsetX(0);
    setOffsetY(0);
    setFitMode('cover');
    onUpdateProduct({
      ...product,
      design: {
        ...product.design,
        transform: {
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          fitMode: 'cover',
        },
      },
    });
  };

  const isIphone = activeTemplate.brand === 'apple' || activeTemplate.modelName.toLowerCase().includes('iphone');
  const isProMax = activeTemplate.modelName.includes('Max') || activeTemplate.modelName.includes('Plus') || activeTemplate.modelName.includes('Ultra');
  const previewWidth = 260;
  const previewHeight = isProMax ? 520 : 490;
  const borderRadius = isIphone ? (isProMax ? 36 : 32) : 18;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-800/60 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Custom Design Upload
              </span>
              <span className="text-xs text-slate-400">Workflow B & C</span>
            </div>
            <h2 className="text-xl font-bold text-white">Upload Your Artwork & Position on Printify Case</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Upload your own high-resolution artwork (PNG, JPG, WebP), check print resolution against Printify requirements, and adjust scaling/positioning for the selected phone case.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/20"
            >
              <Upload className="w-4 h-4" />
              {product.design.localUrl ? 'Upload New Artwork' : 'Select Artwork File'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls on Left, Live Case Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Model Selection & Positioning Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Custom Design Metadata & Prompt Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Custom Design Prompt &amp; Metadata (Source for Etsy Listing)
              </h3>
              <span className="text-[11px] text-indigo-300 bg-indigo-950/70 border border-indigo-800/50 px-2 py-0.5 rounded">
                Workflows B &amp; C
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Design Title / Artwork Name
                </label>
                <input
                  type="text"
                  value={customDesignTitle}
                  onChange={(e) => handleUpdateTitleAndPrompt(e.target.value, customPrompt)}
                  placeholder="e.g. Vintage Wild Roses Watercolor Art"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Design Description / Prompt (Used to generate Etsy Title, Tags &amp; Description)
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => handleUpdateTitleAndPrompt(customDesignTitle, e.target.value)}
                  placeholder="Describe your custom artwork style, subjects, colors, mood, and elements (e.g. Hand-painted botanical illustration of wild pink roses with delicate gold foil leaves and emerald vines on a deep charcoal background)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This custom prompt ensures the Etsy listing for Workflows B &amp; C reflects this specific design rather than Workflow A's preset.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Phone Model & Case Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              1. Select Phone Model & Printify Case
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Phone Model</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <optgroup label="Apple iPhone">
                    {PRINTIFY_TEMPLATES.filter((t) => t.brand === 'apple').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.modelName} ({t.dimensions.mmWidth} × {t.dimensions.mmHeight} mm)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Samsung Galaxy">
                    {PRINTIFY_TEMPLATES.filter((t) => t.brand === 'samsung').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.modelName} ({t.dimensions.mmWidth} × {t.dimensions.mmHeight} mm)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Printify Case Construction</label>
                <select
                  value={selectedCaseType}
                  onChange={(e) => setSelectedCaseType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Tough Cases">Tough Case (Dual Layer Bumper) · Blueprint 68</option>
                  <option value="Slim Cases">Slim Impact Case · Blueprint 269</option>
                  <option value="Clear Cases">Clear Hybrid Case · Blueprint 528</option>
                </select>
              </div>
            </div>

            {/* Print Area & Specification Details */}
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-200 font-medium">{activeTemplate.modelName} Specs:</span>{' '}
                <span>Print Area: {activeTemplate.dimensions.pixelWidth} × {activeTemplate.dimensions.pixelHeight} px</span>
                <span className="mx-1.5">•</span>
                <span>300 DPI</span>
                <span className="mx-1.5">•</span>
                <span>Provider: Spoke Custom Products</span>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                <CheckCircle2 className="w-3 h-3" /> Available for Mockup & Printify
              </span>
            </div>
          </div>

          {/* 2. File Validation & Resolution Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                2. Artwork Validation & Resolution Check
              </span>
              {product.design.resolution?.isSufficient ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Print-Ready (300 DPI)
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Check Resolution
                </span>
              )}
            </h3>

            {product.design.localUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="truncate mr-2">
                    <span className="text-slate-400">File: </span>
                    <span className="text-slate-200 font-medium">{product.design.title || 'custom-artwork.png'}</span>
                  </div>
                  <div className="shrink-0 text-slate-300">
                    {resolutionInfo.width} × {resolutionInfo.height} px
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                    resolutionInfo.rating === 'excellent'
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                      : resolutionInfo.rating === 'good'
                      ? 'bg-sky-950/30 border-sky-800/60 text-sky-200'
                      : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  }`}
                >
                  {resolutionInfo.rating === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{resolutionInfo.message}</p>
                    <p className="mt-1 opacity-80">
                      Recommended target for {activeTemplate.modelName} is at least {activeTemplate.dimensions.pixelWidth} × {activeTemplate.dimensions.pixelHeight} px for ultra-sharp full bleed printing.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                No artwork uploaded yet. Click "Select Artwork File" above to validate.
              </div>
            )}
          </div>

          {/* 3. Positioning & Scaling Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Move className="w-4 h-4 text-indigo-400" />
                3. Artwork Placement & Print Area Controls
              </h3>
              <button
                type="button"
                onClick={handleResetTransform}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Fit mode selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Fit Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cover', 'contain', 'stretch'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFitMode(mode)}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg border capitalize transition ${
                      fitMode === mode
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> Scale / Zoom
                </span>
                <span className="text-indigo-400 font-mono font-medium">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Offset X & Y */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Horizontal Offset (X)</span>
                  <span className="text-indigo-400 font-mono">{offsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="2"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Vertical Offset (Y)</span>
                  <span className="text-indigo-400 font-mono">{offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="2"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={showPrintAreaGuide}
                  onChange={(e) => setShowPrintAreaGuide(e.target.checked)}
                  className="rounded border-slate-700 accent-indigo-500"
                />
                Show Safe Print & Bleed Margins
              </label>

              <button
                type="button"
                onClick={handleApplyTransform}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Apply Placement
              </button>
            </div>

            {appliedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {appliedNotice}
              </div>
            )}
          </div>

          {/* AI Design Analyzer Panel */}
          {product.design.localUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  ✨ AI Visual Design Analyzer (Free Engine)
                </h3>
                {analysisResult && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Analysis Completed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Analyze your uploaded image to detect subjects, art styles, colors, and generate SEO titles, categories, and 13 keywords instantly.
              </p>

              {!analysisResult && !isAnalyzing ? (
                <button
                  type="button"
                  onClick={handleAnalyzeDesign}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/10"
                >
                  <Sparkles className="w-4 h-4" /> Run AI Visual Analysis
                </button>
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-slate-950/40 rounded-lg border border-slate-800">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-xs text-slate-300 font-semibold">Analyzing Visual Artwork Elements...</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Detecting colors, style, themes and long-tail SEO terms</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block mb-1">Detected Style & Art Theme</span>
                      <span className="text-indigo-300 font-semibold">{analysisResult.designStyle ? (Array.isArray(analysisResult.designStyle) ? analysisResult.designStyle.join(', ') : analysisResult.designStyle) : 'Detected Style'}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block mb-1">Etsy Shop Category</span>
                      <span className="text-emerald-400 font-semibold">{analysisResult.category || 'Phone Cases'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 block">AI-Generated High-Converting Title</span>
                    <p className="text-xs font-semibold text-white leading-relaxed">{analysisResult.productTitle}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 block">Etsy Tags / Long-Tail Keywords (13 tags)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(analysisResult.etsyTags) && analysisResult.etsyTags.map((tag: string, index: number) => (
                        <span key={index} className="text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 block">Color Palette detected</span>
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <span>Primary: <span className="font-semibold text-white">{analysisResult.primaryColor || 'Multi'}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                        <span>Secondary: <span className="font-semibold text-white">{analysisResult.secondaryColor || 'None'}</span></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeDesign}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze Design Artwork
                  </button>
                </div>
              )}

              {analysisError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs">
                  {analysisError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Case Interactive Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 rounded-2xl p-6 relative">
          <div className="text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Print Area Preview
            </span>
            <h4 className="text-base font-bold text-white mt-0.5">{activeTemplate.modelName}</h4>
            <p className="text-xs text-slate-500">Tough Armor Case • Full-Bleed 300 DPI Sublimation</p>
          </div>

          {/* Interactive Phone Case Visual Container */}
          <div
            className="relative select-none shadow-2xl transition-all"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
              borderRadius: `${borderRadius}px`,
            }}
          >
            {/* Outer Armor Rim */}
            <div
              className="absolute inset-0 rounded-[inherit] border-[3px] border-slate-700 bg-slate-900 overflow-hidden shadow-2xl"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Inner Print Area with User Design */}
              <div
                className="absolute inset-[3px] rounded-[inherit] overflow-hidden bg-slate-950 flex items-center justify-center"
              >
                {product.design.localUrl ? (
                  <img
                    src={product.design.localUrl}
                    alt="Custom artwork preview"
                    className="w-full h-full transition-transform pointer-events-none select-none"
                    style={{
                      objectFit: fitMode === 'stretch' ? 'fill' : fitMode,
                      transform: `scale(${scale}) translate(${offsetX / 2}px, ${offsetY / 2}px)`,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600">
                    <ImageIcon className="w-12 h-12 mb-2 stroke-[1.2]" />
                    <p className="text-xs font-medium">No Artwork Uploaded</p>
                    <p className="text-[10px] text-slate-700 mt-1">Upload an image on the left to see live positioning</p>
                  </div>
                )}

                {/* Safe Margins & Bleed Overlay Guide */}
                {showPrintAreaGuide && (
                  <div className="absolute inset-2 border border-dashed border-indigo-400/40 rounded-[inherit] pointer-events-none flex flex-col justify-between p-2">
                    <span className="text-[9px] text-indigo-300 font-mono tracking-wider opacity-70">SAFE AREA</span>
                    <span className="text-[9px] text-indigo-300 font-mono tracking-wider text-right opacity-70">WRAP BLEED</span>
                  </div>
                )}

                {/* Specular Sheen Layer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.4) 100%)',
                  }}
                />
              </div>

              {/* Camera Island Cutout */}
              {activeTemplate.cameraCutout.type === 'square-triple-pro' ? (
                /* Pro Max Triple Camera Plateau */
                <div
                  className="absolute top-3 left-3 w-24 h-25 rounded-2xl bg-zinc-900 border-2 border-zinc-700 shadow-xl p-2 z-20 flex flex-col justify-between"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.8), inset 0 0 4px rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </div>
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-200 border border-amber-400" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTemplate.cameraCutout.type === 'square-diagonal-dual' ? (
                <div className="absolute top-3 left-3 w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-zinc-700 shadow-xl p-2 z-20 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center" />
                  <div className="w-7 h-7 rounded-full bg-black border-2 border-zinc-600 self-end flex items-center justify-center" />
                </div>
              ) : (
                <div className="absolute top-3 left-3 w-8 h-24 rounded-xl bg-zinc-900 border-2 border-zinc-700 shadow-xl p-1 z-20 flex flex-col justify-around items-center">
                  <div className="w-5 h-5 rounded-full bg-black border border-zinc-600" />
                  <div className="w-5 h-5 rounded-full bg-black border border-zinc-600" />
                  <div className="w-5 h-5 rounded-full bg-black border border-zinc-600" />
                </div>
              )}

              {/* Tough Corner Bumpers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-slate-400/40 rounded-tl-xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-slate-400/40 rounded-tr-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-slate-400/40 rounded-bl-xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-slate-400/40 rounded-br-xl pointer-events-none" />
            </div>
          </div>

          {/* Quick CTA */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleApplyTransform}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Artwork to {activeTemplate.modelName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
