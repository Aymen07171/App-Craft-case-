import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Tag,
  ArrowRight,
  ShieldCheck,
  Star,
  Info,
  Layers,
  Palette,
  Gift,
  Users,
  Search,
  SlidersHorizontal,
  Compass,
  Lightbulb,
  ExternalLink,
  Wand2,
} from 'lucide-react';
import { UnifiedProductRecord, WorkflowMode } from '../types/unifiedWorkflow';

interface ListingWorkspaceProps {
  product: UnifiedProductRecord;
  onUpdateProduct: (updated: UnifiedProductRecord) => void;
  onContinueToExport: () => void;
  workflowMode?: WorkflowMode;
  onSelectWorkflowMode?: (mode: WorkflowMode) => void;
}

export const ListingWorkspace: React.FC<ListingWorkspaceProps> = ({
  product,
  onUpdateProduct,
  onContinueToExport,
  workflowMode,
  onSelectWorkflowMode,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string>(
    product.design.prompt || product.design.title || product.designName || ''
  );

  // Sync prompt whenever product or active workflow changes
  useEffect(() => {
    const designatedPrompt = product.design.prompt || product.design.title || product.designName || '';
    setActivePrompt(designatedPrompt);
    setError(null);
    setSuccessMsg(null);
  }, [product.productId, product.workflowMode, workflowMode, product.design.prompt, product.design.title, product.design.localUrl]);

  // Check whether assets have been uploaded to Drive
  const hasDriveDesign = Boolean(product.design.fileId && product.design.fileUrl);
  const hasDriveMockups = product.mockups.some((m) => m.fileId && m.fileUrl);
  const assetsReady = hasDriveDesign && hasDriveMockups;

  // Generate complete Etsy listing information directly from design prompt
  const handleGenerateListing = async () => {
    const promptToAnalyze = (activePrompt || product.design.prompt || product.design.title || product.designName || '').trim();
    if (!promptToAnalyze && !product.design.localUrl) {
      setError('Please provide a design prompt or artwork to generate the Etsy listing.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const artworkUrl = product.design.localUrl || product.design.fileUrl || product.design.sourceUrl;
      let resolvedBase64: string | undefined = undefined;

      if (artworkUrl) {
        if (artworkUrl.startsWith('data:')) {
          resolvedBase64 = artworkUrl;
        } else {
          try {
            const fetched = await fetch(artworkUrl);
            if (fetched.ok) {
              const blob = await fetched.blob();
              resolvedBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (base64Err) {
            console.warn('Could not convert design image to base64, using direct analysis:', base64Err);
          }
        }
      }

      const res = await fetch('/design-api/generate-etsy-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToAnalyze,
          imageDataUrl: resolvedBase64,
          designTitle: product.design.title || product.designName,
          niche: product.design.niche || 'Phone Case Art',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.listing) {
        throw new Error(data.error || 'Failed to generate Etsy listing from prompt analysis.');
      }

      const l = data.listing;
      const tagsArray: string[] = Array.isArray(l.etsyTags)
        ? l.etsyTags
        : Array.isArray(l.tags)
        ? l.tags
        : Array(13).fill('');

      // Ensure 13 tags
      while (tagsArray.length < 13) {
        tagsArray.push('');
      }

      const updatedProduct: UnifiedProductRecord = {
        ...product,
        designName: l.extractedConcepts?.subject || product.designName,
        design: {
          ...product.design,
          prompt: promptToAnalyze,
          title: l.extractedConcepts?.subject ? `${l.extractedConcepts.subject} Case` : product.design.title,
        },
        listing: {
          title: l.productTitle || l.title || `${product.designName} Tough Phone Case`,
          shortDescription: l.shortDescription || '',
          description: l.productDescription || l.description || '',
          tags: tagsArray.slice(0, 13),
          category: l.category || l.suggestedAttributes?.category || 'Electronics Cases',
          primaryColor: l.primaryColor || l.suggestedAttributes?.primaryColor || '',
          secondaryColor: l.secondaryColor || l.suggestedAttributes?.secondaryColor || '',
          style: Array.isArray(l.designStyle)
            ? l.designStyle.join(', ')
            : l.suggestedAttributes?.artStyle || l.designStyle || '',
          occasion: l.occasion || l.suggestedAttributes?.occasion || '',
          recipient: Array.isArray(l.targetCustomer)
            ? l.targetCustomer.join(', ')
            : l.suggestedAttributes?.recipient || l.targetCustomer || '',
          primaryKeywords: l.primaryKeywords || [],
          longTailKeywords: l.longTailKeywords || [],
          relevantSearchTerms: l.relevantSearchTerms || l.searchIntent || [],
          searchIntent: l.searchIntent || l.relevantSearchTerms || [],
          suggestedAttributes: l.suggestedAttributes,
          relevantCategories: l.relevantCategories || [],
          personalizationSuggestions: l.personalizationSuggestions || [],
          seoRecommendations: l.seoRecommendations,
          extractedConcepts: l.extractedConcepts,
          keywordRationale: l.keywordRationale || l.seoRecommendations?.keywordRationale || '',
        },
      };

      onUpdateProduct(updatedProduct);
      setSuccessMsg('Complete Etsy listing generated directly from your design prompt!');
    } catch (err: any) {
      console.error('Error generating listing from prompt:', err);
      setError(err.message || 'Error communicating with AI listing generation service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateField = (field: keyof UnifiedProductRecord['listing'], val: any) => {
    onUpdateProduct({
      ...product,
      listing: {
        ...product.listing,
        [field]: val,
      },
    });
  };

  const handleUpdateTag = (index: number, val: string) => {
    const nextTags = [...product.listing.tags];
    nextTags[index] = val;
    handleUpdateField('tags', nextTags);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(label);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyAllTags = () => {
    const validTags = product.listing.tags.filter((t) => t.trim());
    copyToClipboard(validTags.join(', '), 'tags');
  };

  const handleCopyFullListing = () => {
    const text = [
      `PRODUCT ID: ${product.productId}`,
      `TITLE: ${product.listing.title}`,
      `\nSHORT DESCRIPTION:\n${product.listing.shortDescription || 'N/A'}`,
      `\nFULL DESCRIPTION:\n${product.listing.description}`,
      `\n13 ETSY TAGS:\n${product.listing.tags.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
      `\nPRIMARY KEYWORDS: ${(product.listing.primaryKeywords || []).join(', ')}`,
      `LONG-TAIL KEYWORDS: ${(product.listing.longTailKeywords || []).join(', ')}`,
      `CATEGORY: ${product.listing.category}`,
      `COLORS: ${product.listing.primaryColor} / ${product.listing.secondaryColor}`,
      `STYLE: ${product.listing.style}`,
      `OCCASION: ${product.listing.occasion}`,
      `RECIPIENT: ${product.listing.recipient}`,
      product.listing.personalizationSuggestions?.length
        ? `\nPERSONALIZATION SUGGESTIONS:\n• ${product.listing.personalizationSuggestions.join('\n• ')}`
        : '',
      product.listing.seoRecommendations
        ? `\nSEO RECOMMENDATIONS:\nPrimary Query: ${product.listing.seoRecommendations.primarySearchQuery}\nStrategy: ${product.listing.seoRecommendations.longTailStrategy}\nRationale: ${product.listing.seoRecommendations.keywordRationale}`
        : '',
      `\nDRIVE DESIGN FILE: ${product.design.fileUrl || 'Pending'}`,
      ...product.mockups.map((m, i) => `DRIVE MOCKUP 0${i + 1}: ${m.fileUrl || 'N/A'}`),
    ].filter(Boolean).join('\n');

    copyToClipboard(text, 'full');
  };

  const extracted = product.listing.extractedConcepts;
  const seoRecs = product.listing.seoRecommendations;
  const suggestedAttrs = product.listing.suggestedAttributes;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Etsy Listing Generator &amp; Prompt Analyzer</h2>
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-800/50 uppercase">
                  {product.workflowMode === 'workflow-b'
                    ? 'Workflow B Source'
                    : product.workflowMode === 'workflow-c'
                    ? 'Workflow C Source'
                    : 'Workflow A Source'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate title, 13 tags, full description, product attributes, and SEO strategy for <span className="font-mono text-indigo-300 font-bold">{product.productId}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyFullListing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              {copiedSection === 'full' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedSection === 'full' ? 'Copied Full Listing' : 'Copy Full Listing'}</span>
            </button>
            <button
              type="button"
              onClick={handleGenerateListing}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-semibold text-white transition shadow-md shadow-indigo-950 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Design Prompt...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Complete Listing from Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Mode Tabs in Listing Workspace */}
        {onSelectWorkflowMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Select Listing Source:</span>
            </div>
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectWorkflowMode('workflow-a')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  (workflowMode || product.workflowMode) === 'workflow-a'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workflow A (AI Studio)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectWorkflowMode('workflow-b')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  (workflowMode || product.workflowMode) === 'workflow-b'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Workflow B (Custom Upload + AI Mockup)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectWorkflowMode('workflow-c')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  (workflowMode || product.workflowMode) === 'workflow-c'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Workflow C (Custom Upload + Custom Mockups)</span>
              </button>
            </div>
          </div>
        )}

        {/* Warning if drive assets are not uploaded yet */}
        {!assetsReady && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-950/40 p-3 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Tip: For automated Google Sheets &amp; Make.com publishing, sync your assets to Google Drive in Step 3 so Google Drive URLs are ready for Make.com.
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Listing generation error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* 🚀 PROMPT INPUT & AI CONCEPT EXTRACTION CARD */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Design Prompt Source of Truth
            </h3>
            <span className="text-[11px] text-indigo-300 bg-indigo-950/70 border border-indigo-800/50 px-2 py-0.5 rounded">
              Primary SEO Generator
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerateListing}
            disabled={isGenerating || !activePrompt.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
          >
            {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            <span>{isGenerating ? 'Extracting Concepts...' : 'Analyze & Generate Listing'}</span>
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-300 font-medium block mb-1.5">
            Enter or edit the design prompt describing your artwork:
          </label>
          <textarea
            rows={3}
            value={activePrompt}
            onChange={(e) => setActivePrompt(e.target.value)}
            placeholder="e.g. Masterpiece authentic cathedral stained glass window, peaceful sleeping red fox curled in a tight circle with radiant sunburst halo, autumn oak leaves, fly agaric mushrooms, jewel-tone amber gold and deep indigo..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none leading-relaxed font-sans"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Gemini extracts specific subjects, artistic styles, color palettes, atmospheric mood, target buyers, and gift occasions directly from this prompt.
          </p>
        </div>

        {/* 🔬 Extracted Concepts Grid from Design Prompt */}
        {extracted && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Concepts Extracted from Design Prompt
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Subject & Style */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" /> Subject &amp; Art Style
                </span>
                <p className="text-slate-100 font-semibold">{extracted.subject || 'Art Subject'}</p>
                <p className="text-indigo-300 text-[11px]">{extracted.artStyle || 'Fine Art'}</p>
              </div>

              {/* Theme & Mood */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-purple-400" /> Theme &amp; Mood
                </span>
                <p className="text-slate-100 font-semibold">{extracted.theme || 'Aesthetic Art'}</p>
                <p className="text-purple-300 text-[11px]">{extracted.mood || 'Serene & striking'}</p>
              </div>

              {/* Colors */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-amber-400" /> Extracted Color Palette
                </span>
                <p className="text-amber-200 font-semibold">{extracted.colors?.primary} &amp; {extracted.colors?.secondary}</p>
                <p className="text-slate-400 text-[11px] truncate">
                  {extracted.colors?.palette?.join(', ') || 'Rich jewel tones'}
                </p>
              </div>

              {/* Audience & Gifts */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Gift className="w-3 h-3 text-emerald-400" /> Audience &amp; Gifting
                </span>
                <p className="text-emerald-300 font-semibold truncate">
                  {extracted.targetAudience?.slice(0, 2).join(', ') || 'Art Enthusiasts'}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {extracted.giftOccasions?.slice(0, 2).join(', ') || 'Birthday, Holidays'}
                </p>
              </div>
            </div>

            {extracted.elements && extracted.elements.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">Design Elements:</span>
                {extracted.elements.map((el, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                    {el}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Listing Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Title, Short Description, Full Description, Attributes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Title & Short Description Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            {/* SEO-Optimized Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  SEO-Optimized Etsy Title <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(product.listing.title, 'title')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'title' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <span
                    className={`text-[11px] font-mono ${
                      product.listing.title.length > 140
                        ? 'text-rose-400 font-bold'
                        : product.listing.title.length === 0
                        ? 'text-slate-500'
                        : 'text-emerald-400'
                    }`}
                  >
                    {product.listing.title.length}/140 chars
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={product.listing.title}
                onChange={(e) => handleUpdateField('title', e.target.value)}
                placeholder="e.g. Stained Glass Fox Phone Case | Cathedral Vitrail Art Tough Cover for iPhone 16 15 Pro Max Samsung S25"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Short Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Short Description &amp; Search Snippet
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.listing.shortDescription || '', 'shortDesc')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'shortDesc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'shortDesc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={product.listing.shortDescription || ''}
                onChange={(e) => handleUpdateField('shortDescription', e.target.value)}
                placeholder="1-2 sentence compelling product hook incorporating top keywords..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Full Product Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Complete Etsy Product Description <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(product.listing.description, 'description')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === 'description' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {product.listing.description.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
              <textarea
                rows={13}
                value={product.listing.description}
                onChange={(e) => handleUpdateField('description', e.target.value)}
                placeholder="Complete structured description with ✨ DESIGN, 📱 PHONE CASE, 🎨 STYLE, 🎁 GIFT IDEA, and 📦 SPECIFICATIONS..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none leading-relaxed font-mono"
              />
            </div>

            {/* Suggested Product Attributes Grid */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Etsy Product Attributes
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Etsy Category</label>
                  <input
                    type="text"
                    value={product.listing.category}
                    onChange={(e) => handleUpdateField('category', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Primary Color</label>
                  <input
                    type="text"
                    value={product.listing.primaryColor}
                    onChange={(e) => handleUpdateField('primaryColor', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Secondary Color</label>
                  <input
                    type="text"
                    value={product.listing.secondaryColor}
                    onChange={(e) => handleUpdateField('secondaryColor', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Art Style</label>
                  <input
                    type="text"
                    value={product.listing.style}
                    onChange={(e) => handleUpdateField('style', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Occasion</label>
                  <input
                    type="text"
                    value={product.listing.occasion}
                    onChange={(e) => handleUpdateField('occasion', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Target Recipient</label>
                  <input
                    type="text"
                    value={product.listing.recipient}
                    onChange={(e) => handleUpdateField('recipient', e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personalization Suggestions & Relevant Categories */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Personalization &amp; Category Suggestions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-medium block">Personalization Opportunities:</span>
                <ul className="space-y-1.5 text-slate-200 text-[11px] list-disc list-inside">
                  {(product.listing.personalizationSuggestions || [
                    'Optional custom name or monogram centered at bottom backplate',
                    'Choice between glossy full-wrap and satin matte finish',
                    'Custom phone case model sizing on request',
                  ]).map((p, idx) => (
                    <li key={idx} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-medium block">Recommended Etsy Categories:</span>
                <ul className="space-y-1.5 text-indigo-300 text-[11px]">
                  {(product.listing.relevantCategories || [
                    'Electronics & Accessories > Cases & Covers > Phone Cases',
                    'Art & Collectibles > Prints > Digital Prints',
                  ]).map((cat, idx) => (
                    <li key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 13 Etsy Tags, Long-tail Keywords, SEO Recommendations & Audit (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 🏷️ 13 Search Tags Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Etsy Search Tags (13 Required)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllTags}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'tags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'tags' ? 'Copied' : 'Copy All'}</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {product.listing.tags.filter((t) => t.trim().length > 0).length}/13
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {Array.from({ length: 13 }, (_, i) => {
                const tag = product.listing.tags[i] || '';
                const isOverLength = tag.length > 20;

                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                      <span>Tag {i + 1}</span>
                      <span className={isOverLength ? 'text-rose-400 font-bold' : 'text-slate-600'}>
                        {tag.length}/20
                      </span>
                    </div>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleUpdateTag(i, e.target.value)}
                      placeholder={`Tag ${i + 1}`}
                      className={`w-full rounded border bg-slate-950 px-2 py-1 text-xs text-white placeholder-slate-700 focus:outline-none ${
                        isOverLength
                          ? 'border-rose-500 text-rose-300'
                          : tag.trim()
                          ? 'border-slate-700'
                          : 'border-slate-800'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📊 Core, Long-Tail, & Relevant Search Terms */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3.5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Search className="w-4 h-4 text-amber-400" />
              Keywords &amp; Relevant Search Terms
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Core Keywords ({product.listing.primaryKeywords?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(product.listing.primaryKeywords || []).map((kw, i) => (
                    <span key={i} className="bg-slate-950 text-slate-200 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-indigo-400 font-semibold uppercase block mb-1">
                  Long-Tail Search Queries ({product.listing.longTailKeywords?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(product.listing.longTailKeywords || []).map((kw, i) => (
                    <span key={i} className="bg-slate-950 text-indigo-300 border border-indigo-950 px-2 py-0.5 rounded text-[10px] font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase block mb-1">
                  Relevant Shopper Search Intent
                </span>
                <div className="flex flex-wrap gap-1">
                  {(product.listing.relevantSearchTerms || product.listing.searchIntent || []).map((kw, i) => (
                    <span key={i} className="bg-slate-950 text-emerald-300 border border-emerald-950 px-2 py-0.5 rounded text-[10px] font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 🎯 Design-Specific SEO Recommendations & Rationale */}
          {seoRecs && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Design-Specific SEO Recommendations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Primary Target Search Query:</span>
                  <p className="text-indigo-300 font-semibold">{seoRecs.primarySearchQuery}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Long-Tail Strategy:</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{seoRecs.longTailStrategy}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Conversion Advice:</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{seoRecs.conversionAdvice}</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Real-Time SEO Quality Validator Checklist */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              SEO Quality Validation Audit
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                {product.listing.title.length <= 140 && product.listing.title.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>Title is concise, natural, and under 140 characters ({product.listing.title.length}/140)</span>
              </div>

              <div className="flex items-start gap-2">
                {product.listing.description.includes('DESIGN') && product.listing.description.includes('PHONE CASE') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                )}
                <span>Description contains structured sections for design, case features, and specifications</span>
              </div>

              <div className="flex items-start gap-2">
                {product.listing.tags.filter((t) => t.trim().length > 0).length === 13 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>Contains exactly 13 distinct search tags ({product.listing.tags.filter((t) => t.trim().length > 0).length}/13)</span>
              </div>

              <div className="flex items-start gap-2">
                {product.listing.tags.every((t) => t.length <= 20) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>All search tags are 20 characters or less</span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Brand safety validated (No trademark infringement or unverifiable claims)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Listing is fully synchronized with Product ID <span className="font-mono text-indigo-300">{product.productId}</span>.</span>
        </div>

        <button
          type="button"
          onClick={onContinueToExport}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition shadow-md cursor-pointer"
        >
          <span>Continue to Google Sheets &amp; Make.com Export</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
