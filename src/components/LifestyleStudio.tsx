import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Layers,
  Smartphone,
  Shield,
  RefreshCw,
  Download,
  Check,
  ChevronRight,
  Info,
  Sliders,
  Eye,
  Wand2,
  Search,
  CheckSquare,
  Square,
  PackageCheck,
} from 'lucide-react';
import { GeneratedDesign, GeneratedLifestyleMockup, CaseType } from '../types';
import {
  PRINTIFY_TEMPLATES,
  PrintifyTemplateRef,
  getPrintAreaForModel,
  getPrintCutoutDescription,
} from '../data/printifyReferences';
import { LIFESTYLE_SCENARIOS } from '../data/lifestyleScenarios';
import { CASE_TYPE_OPTIONS } from '../data/presets';
import { generateProductMockupCanvas, triggerDownload } from '../utils/exportMockup';

interface LifestyleStudioProps {
  activeDesign: GeneratedDesign;
  onNavigateToGallery?: () => void;
}

export const LifestyleStudio: React.FC<LifestyleStudioProps> = ({
  activeDesign,
  onNavigateToGallery,
}) => {
  // Brand Filter & Model Search
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'apple' | 'samsung'>('all');
  const [modelSearch, setModelSearch] = useState<string>('');

  // Mode: Single vs Batch Catalog Generation
  const [isBatchMode, setIsBatchMode] = useState<boolean>(true);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(() =>
    PRINTIFY_TEMPLATES.map((t) => t.id)
  );

  // Selected Reference Model (Single mode)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    PRINTIFY_TEMPLATES[0]?.id || 'front-iphone-18-pro-max'
  );
  const activeTemplate =
    PRINTIFY_TEMPLATES.find((t) => t.id === selectedTemplateId) || PRINTIFY_TEMPLATES[0];

  // Selected Case Construction
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('tough');
  const activeCaseOption =
    CASE_TYPE_OPTIONS.find((c) => c.id === selectedCaseType) || CASE_TYPE_OPTIONS[0];

  // User-Controlled Scene Prompt
  const [scenePrompt, setScenePrompt] = useState<string>(
    'A young adult standing outdoors talking to a friend while casually holding their phone in one hand. The back of the phone is facing the camera and clearly shows the custom phone case design.'
  );

  // Variations Count (1 or 4 for single mode)
  const [variationCount, setVariationCount] = useState<number>(1);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Results
  const [results, setResults] = useState<GeneratedLifestyleMockup[]>([]);

  // Filter templates
  const filteredTemplates = PRINTIFY_TEMPLATES.filter((t) => {
    if (selectedBrand !== 'all' && t.brand !== selectedBrand) return false;
    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase().trim();
      return (
        t.modelName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.cameraCutout.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Preset Scenario Selection
  const handleSelectScenario = (scenarioPrompt: string) => {
    setScenePrompt(scenarioPrompt);
  };

  // Automatic Scene Selection
  const handleAutoScenario = () => {
    const randomIndex = Math.floor(Math.random() * LIFESTYLE_SCENARIOS.length);
    setScenePrompt(LIFESTYLE_SCENARIOS[randomIndex].prompt);
  };

  // Toggle Batch Selection
  const handleToggleBatchId = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Batch Presets
  const handleSelectBatchPreset = (preset: 'essentials' | 'iphones' | 'samsung' | 'filtered') => {
    if (preset === 'essentials') {
      setSelectedBatchIds(PRINTIFY_TEMPLATES.map((t) => t.id));
    } else if (preset === 'iphones') {
      setSelectedBatchIds(PRINTIFY_TEMPLATES.filter((t) => t.brand === 'apple').map((t) => t.id));
    } else if (preset === 'samsung') {
      setSelectedBatchIds(PRINTIFY_TEMPLATES.filter((t) => t.brand === 'samsung').map((t) => t.id));
    } else if (preset === 'filtered') {
      setSelectedBatchIds(filteredTemplates.map((t) => t.id));
    }
  };

  // Generate Stage 1: Build the clean reference product mockup using exact device & case
  const generateBaseReferenceMockup = async (template: PrintifyTemplateRef): Promise<string> => {
    return await generateProductMockupCanvas(
      {
        artworkUrl: activeDesign.imageUrl,
        device: template.id,
        finish: activeCaseOption.finish,
        frameColorId: 'obsidian-black',
        showMagsafe: false,
        glossIntensity: 75,
      },
      800,
      1000
    );
  };

  // Main Generation Pipeline
  const handleGenerateLifestyle = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    const templatesToGenerate: PrintifyTemplateRef[] = isBatchMode
      ? PRINTIFY_TEMPLATES.filter((t) => selectedBatchIds.includes(t.id))
      : [activeTemplate];

    if (templatesToGenerate.length === 0) {
      setGenerationError('Please select at least one phone case model to generate mockups.');
      setIsGenerating(false);
      return;
    }

    try {
      const generatedItems: GeneratedLifestyleMockup[] = [];

      for (let tIndex = 0; tIndex < templatesToGenerate.length; tIndex++) {
        const targetTemplate = templatesToGenerate[tIndex];
        const targetDims = getPrintAreaForModel(targetTemplate.modelName, selectedCaseType);

        const currentLabel = `${targetTemplate.modelName} (${activeCaseOption.name})`;
        setGenerationProgress(
          templatesToGenerate.length > 1
            ? `Generating catalog variant ${tIndex + 1} of ${templatesToGenerate.length}: ${currentLabel}...`
            : `Synthesizing exact physical geometry for ${currentLabel}...`
        );

        // Stage 1: Synthesize physical product reference with user artwork
        const baseProductMockup = await generateBaseReferenceMockup(targetTemplate);

        const loopCount = isBatchMode ? 1 : variationCount;

        for (let i = 1; i <= loopCount; i++) {
          if (!isBatchMode && variationCount > 1) {
            setGenerationProgress(
              `Generating realistic lifestyle variation ${i} of ${variationCount} for ${targetTemplate.modelName}...`
            );
          }

          const response = await fetch('/api/generate-lifestyle-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              designImageUrl: activeDesign.imageUrl,
              productMockupUrl: baseProductMockup,
              userScenePrompt: scenePrompt,
              modelName: targetTemplate.modelName,
              brand: targetTemplate.brand,
              caseType: activeCaseOption.name,
              dimensions: {
                pixelWidth: targetDims.pixelWidth,
                pixelHeight: targetDims.pixelHeight,
                mmWidth: targetTemplate.dimensions.mmWidth,
                mmHeight: targetTemplate.dimensions.mmHeight,
              },
              cameraCutoutDesc: targetTemplate.cameraCutout.description,
              variationIndex: i,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.imageUrl) {
            throw new Error(data.error || `Failed to generate scene for ${targetTemplate.modelName}`);
          }

          generatedItems.push({
            id: `lifestyle-${Date.now()}-${tIndex}-${i}`,
            sceneTitle: `${targetTemplate.modelName} ${activeCaseOption.name} Lifestyle`,
            userPrompt: scenePrompt,
            modelName: targetTemplate.modelName,
            brand: targetTemplate.brand,
            caseType: selectedCaseType,
            imageUrl: data.imageUrl,
            designId: activeDesign.id,
            designTitle: activeDesign.title,
            createdAt: Date.now(),
            variationIndex: i,
          });
        }
      }

      setResults((prev) => [...generatedItems, ...prev]);
    } catch (err: any) {
      console.error('Lifestyle generation failed:', err);
      let errMsg = err.message || 'Lifestyle generation failed.';
      if (
        errMsg.includes('401') ||
        errMsg.includes('UNAUTHENTICATED') ||
        errMsg.includes('credentials') ||
        errMsg.includes('API key')
      ) {
        errMsg =
          'Authentication required: Please ensure a valid Gemini API key is configured in your environment.';
      }
      setGenerationError(errMsg);
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // Download All Generated Mockups
  const handleDownloadAll = () => {
    results.forEach((item, index) => {
      setTimeout(() => {
        triggerDownload(
          item.imageUrl,
          `${item.modelName.replace(/\s+/g, '_')}_${item.caseType}_lifestyle_${Date.now()}.png`
        );
      }, index * 200);
    });
  };

  const activePrintArea = getPrintAreaForModel(activeTemplate.modelName, selectedCaseType);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800/60 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Printify Catalog Engine
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                {PRINTIFY_TEMPLATES.length} Device Models • {CASE_TYPE_OPTIONS.length} Case Styles
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Phone Case Catalog & Lifestyle Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Synthesizes authentic Printify camera cutout placements, exact print areas (e.g. 1311 × 2220 px),
              and commercial lifestyle mockups for iPhone and Samsung devices across all case styles (Tough, Slim, Clear, Wallet, Eco-friendly).
            </p>
          </div>

          {/* Source Artwork Preview Badge */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="w-10 h-14 rounded bg-black border border-slate-700 overflow-hidden flex-shrink-0">
              <img
                src={activeDesign.imageUrl}
                alt="Source Artwork"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block line-clamp-1">
                {activeDesign.title}
              </span>
              <span className="text-[11px] text-indigo-400">Preserved 100% As Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Select Reference Product & Model */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                Printify Models ({filteredTemplates.length})
              </h3>

              {/* Mode Toggle: Single vs Batch */}
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                <button
                  onClick={() => setIsBatchMode(false)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !isBatchMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setIsBatchMode(true)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                    isBatchMode ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <PackageCheck className="w-3 h-3" /> Batch Pack
                </button>
              </div>
            </div>

            {/* Brand Filter & Search Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setSelectedBrand('apple')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                      selectedBrand === 'apple'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    iPhone
                  </button>
                  <button
                    onClick={() => setSelectedBrand('samsung')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                      selectedBrand === 'samsung'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Samsung
                  </button>
                  <button
                    onClick={() => setSelectedBrand('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                      selectedBrand === 'all'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({PRINTIFY_TEMPLATES.length})
                  </button>
                </div>

                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search Air, S26, 17 Pro..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Batch Quick Presets if Batch Mode */}
              {isBatchMode && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                  <span className="text-slate-400">Quick batch:</span>
                  <button
                    onClick={() => handleSelectBatchPreset('essentials')}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400 hover:bg-slate-800 cursor-pointer"
                  >
                    Top 7 Flagships
                  </button>
                  <button
                    onClick={() => handleSelectBatchPreset('iphones')}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-400 hover:bg-slate-800 cursor-pointer"
                  >
                    All iPhones
                  </button>
                  <button
                    onClick={() => handleSelectBatchPreset('samsung')}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-800 cursor-pointer"
                  >
                    All Samsung
                  </button>
                  <button
                    onClick={() => handleSelectBatchPreset('filtered')}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Select Filtered ({filteredTemplates.length})
                  </button>
                </div>
              )}
            </div>

            {/* Template Grid Selector */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = isBatchMode
                  ? selectedBatchIds.includes(tpl.id)
                  : tpl.id === selectedTemplateId;

                const modelDims = getPrintAreaForModel(tpl.modelName, selectedCaseType);

                return (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      if (isBatchMode) {
                        handleToggleBatchId(tpl.id);
                      } else {
                        setSelectedTemplateId(tpl.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-sky-950/80 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-sky-400 uppercase">
                        {tpl.brand.toUpperCase()}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                      ) : isBatchMode ? (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      ) : null}
                    </div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      {tpl.modelName}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {modelDims.pixelWidth} × {modelDims.pixelHeight} px
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Model Blueprint Spec Info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-white">
                  {isBatchMode
                    ? `${selectedBatchIds.length} Models Selected for Batch`
                    : `${activeTemplate.modelName} Printify Spec`}
                </span>
                <span className="text-sky-400 font-mono font-semibold">
                  {activePrintArea.pixelWidth} × {activePrintArea.pixelHeight} px
                </span>
              </div>
              <p className="text-slate-400 line-clamp-2">
                Cutout: {activeTemplate.cameraCutout.description}
              </p>
              <p className="text-[10px] text-amber-400/90 font-medium">
                Safe Zone: Top 35% safe margin to prevent camera cutout occlusion of characters.
              </p>
            </div>
          </div>

          {/* Step 2: Case Construction Type */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Case Construction Style
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CASE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedCaseType(opt.id)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                    selectedCaseType === opt.id
                      ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold block text-white">{opt.name}</span>
                  <span className="text-[10px] text-indigo-400 line-clamp-1">{opt.badge}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {activeCaseOption.description}
            </p>
          </div>

          {/* Step 3: Scene Description & Quick Scenarios */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                Describe Lifestyle Scene
              </h3>
              <button
                onClick={handleAutoScenario}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Wand2 className="w-3 h-3" /> Auto-Select Scenario
              </button>
            </div>

            <textarea
              rows={3}
              value={scenePrompt}
              onChange={(e) => setScenePrompt(e.target.value)}
              placeholder="e.g. A young adult standing outdoors talking to a friend while casually holding their phone, with the back of the phone case facing the camera..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed resize-none"
            />

            {/* Quick Scenario Chips */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                Example Lifestyle Scenarios:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LIFESTYLE_SCENARIOS.slice(0, 4).map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc.prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
                  >
                    {sc.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Variations Switch (Only for single mode) */}
            {!isBatchMode && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-300">Variations to Generate</span>
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setVariationCount(1)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      variationCount === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    1 Image
                  </button>
                  <button
                    onClick={() => setVariationCount(4)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      variationCount === 4 ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    4 Variations
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {generationError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 space-y-1">
                <p className="font-semibold text-rose-200">Generation Notice</p>
                <p>{generationError}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateLifestyle}
              disabled={isGenerating}
              className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                isGenerating
                  ? 'bg-sky-800 text-sky-200 cursor-wait'
                  : 'bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 hover:from-sky-500 hover:to-violet-500 text-white shadow-sky-600/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="truncate">{generationProgress || 'Synthesizing Mockup...'}</span>
                </>
              ) : isBatchMode ? (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>
                    Generate Full Catalog Pack ({selectedBatchIds.length} Variants • {activeCaseOption.name})
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Generate Lifestyle Mockup ({activeTemplate.modelName} • {activeCaseOption.name})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results Gallery & Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400" />
              Publishing Mockup Catalog
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {results.length} scene{results.length === 1 ? '' : 's'} ready
              </span>
              {results.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All</span>
                </button>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            /* Empty State Guide */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-950/60 border border-sky-800/60 mx-auto flex items-center justify-center text-sky-400">
                <Camera className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-white">No Mockup Catalog Generated Yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Select your Printify phone case models (from iPhone 18 down to Samsung S26/S21),
                  choose your case style (Tough, Slim, Clear, Wallet, Eco-friendly), and generate
                  lifestyle scenes with your artwork accurately applied to the case backplate.
                </p>
              </div>

              {/* Sample Workflow Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-4 max-w-lg mx-auto text-[11px] text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sky-400 font-semibold block mb-0.5">Printify Template</span>
                  Exact print area size & camera opening geometry respected.
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-indigo-400 font-semibold block mb-0.5">Top Safe-Zone</span>
                  Protects character faces & artwork below top 35% cutout.
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-emerald-400 font-semibold block mb-0.5">Publish Ready</span>
                  Complete gallery ready for Printify and Etsy store export.
                </div>
              </div>
            </div>
          ) : (
            /* Generated Results Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col"
                >
                  {/* Image Display */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.sceneTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-semibold text-sky-400">
                      {item.modelName} • {item.caseType}
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{item.sceneTitle}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">
                        "{item.userPrompt}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() =>
                          triggerDownload(
                            item.imageUrl,
                            `${item.modelName.replace(/\s+/g, '_')}-${item.caseType}-lifestyle-${Date.now()}.png`
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-950/40 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
