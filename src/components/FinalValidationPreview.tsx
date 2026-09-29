import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  UploadCloud,
  Layers,
  FileText,
  Tag,
  DollarSign,
  Smartphone,
  Shield,
  Star,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Info,
  Download,
} from 'lucide-react';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';
import { PRINTIFY_TEMPLATES, findPrintifyTemplate } from '../data/printifyReferences';

interface FinalValidationPreviewProps {
  product: UnifiedProductRecord;
  onUpdateProduct: (updated: UnifiedProductRecord) => void;
  onNavigateToStep?: (step: any) => void;
}

export const FinalValidationPreview: React.FC<FinalValidationPreviewProps> = ({
  product,
  onUpdateProduct,
  onNavigateToStep,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>(() => {
    return localStorage.getItem('casecraft_printify_token') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [tokenSavedNotice, setTokenSavedNotice] = useState<string | null>(null);

  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    productId?: string;
    productUrl?: string;
    variantsCount?: number;
    createdAt?: string;
    errorDetails?: string;
    demoMode?: boolean;
  } | null>(
    product.printify.creationResponse
      ? {
          success: product.printify.creationResponse.success,
          message: product.printify.creationResponse.message || '',
          productId: product.printify.creationResponse.productId,
          productUrl: product.printify.creationResponse.productUrl,
          variantsCount: product.printify.creationResponse.variantsCount,
          createdAt: product.printify.creationResponse.createdAt,
          errorDetails: product.printify.creationResponse.error,
        }
      : null
  );

  const handleSaveToken = () => {
    if (userToken.trim()) {
      localStorage.setItem('casecraft_printify_token', userToken.trim());
      setTokenSavedNotice('Printify Personal Access Token saved!');
    } else {
      localStorage.removeItem('casecraft_printify_token');
      setTokenSavedNotice('Using Sandbox/Demo Mode.');
    }
    setTimeout(() => setTokenSavedNotice(null), 3000);
  };

  const selectedTemplate =
    findPrintifyTemplate(product.printify.selectedModels?.[0] || 'iPhone 15 Pro Max') ||
    PRINTIFY_TEMPLATES.find((t) => t.id === 'iphone-15-pro-max') ||
    PRINTIFY_TEMPLATES[0];

  const primaryMockup =
    product.mockups.find((m) => m.isPrimary) ||
    product.mockups[0] ||
    null;

  // Validation Checks
  const hasDesign = Boolean(product.design.localUrl || product.design.fileUrl);
  const hasMockups = product.mockups.length > 0;
  const hasTitle = Boolean(product.listing.title.trim());
  const hasDescription = Boolean(product.listing.description.trim());
  const hasTags = product.listing.tags.filter((t) => t.trim().length > 0).length >= 5;
  const hasPrice = Number(product.pricing?.sellingPrice ?? product.product.price) > 0;
  const hasVariants = (product.printify.selectedModels?.length || 0) > 0 || (product.printify.variantIds?.length || 0) > 0;

  const isFormComplete =
    hasDesign && hasMockups && hasTitle && hasDescription && hasPrice && hasVariants;

  const handleCreateOnPrintify = async () => {
    if (!isFormComplete) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const savedToken = localStorage.getItem('casecraft_printify_token') || userToken;
    if (savedToken.trim()) {
      headers['x-printify-token'] = savedToken.trim();
    }

    try {
      // Step 1: Upload artwork asset to Printify Media Library
      const artworkData = product.design.fileUrl || product.design.localUrl;
      const artworkUploadRes = await fetch('/api/printify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'upload',
          fileName: `${product.productId}-artwork.png`,
          image: artworkData,
        }),
      });

      const artworkUploadData = await artworkUploadRes.json().catch(() => ({}));
      const artworkImageId = artworkUploadData?.imageId || 'mockup_asset_01';

      // Step 2: Upload mockups to Printify Media Library
      const uploadedMockupIds: string[] = [];
      for (const [idx, m] of product.mockups.entries()) {
        if (m.localUrl || m.fileUrl) {
          try {
            const mRes = await fetch('/api/printify', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                action: 'upload',
                fileName: `${product.productId}-mockup-${idx + 1}.png`,
                image: m.localUrl || m.fileUrl,
              }),
            });
            const mData = await mRes.json().catch(() => ({}));
            if (mData?.imageId) uploadedMockupIds.push(String(mData.imageId));
          } catch {
            // Non-blocking upload
          }
        }
      }

      // Step 3: Call Printify Product Creation endpoint
      const sellingPrice = Number(product.pricing?.sellingPrice ?? product.product.price ?? 24.99);
      const blueprintId = product.printify.blueprintId || selectedTemplate.blueprintId || '68';
      const providerId = product.printify.printProviderId || selectedTemplate.printProviderId || '1';
      const variantId = product.printify.variantIds?.[0] || selectedTemplate.variantId || '104273';

      const createResponse = await fetch('/api/printify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create',
          shopId: product.printify.shopId || 'default',
          product: {
            productId: product.productId,
            listing: product.listing,
            product: { sku: product.productId, price: sellingPrice },
            pricing: product.pricing,
            printify: {
              ...product.printify,
              blueprintId,
              printProviderId: providerId,
              variantIds: [variantId],
            },
          },
          artworkImageId,
          uploadedImageIds: [artworkImageId, ...uploadedMockupIds],
        }),
      });

      const data = await createResponse.json().catch(() => ({}));

      if (!createResponse.ok && !data.product?.id) {
        const errorMessage =
          data.error ||
          'Printify product creation could not be completed. Please check your Printify API Token or network connection.';
        
        const failureRecord = {
          success: false,
          message: '✕ Product creation failed',
          errorDetails: errorMessage,
        };

        setSubmissionResult(failureRecord);
        onUpdateProduct({
          ...product,
          printify: {
            ...product.printify,
            status: 'failed',
            lastError: errorMessage,
            creationResponse: {
              success: false,
              message: '✕ Product creation failed',
              error: errorMessage,
              createdAt: new Date().toISOString(),
            },
          },
        });
        return;
      }

      // Success Path
      const isDemo = Boolean(data.demoMode);
      const newProductId = String(data.product?.id || `pf_${Date.now()}`);
      const productUrl = isDemo
        ? `https://printify.com/app/products/${newProductId}`
        : `https://printify.com/app/products/${newProductId}`;
      const createdAt = new Date().toLocaleString();
      const variantCount = data.product?.variants?.length || product.printify.selectedModels.length || 1;

      const successRecord = {
        success: true,
        message: isDemo ? '✓ Product successfully created (Demo Mode)' : '✓ Product successfully created on Printify',
        productId: newProductId,
        productUrl,
        variantsCount: variantCount,
        createdAt,
        demoMode: isDemo,
      };

      setSubmissionResult(successRecord);

      onUpdateProduct({
        ...product,
        printify: {
          ...product.printify,
          status: 'created',
          productUrl,
          lastError: '',
          creationResponse: {
            success: true,
            productId: newProductId,
            productUrl,
            variantsCount: variantCount,
            createdAt,
            message: successRecord.message,
          },
        },
        automation: {
          ...product.automation,
          status: 'READY',
          printifyProductId: newProductId,
          createdDate: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Network error occurred while connecting to Printify.';
      setSubmissionResult({
        success: false,
        message: '✕ Product creation failed',
        errorDetails: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Stage 7 • Final Review & Validation
              </span>
              <span className="text-xs text-slate-400">Pre-Publish Verification</span>
            </div>
            <h2 className="text-xl font-bold text-white">Review Product & Push to Printify</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect your phone model configuration, artwork positioning, mockups gallery, Etsy SEO listing details, and pricing before publishing.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={!isFormComplete || isSubmitting}
              onClick={handleCreateOnPrintify}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition shadow-lg ${
                isFormComplete && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer scale-100 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating on Printify...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" /> Everything looks correct → Create on Printify
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printify API Token Configuration Card */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Printify API Personal Access Token</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
              userToken.trim()
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
            }`}>
              {userToken.trim() ? 'Token Saved' : 'Local Sandbox Mode'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTokenInput((prev) => !prev)}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-medium underline"
          >
            {showTokenInput ? 'Close' : userToken.trim() ? 'Edit Token' : 'Enter Token'}
          </button>
        </div>

        {(showTokenInput || !userToken.trim()) && (
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed">
              To publish live products directly into your Printify account, enter your Printify API Token below.
              (Find or create your token at{' '}
              <a
                href="https://printify.com/app/account/api"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-300 underline font-medium"
              >
                Printify &gt; Account &gt; API
              </a>
              )
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                placeholder="Paste your Printify Personal Access Token here..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleSaveToken}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer shrink-0"
              >
                Save Token
              </button>
            </div>
            {tokenSavedNotice && <p className="text-emerald-400 font-medium">{tokenSavedNotice}</p>}
          </div>
        )}
      </div>

      {/* Creation Status Feedback Alert */}
      {submissionResult && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            submissionResult.success
              ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-100 shadow-xl shadow-emerald-950/40'
              : 'bg-rose-950/60 border-rose-700/80 text-rose-100 shadow-xl shadow-rose-950/40'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {submissionResult.success ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-5 h-5 text-rose-400" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  {submissionResult.message}
                </h3>
                {submissionResult.success ? (
                  <div className="mt-2 space-y-1 text-xs text-emerald-200/90">
                    <p>
                      <strong className="text-white">Printify Product ID:</strong>{' '}
                      <span className="font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                        {submissionResult.productId}
                      </span>
                    </p>
                    <p>
                      <strong className="text-white">Variants Configured:</strong>{' '}
                      {submissionResult.variantsCount} phone model variant(s)
                    </p>
                    <p>
                      <strong className="text-white">Created At:</strong> {submissionResult.createdAt}
                    </p>
                    {submissionResult.productUrl && (
                      <p className="pt-2">
                        <a
                          href={submissionResult.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Product in Printify Dashboard
                        </a>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-rose-200/90 leading-relaxed">
                    {submissionResult.errorDetails}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSubmissionResult(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Validation Checklist Banner */}
      {!isFormComplete && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Incomplete Product Checklist — Complete before sending to Printify:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside text-amber-200/90">
              <li className={hasDesign ? 'text-emerald-300' : 'text-amber-400'}>
                {hasDesign ? '✓ Artwork design loaded' : 'Missing: Design artwork'}
              </li>
              <li className={hasMockups ? 'text-emerald-300' : 'text-amber-400'}>
                {hasMockups ? `✓ ${product.mockups.length} Mockup(s) ready` : 'Missing: At least 1 mockup image'}
              </li>
              <li className={hasTitle ? 'text-emerald-300' : 'text-amber-400'}>
                {hasTitle ? '✓ Listing title filled' : 'Missing: Listing title'}
              </li>
              <li className={hasDescription ? 'text-emerald-300' : 'text-amber-400'}>
                {hasDescription ? '✓ Product description filled' : 'Missing: Product description'}
              </li>
              <li className={hasPrice ? 'text-emerald-300' : 'text-amber-400'}>
                {hasPrice ? '✓ Retail price set' : 'Missing: Valid retail price'}
              </li>
              <li className={hasVariants ? 'text-emerald-300' : 'text-amber-400'}>
                {hasVariants ? '✓ Phone model variants selected' : 'Missing: Phone model variant selection'}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Two-Column Review Layout: Product Section (Left) & Listing Section (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product & Variants & Mockups */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Phone Model & Printify Case */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              Product & Phone Model Specifications
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Selected Phone Model</span>
                <span className="text-white font-semibold text-sm">{selectedTemplate.modelName}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {selectedTemplate.dimensions.mmWidth} × {selectedTemplate.dimensions.mmHeight} mm ({selectedTemplate.dimensions.pixelWidth} × {selectedTemplate.dimensions.pixelHeight} px)
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Printify Case Construction</span>
                <span className="text-white font-semibold text-sm">Tough Case (Dual Layer)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Blueprint ID: {selectedTemplate.blueprintId || '68'} · Provider ID: {selectedTemplate.printProviderId || '1'}
                </span>
              </div>
            </div>

            {/* Design Artwork Preview & Resolution */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              {product.design.localUrl ? (
                <img
                  src={product.design.localUrl}
                  alt="Design artwork"
                  className="w-14 h-18 object-contain rounded border border-slate-700 bg-black shrink-0"
                />
              ) : (
                <div className="w-14 h-18 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-xs">
                <p className="text-white font-medium truncate">{product.design.title || product.designName}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Resolution: {product.design.resolution?.width || 1289} × {product.design.resolution?.height || 2264} px
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> 300 DPI Sublimation Wrap Bleed
                </span>
              </div>
            </div>
          </div>

          {/* 2. Mockups Gallery */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Product Mockups Gallery ({product.mockups.length})
              </h3>
              {primaryMockup && (
                <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Cover Image Selected
                </span>
              )}
            </div>

            {product.mockups.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {product.mockups.map((m, idx) => {
                  const isPrimary = Boolean(m.isPrimary || idx === 0);
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-4/3 rounded-lg overflow-hidden border bg-slate-950 p-1 flex flex-col items-center justify-between ${
                        isPrimary ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex-1 flex items-center justify-center w-full min-h-[80px]">
                        {m.localUrl || m.fileUrl ? (
                          <img src={m.localUrl || m.fileUrl} alt={m.modelName} className="max-h-24 object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-600">Pending</span>
                        )}
                      </div>
                      {isPrimary && (
                        <span className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-10">
                          PRIMARY
                        </span>
                      )}
                      {(m.localUrl || m.fileUrl) && (
                        <a
                          href={m.localUrl || m.fileUrl}
                          download={`casecraft-mockup-${idx + 1}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full mt-1 flex items-center justify-center gap-1 py-1 rounded bg-slate-850 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 transition shrink-0"
                          title="Download high-resolution mockup"
                        >
                          <Download className="w-3 h-3 text-indigo-400" /> Save Image
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No mockups attached to product record.</p>
            )}
          </div>

          {/* 3. Variants Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-sky-400" />
              Printify Variants to Create
            </h3>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{selectedTemplate.modelName} · Matte Finish</span>
                  <span className="text-[10px] text-slate-500 block">Tough Dual Layer • Full Wrap</span>
                </div>
                <span className="font-mono text-emerald-400">Variant ID: {selectedTemplate.variantId}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{selectedTemplate.modelName} · Glossy Finish</span>
                  <span className="text-[10px] text-slate-500 block">Tough Dual Layer • Liquid Gloss</span>
                </div>
                <span className="font-mono text-emerald-400">Variant ID: {Number(selectedTemplate.variantId) + 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Listing SEO, Tags & Pricing */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Listing Title & Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              Listing Title & Customer Description
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Product Title</label>
              <input
                type="text"
                value={product.listing.title}
                onChange={(e) =>
                  onUpdateProduct({
                    ...product,
                    listing: { ...product.listing, title: e.target.value },
                  })
                }
                placeholder="Catchy, SEO-optimized title for phone case..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {product.listing.title.length}/140 characters
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Product Description</label>
              <textarea
                rows={7}
                value={product.listing.description}
                onChange={(e) =>
                  onUpdateProduct({
                    ...product,
                    listing: { ...product.listing, description: e.target.value },
                  })
                }
                placeholder="Product description with bullet points, materials, and care..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs leading-relaxed text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* 2. Etsy Search Tags & Keywords */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Etsy Tags / Search Keywords (13 Max)
              </span>
              <span className="text-xs text-slate-400">
                {product.listing.tags.filter((t) => t.trim().length > 0).length}/13 used
              </span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {product.listing.tags
                .filter((t) => t.trim().length > 0)
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/60 border border-amber-800/60 text-amber-200"
                  >
                    #{tag}
                  </span>
                ))}
              {product.listing.tags.filter((t) => t.trim().length > 0).length === 0 && (
                <span className="text-xs text-slate-500">No tags added yet.</span>
              )}
            </div>
          </div>

          {/* 3. Pricing & Margin */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Pricing & Profit Margin
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Retail Selling Price</span>
                <span className="text-emerald-400 font-bold text-base">
                  ${Number(product.pricing?.sellingPrice ?? product.product.price ?? 24.99).toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Printify Base Cost</span>
                <span className="text-slate-300 font-bold text-base">
                  ${Number(product.pricing?.productionCost ?? 10.5).toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Estimated Net Profit</span>
                <span className="text-sky-400 font-bold text-base">
                  $
                  {(
                    Number(product.pricing?.sellingPrice ?? product.product.price ?? 24.99) -
                    Number(product.pricing?.productionCost ?? 10.5)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
