import React, { useState, useEffect } from 'react';
import { Download, Upload, Sparkles, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { WorkflowNav } from './components/WorkflowNav';
import { DesignStudio } from './design-studio/components/DesignStudio';
import { WorkflowStudio } from './components/WorkflowStudio';
import { CustomDesignUpload } from './components/CustomDesignUpload';
import { CustomMockupManager } from './components/CustomMockupManager';
import { FinalValidationPreview } from './components/FinalValidationPreview';
import { DriveAssetManager } from './components/DriveAssetManager';
import { ListingWorkspace } from './components/ListingWorkspace';
import { SheetsExportWorkspace } from './components/SheetsExportWorkspace';
import { PrintifyPublishPanel } from './components/PrintifyPublishPanel';
import { GeneratedDesign } from './design-studio/types';
import { PRINTIFY_TEMPLATES } from './data/printifyReferences';
import {
  ProductWorkflowStep,
  UnifiedProductRecord,
  WorkflowMode,
} from './types/unifiedWorkflow';
import { GeneratedWorkflowMockup, MockupWorkflowState } from './types';
import {
  createInitialProductRecord,
  saveProductRecord,
  loadStoredProducts,
  getInitialWorkflowMap,
  saveWorkflowMap,
} from './services/productWorkflowManager';
import { connectGoogleDriveAndSheets } from './services/unifiedGoogleService';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const INITIAL_VITRAIL_DESIGN: GeneratedDesign = {
  id: 'preset-sample-vitrail-01',
  title: 'Woodland Fox & Sunburst (Stained Glass)',
  prompt: `Masterpiece authentic cathedral stained glass window (vitrail), symmetrical arched vertical composition.

In the center, a peaceful sleeping red fox curled in a tight circle with fluffy tail wrapped around its body.

Directly behind the subject is a radiant segmented sunburst halo with glowing amber and golden glass rays, with a golden crescent moon and twinkling stars in the upper arch.

Framed and grounded along the base and sides by red fly agaric mushrooms with white dots, golden chanterelles, acorns, autumn oak leaves, forest berries, and woodland fern fronds, and accompanied by subtle glowing woodland sprites and tiny sleeping dormice tucked among the leaves.

Rich translucent jewel-tone color palette of warm amber gold, fiery autumn orange, deep russet red, forest moss green, deep teal indigo, and dark leaded came metallic outlines.

Enclosed within an intricate Art Nouveau cathedral arched stained-glass frame with curving leadline came tracery, amber glass cabochons, and decorative border tiles.

Authentic leaded came solder outlines, segmented colored glass panes, translucent backlit stained glass radiance, Louis Comfort Tiffany stained glass style, fine Art Nouveau botanical tracery, subtle glass textures and beveled leadlines.

Pure 2D flat-lay graphic art print, vertical 9:16 aspect ratio, clean full-bleed decorative art piece, sharp fine details, high-end collector print.

Do not include: phone, phone case, mockup, device, realistic photography, 3D render, modern clutter, shadows.`,
  imageUrl: '/src/assets/images/sample_vitrail_pure2d_1790462384613.jpg',
  niche: 'Woodland Fox & Sunburst (Stained Glass)',
  createdAt: Date.now(),
  placeholders: {
    SUBJECT_POSE:
      'a peaceful sleeping red fox curled in a tight circle with fluffy tail wrapped around its body',
    HALO_BACKGROUND:
      'a radiant segmented sunburst halo with glowing amber and golden glass rays, with a golden crescent moon and twinkling stars in the upper arch',
    BOTANICAL:
      'red fly agaric mushrooms with white dots, golden chanterelles, acorns, autumn oak leaves, forest berries, and woodland fern fronds',
    COMPANION:
      'subtle glowing woodland sprites and tiny sleeping dormice tucked among the leaves',
    COLOR_PALETTE:
      'warm amber gold, fiery autumn orange, deep russet red, forest moss green, deep teal indigo, and dark leaded came metallic outlines',
    BORDER_THEME:
      'Art Nouveau cathedral arched stained-glass frame with curving leadline came tracery, amber glass cabochons, and decorative border tiles',
  },
  isPreset: true,
  aspectRatio: '9:16',
  keywords: [
    'stained glass phone case',
    'sleeping fox case',
    'woodland wildlife cover',
    'cathedral vitrail art',
    'autumn sunburst case',
    'art nouveau phone cover',
  ],
};

const generateCaseScene = async (
  artworkImageUrl: string,
  sceneDescription: string,
  referenceId: string,
  variationIndex: number,
  productMockupUrl?: string,
  sceneReferenceImageUrls: string[] = []
) => {
  const reference = PRINTIFY_TEMPLATES.find((item) => item.id === referenceId);
  if (!reference) throw new Error('The selected Printify model is unavailable.');

  const featureDescription = [
    reference.caseFeatures.toughBumper ? 'reinforced tough bumper' : '',
    reference.caseFeatures.raisedBezel ? 'raised protective bezel' : '',
    reference.caseFeatures.wrapBleed ? 'full-bleed wrap print' : '',
  ].filter(Boolean).join(', ');

  const response = await fetch('/api/generate-lifestyle-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      designImageUrl: artworkImageUrl,
      productMockupUrl,
      sceneReferenceImages: sceneReferenceImageUrls,
      userScenePrompt: sceneDescription,
      styleDirection: `Maintain this shared visual theme while making this case's composition distinct. Variation ${variationIndex}: vary camera angle, phone placement, lighting, environment, and props.`,
      modelName: reference.modelName,
      brand: reference.brand,
      dimensions: reference.dimensions,
      cameraCutoutDesc: `${reference.cameraCutout.description}; ${reference.cameraCutout.position}; ${reference.cameraCutout.cornerCurvature} corners`,
      caseShapeDesc: `${reference.dimensions.mmWidth}mm x ${reference.dimensions.mmHeight}mm case, ${reference.cameraCutout.aspectRatio.toFixed(4)} width-to-height ratio, ${reference.cameraCutout.cornerCurvature} corner curvature; ${featureDescription}`,
      variationIndex,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!response.ok || !data.imageUrl) throw new Error(data.error || `Failed to generate ${reference.modelName}.`);
  return { reference, imageUrl: data.imageUrl };
};

export default function App() {
  // 1. Unified Pipeline Step & Workflow Mode
  const [pipelineStep, setPipelineStep] = useState<ProductWorkflowStep>('design');
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('workflow-a');
  const [designTab, setDesignTab] = useState<'ai' | 'upload'>('ai');
  const [mockupTab, setMockupTab] = useState<'ai' | 'upload'>('ai');

  // 2. Centralized Isolated Products per Workflow Mode
  const [workflowProducts, setWorkflowProducts] = useState<Record<WorkflowMode, UnifiedProductRecord>>(() => {
    return getInitialWorkflowMap(
      INITIAL_VITRAIL_DESIGN.title,
      INITIAL_VITRAIL_DESIGN.prompt,
      INITIAL_VITRAIL_DESIGN.imageUrl
    );
  });

  const product = workflowProducts[workflowMode] || workflowProducts['workflow-a'];

  const handleUpdateProduct = (updated: UnifiedProductRecord, targetMode?: WorkflowMode) => {
    const mode = targetMode || updated.workflowMode || workflowMode;
    const finalRecord: UnifiedProductRecord = {
      ...updated,
      workflowMode: mode,
    };
    setWorkflowProducts((prev) => {
      const next = {
        ...prev,
        [mode]: finalRecord,
      };
      saveWorkflowMap(next);
      return next;
    });
    saveProductRecord(finalRecord);
  };

  const handleSelectWorkflowMode = (mode: WorkflowMode) => {
    setWorkflowMode(mode);
    const targetProduct = workflowProducts[mode] || workflowProducts['workflow-a'];

    if (mode === 'workflow-a') {
      setDesignTab('ai');
      setMockupTab('ai');
      if (activeDesign?.imageUrl) {
        setMockupWorkflow((prev) => ({
          ...prev,
          artwork: {
            fileName: `${(activeDesign.title || 'design').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
            imageUrl: activeDesign.imageUrl,
          },
        }));
      }
    } else if (mode === 'workflow-b') {
      setDesignTab('upload');
      setMockupTab('ai');
      if (targetProduct.design.localUrl) {
        setMockupWorkflow((prev) => ({
          ...prev,
          artwork: {
            fileName: `${(targetProduct.design.title || 'custom-artwork').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
            imageUrl: targetProduct.design.localUrl,
          },
        }));
      }
    } else if (mode === 'workflow-c') {
      setDesignTab('upload');
      setMockupTab('upload');
    }
  };

  // 3. Google OAuth & Drive Authentication State
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string>('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isDownloadingAssets, setIsDownloadingAssets] = useState(false);
  const [assetDownloadError, setAssetDownloadError] = useState<string | null>(null);

  // 4. Design Studio State (Preserved for Workflow A)
  const [designs, setDesigns] = useState<GeneratedDesign[]>([INITIAL_VITRAIL_DESIGN]);
  const [activeDesign, setActiveDesign] = useState<GeneratedDesign | null>(INITIAL_VITRAIL_DESIGN);

  // 5. Mockup Studio Workflow State (Preserved)
  const [mockupWorkflow, setMockupWorkflow] = useState<MockupWorkflowState>({
    activeStep: 'upload-design',
    artwork: {
      fileName: 'woodland-fox-stained-glass.jpg',
      imageUrl: INITIAL_VITRAIL_DESIGN.imageUrl,
    },
    productReferenceIds: ['iphone-15-pro-max', 'iphone-15-pro', 'samsung-galaxy-s24-ultra'],
    productReferenceImages: {},
    sceneReferenceImages: [],
    sceneDescription:
      'Artisanal coffee shop wooden table, latte cup and notebook beside smartphone resting at a slight angle showcasing the case artwork',
    generatedMockups: [],
    generatedImageUrl: null,
    isGenerating: false,
    generationProgress: null,
    generationError: null,
  });

  // Google OAuth flow
  const handleConnectGoogle = async () => {
    setGoogleAuthError(null);
    try {
      const res = await connectGoogleDriveAndSheets(GOOGLE_CLIENT_ID);
      setGoogleToken(res.token);
      setGoogleEmail(res.email);
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setGoogleAuthError(err.message || 'Google authorization failed.');
    }
  };

  // When a design is generated in Design Studio, update Workflow A specifically
  const handleDesignGenerated = (newDesign: GeneratedDesign) => {
    setDesigns((prev) => [newDesign, ...prev]);
    setActiveDesign(newDesign);

    const prevA = workflowProducts['workflow-a'];
    const updatedA: UnifiedProductRecord = {
      ...prevA,
      designName: newDesign.title,
      workflowMode: 'workflow-a',
      design: {
        ...prevA.design,
        id: newDesign.id,
        title: newDesign.title,
        prompt: newDesign.prompt,
        localUrl: newDesign.imageUrl,
        sourceUrl: newDesign.sourceUrl,
        niche: newDesign.niche,
        aspectRatio: newDesign.aspectRatio,
        fileId: '',
        fileUrl: '',
        verified: false,
      },
      product: {
        ...prevA.product,
        sku: prevA.productId,
      },
    };
    handleUpdateProduct(updatedA, 'workflow-a');

    setMockupWorkflow((prev) => ({
      ...prev,
      artwork: {
        fileName: `${newDesign.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
        imageUrl: newDesign.imageUrl,
      },
    }));
  };

  const handleSelectDesign = (selected: GeneratedDesign) => {
    setActiveDesign(selected);

    const prevA = workflowProducts['workflow-a'];
    const updatedA: UnifiedProductRecord = {
      ...prevA,
      designName: selected.title,
      workflowMode: 'workflow-a',
      design: {
        ...prevA.design,
        id: selected.id,
        title: selected.title,
        prompt: selected.prompt,
        localUrl: selected.imageUrl,
        sourceUrl: selected.sourceUrl,
        niche: selected.niche,
        aspectRatio: selected.aspectRatio,
      },
    };
    handleUpdateProduct(updatedA, 'workflow-a');

    setMockupWorkflow((prev) => ({
      ...prev,
      artwork: {
        fileName: `${selected.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
        imageUrl: selected.imageUrl,
      },
    }));
  };

  const handleDeleteDesign = (id: string) => {
    setDesigns((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (activeDesign?.id === id) {
        setActiveDesign(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
  };

  // Action button to send design directly to Mockup Generation step
  const handleSendDesignToMockup = (design: GeneratedDesign) => {
    handleSelectDesign(design);
    setPipelineStep('mockup');
  };

  // Mockup Studio Handlers
  const handleUploadArtwork = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const imageUrl = reader.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      setMockupWorkflow((current) => ({
        ...current,
        artwork: { fileName: file.name, imageUrl },
        generatedMockups: [],
        generatedImageUrl: null,
        generationError: null,
      }));

      const currentRecord = workflowProducts[workflowMode];
      handleUpdateProduct(
        {
          ...currentRecord,
          designName: cleanName,
          workflowMode,
          design: {
            ...currentRecord.design,
            title: cleanName,
            localUrl: imageUrl,
            fileId: '',
            fileUrl: '',
            verified: false,
          },
        },
        workflowMode
      );
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProductReference = (modelId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setMockupWorkflow((current) => ({
        ...current,
        productReferenceImages: {
          ...current.productReferenceImages,
          [modelId]: { fileName: file.name, imageUrl: reader.result as string },
        },
        generatedMockups: [],
        generatedImageUrl: null,
        generationError: null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSceneReference = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setMockupWorkflow((current) => ({
        ...current,
        sceneReferenceImages: [
          ...current.sceneReferenceImages,
          { id: crypto.randomUUID(), fileName: file.name, imageUrl: reader.result as string },
        ],
        generatedMockups: [],
        generatedImageUrl: null,
        generationError: null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateMockups = async () => {
    const request = mockupWorkflow;
    if (
      !request.artwork ||
      request.productReferenceIds.length === 0 ||
      !request.sceneDescription.trim()
    ) {
      setMockupWorkflow((current) => ({
        ...current,
        generationError: 'Upload artwork, select at least one case model, and describe the scene.',
      }));
      return;
    }

    const references = request.productReferenceIds
      .map((id) => PRINTIFY_TEMPLATES.find((reference) => reference.id === id))
      .filter((reference) => reference !== undefined);

    const generatedMockups: GeneratedWorkflowMockup[] = references.map((reference) => ({
      modelId: reference.id,
      modelName: reference.modelName,
      sceneTitle: `${reference.modelName} scene`,
      prompt: request.sceneDescription,
      imageUrl: null,
      status: 'generating',
    }));

    setMockupWorkflow((current) => ({
      ...current,
      generatedMockups,
      generatedImageUrl: null,
      isGenerating: true,
      generationProgress: `Preparing ${references.length} case scenes...`,
      generationError: null,
    }));

    try {
      for (const [index, reference] of references.entries()) {
        setMockupWorkflow((current) => ({
          ...current,
          generationProgress: `Generating ${reference.modelName} scene (${index + 1} of ${references.length})...`,
        }));

        try {
          const { imageUrl } = await generateCaseScene(
            request.artwork.imageUrl,
            request.sceneDescription,
            reference.id,
            index + 1,
            request.productReferenceImages[reference.id]?.imageUrl,
            request.sceneReferenceImages.map((image) => image.imageUrl)
          );

          generatedMockups[index] = {
            ...generatedMockups[index],
            imageUrl,
            status: 'generated',
          };
        } catch (error) {
          generatedMockups[index] = {
            ...generatedMockups[index],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Scene generation failed.',
          };
        }

        setMockupWorkflow((current) => ({ ...current, generatedMockups: [...generatedMockups] }));
      }

      setMockupWorkflow((current) => ({
        ...current,
        activeStep: 'preview-result',
        generatedMockups,
        generatedImageUrl: generatedMockups.find((m) => m.imageUrl)?.imageUrl ?? null,
        isGenerating: false,
        generationProgress: null,
      }));

      // Synchronize generated mockups into centralized product model slots (0..5)
      const currentRecord = workflowProducts[workflowMode];
      const successfulMockups = generatedMockups
        .filter((m) => m.imageUrl)
        .slice(0, 6)
        .map((m, slotIndex) => {
          // Check if product already has an existing Drive fileId for this slot
          const existingSlot = currentRecord.mockups.find((item) => item.slotIndex === slotIndex);
          return {
            slotIndex,
            modelId: m.modelId,
            modelName: m.modelName,
            sceneTitle: m.sceneTitle,
            prompt: m.prompt,
            localUrl: m.imageUrl,
            fileId: existingSlot?.fileId || '',
            fileUrl: existingSlot?.fileUrl || '',
            verified: Boolean(existingSlot?.fileId),
            status: 'generated' as const,
          };
        });

      const updatedProduct: UnifiedProductRecord = {
        ...currentRecord,
        mockups: successfulMockups,
        printify: {
          ...currentRecord.printify,
          selectedModels: references.map((r) => r.modelName),
        },
      };
      handleUpdateProduct(updatedProduct, workflowMode);
    } catch (err: any) {
      setMockupWorkflow((current) => ({
        ...current,
        isGenerating: false,
        generationProgress: null,
        generationError: err.message || 'Mockup generation failed.',
      }));
    }
  };

  const handleRegenerateMockup = async (modelId: string) => {
    if (!mockupWorkflow.artwork) return;
    const index = mockupWorkflow.generatedMockups.findIndex((item) => item.modelId === modelId);
    if (index < 0) return;

    setMockupWorkflow((current) => ({
      ...current,
      generatedMockups: current.generatedMockups.map((item) =>
        item.modelId === modelId ? { ...item, status: 'generating', error: undefined } : item
      ),
    }));

    try {
      const { imageUrl } = await generateCaseScene(
        mockupWorkflow.artwork.imageUrl,
        mockupWorkflow.sceneDescription,
        modelId,
        index + 1,
        mockupWorkflow.productReferenceImages[modelId]?.imageUrl,
        mockupWorkflow.sceneReferenceImages.map((image) => image.imageUrl)
      );

      setMockupWorkflow((current) => ({
        ...current,
        generatedMockups: current.generatedMockups.map((item) =>
          item.modelId === modelId ? { ...item, imageUrl, status: 'generated', error: undefined } : item
        ),
        generatedImageUrl: imageUrl,
      }));

      // Update specific mockup slot in product record
      const currentRecord = workflowProducts[workflowMode];
      const updatedMockups = currentRecord.mockups.map((m) =>
        m.modelId === modelId
          ? {
              ...m,
              localUrl: imageUrl,
              fileId: '', // Reset drive fileId so it gets re-uploaded
              fileUrl: '',
              verified: false,
              status: 'generated' as const,
            }
          : m
      );
      handleUpdateProduct({ ...currentRecord, mockups: updatedMockups }, workflowMode);
    } catch (error) {
      setMockupWorkflow((current) => ({
        ...current,
        generatedMockups: current.generatedMockups.map((item) =>
          item.modelId === modelId
            ? { ...item, status: 'failed', error: error instanceof Error ? error.message : 'Scene generation failed.' }
            : item
        ),
      }));
    }
  };

  // Start a fresh product with new sequential Product ID
  const handleStartNewProduct = () => {
    const nextProduct = createInitialProductRecord(
      workflowMode === 'workflow-a' ? (activeDesign?.title || 'New AI Phone Case Art') : 'New Custom Phone Case Art',
      workflowMode === 'workflow-a' ? (activeDesign?.prompt || '') : '',
      workflowMode === 'workflow-a' ? (activeDesign?.imageUrl || '') : '',
      workflowMode
    );
    handleUpdateProduct(nextProduct, workflowMode);
    setPipelineStep('design');
  };

  const handleDownloadDesignAndMockups = async () => {
    const designUrl = activeDesign?.imageUrl || product.design.localUrl;
    const generatedMockups = mockupWorkflow.generatedMockups
      .filter((mockup) => mockup.imageUrl)
      .map((mockup) => ({ name: mockup.modelName, imageUrl: mockup.imageUrl as string }));
    const savedMockups = product.mockups
      .filter((mockup) => mockup.localUrl)
      .map((mockup) => ({ name: mockup.modelName, imageUrl: mockup.localUrl as string }));
    const mockups = generatedMockups.length > 0 ? generatedMockups : savedMockups;

    if (!designUrl || mockups.length === 0) return;

    setIsDownloadingAssets(true);
    setAssetDownloadError(null);

    try {
      const zip = new JSZip();
      const safeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image';
      const addImage = async (folder: string, name: string, imageUrl: string) => {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Could not download ${name} (${response.status}).`);
        const image = await response.blob();
        if (!image.type.startsWith('image/')) throw new Error(`${name} is not a valid image file.`);
        const extension = image.type.includes('jpeg') ? 'jpg' : image.type.split('/')[1] || 'png';
        zip.file(`${folder}/${safeName(name)}.${extension}`, image);
      };

      const designName = activeDesign?.title || product.design.title || 'design';
      await addImage('design', designName, designUrl);
      await Promise.all(
        mockups.map((mockup, index) =>
          addImage('mockups', `${String(index + 1).padStart(2, '0')}-${mockup.name}`, mockup.imageUrl),
        ),
      );
      zip.file('product-info.json', JSON.stringify({
        productId: product.productId,
        design: designName,
        mockups: mockups.map((mockup) => mockup.name),
        exportedAt: new Date().toISOString(),
      }, null, 2));

      const archive = await zip.generateAsync({ type: 'blob' });
      const archiveUrl = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = archiveUrl;
      link.download = `${safeName(product.productId)}-design-and-mockups.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(archiveUrl), 30_000);
    } catch (error) {
      console.error('Could not prepare design and mockup downloads:', error);
      setAssetDownloadError(error instanceof Error ? error.message : 'Could not prepare the asset download.');
    } finally {
      setIsDownloadingAssets(false);
    }
  };

  const hasDownloadableMockups = mockupWorkflow.generatedMockups.some((mockup) => mockup.imageUrl) ||
    product.mockups.some((mockup) => mockup.localUrl);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Unified 5-Stage Pipeline Header */}
      <WorkflowNav
        currentStep={pipelineStep}
        onSelectStep={setPipelineStep}
        productId={product.productId}
        hasDesign={Boolean(product.design.localUrl)}
        mockupsCount={product.mockups.length}
        hasDriveAssets={Boolean(product.design.fileId && product.mockups.some((m) => m.fileId))}
        hasListing={Boolean(product.listing.title && product.listing.description)}
        isReadyForExport={Boolean(
          product.design.fileId &&
            product.mockups.length > 0 &&
            product.mockups.every((m) => m.fileId) &&
            product.listing.title &&
            product.listing.tags.filter((t) => t.trim()).length === 13
        )}
        printifyCreated={Boolean(product.automation.printifyProductId)}
        googleConnected={Boolean(googleToken)}
        googleEmail={googleEmail}
        onConnectGoogle={handleConnectGoogle}
        currentWorkflowMode={workflowMode}
        onSelectWorkflowMode={handleSelectWorkflowMode}
      />

      {/* Main View Area Rendered by Pipeline Step */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Design Generation */}
        {pipelineStep === 'design' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  Step 1: Design Generation &amp; Artwork Setup
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Create AI artwork or upload custom artwork for Product <span className="font-mono text-indigo-300 font-semibold">{product.productId}</span>.
                </p>
              </div>

              {/* Workflow Mode / Source Toggle */}
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectWorkflowMode('workflow-a')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    workflowMode === 'workflow-a'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Design Studio (Workflow A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectWorkflowMode('workflow-b')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    workflowMode === 'workflow-b' || workflowMode === 'workflow-c'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Design (Workflow B &amp; C)</span>
                </button>
              </div>
            </div>

            {designTab === 'ai' ? (
              <DesignStudio
                activeDesign={activeDesign}
                designs={designs}
                onSelectDesign={handleSelectDesign}
                onDeleteDesign={handleDeleteDesign}
                onDesignGenerated={handleDesignGenerated}
                onSendToMockup={handleSendDesignToMockup}
              />
            ) : (
              <CustomDesignUpload
                product={product}
                onUpdateProduct={handleUpdateProduct}
                onApplyDesignToMockup={() => setPipelineStep('mockup')}
              />
            )}
          </div>
        )}

        {/* Step 2: Mockup Generation */}
        {pipelineStep === 'mockup' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  Step 2: Printify Product Mockup &amp; Custom Media
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Generate AI lifestyle scenes or upload your own custom mockup gallery for <span className="font-mono text-indigo-300 font-semibold">{product.productId}</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Sub-tabs toggle */}
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMockupTab('ai');
                      if (workflowMode === 'workflow-c') handleSelectWorkflowMode('workflow-b');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      mockupTab === 'ai'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Lifestyle Studio (Workflow A &amp; B)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMockupTab('upload');
                      handleSelectWorkflowMode('workflow-c');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      mockupTab === 'upload'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Upload Custom Mockups (Workflow C)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadDesignAndMockups}
                  disabled={isDownloadingAssets || !hasDownloadableMockups || !(activeDesign?.imageUrl || product.design.localUrl)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {isDownloadingAssets ? 'Preparing ZIP…' : 'Download design + mockups'}
                </button>
              </div>
            </div>
            {assetDownloadError && <p role="alert" className="text-sm text-rose-300">{assetDownloadError}</p>}

            {mockupTab === 'ai' ? (
              <WorkflowStudio
                workflow={mockupWorkflow}
                onSelectStep={(activeStep) => setMockupWorkflow((current) => ({ ...current, activeStep }))}
                onUploadArtwork={handleUploadArtwork}
                onUploadProductReference={handleUploadProductReference}
                onUploadSceneReference={handleUploadSceneReference}
                onRemoveSceneReference={(imageId) =>
                  setMockupWorkflow((current) => ({
                    ...current,
                    sceneReferenceImages: current.sceneReferenceImages.filter((image) => image.id !== imageId),
                    generatedMockups: [],
                    generatedImageUrl: null,
                  }))
                }
                onGenerate={handleGenerateMockups}
                onToggleReference={(productReferenceId) =>
                  setMockupWorkflow((current) => ({
                    ...current,
                    productReferenceIds: current.productReferenceIds.includes(productReferenceId)
                      ? current.productReferenceIds.filter((id) => id !== productReferenceId)
                      : [...current.productReferenceIds, productReferenceId],
                    generatedMockups: [],
                    generatedImageUrl: null,
                  }))
                }
                onSelectAllReferences={(productReferenceIds) =>
                  setMockupWorkflow((current) => ({
                    ...current,
                    productReferenceIds,
                    generatedMockups: [],
                    generatedImageUrl: null,
                  }))
                }
                onChangeSceneDescription={(sceneDescription) =>
                  setMockupWorkflow((current) => ({
                    ...current,
                    sceneDescription,
                  }))
                }
                onRemoveProductReference={(modelId) =>
                  setMockupWorkflow((current) => {
                    const productReferenceImages = { ...current.productReferenceImages };
                    delete productReferenceImages[modelId];
                    return { ...current, productReferenceImages };
                  })
                }
                onRegenerateMockup={handleRegenerateMockup}
                onRemoveMockup={(modelId) =>
                  setMockupWorkflow((current) => ({
                    ...current,
                    generatedMockups: current.generatedMockups.filter((item) => item.modelId !== modelId),
                  }))
                }
                onContinueToDrive={() => setPipelineStep('drive')}
              />
            ) : (
              <CustomMockupManager
                product={product}
                onUpdateProduct={handleUpdateProduct}
                onProceedToReview={() => setPipelineStep('listing')}
              />
            )}
          </div>
        )}

        {/* Step 3: Google Drive Canonical Storage */}
        {pipelineStep === 'drive' && (
          <DriveAssetManager
            product={product}
            workflowMode={workflowMode}
            onSelectWorkflowMode={handleSelectWorkflowMode}
            googleToken={googleToken}
            onConnectGoogle={handleConnectGoogle}
            onUpdateProduct={handleUpdateProduct}
            onContinueToListing={() => setPipelineStep('listing')}
          />
        )}

        {/* Step 4: Generate Etsy Listing Information */}
        {pipelineStep === 'listing' && (
          <ListingWorkspace
            product={product}
            workflowMode={workflowMode}
            onSelectWorkflowMode={handleSelectWorkflowMode}
            onUpdateProduct={handleUpdateProduct}
            onContinueToExport={() => setPipelineStep('export')}
          />
        )}

        {/* Step 5: Export to Google Sheets for Make.com */}
        {pipelineStep === 'export' && (
          <SheetsExportWorkspace
            product={product}
            workflowMode={workflowMode}
            onSelectWorkflowMode={handleSelectWorkflowMode}
            workflowProducts={workflowProducts}
            googleToken={googleToken}
            onConnectGoogle={handleConnectGoogle}
            onUpdateProduct={handleUpdateProduct}
            onStartNewProduct={handleStartNewProduct}
          />
        )}

        {/* Step 6: Printify Validation & Publishing */}
        {pipelineStep === 'printify' && (
          <div className="space-y-8">
            <FinalValidationPreview
              product={product}
              onUpdateProduct={handleUpdateProduct}
              onNavigateToStep={(step) => setPipelineStep(step)}
            />
            
            <div className="border-t border-slate-800 pt-8">
              <PrintifyPublishPanel product={product} designs={designs} onUpdateProduct={handleUpdateProduct} />
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>
          CaseCraft Unified Studio • DESIGN GENERATION → MOCKUPS → GOOGLE DRIVE → ETSY LISTING → GOOGLE SHEETS → MAKE.COM
        </p>
      </footer>
    </div>
  );
}
