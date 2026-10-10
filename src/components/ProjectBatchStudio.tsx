import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  FolderUp,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Maximize2,
  RefreshCw,
  Terminal,
  Play,
  Check,
  Eye,
  Sliders,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Copy,
  FolderCheck,
  UploadCloud,
  FileText,
  Tag,
  DollarSign,
  Palette,
  X,
  Clock,
} from 'lucide-react';
import {
  TARGET_DEVICE_MODELS_34,
  generate26VariantsForDesign,
  PRODUCTION_THEMES,
  DeviceModelSpec,
  DesignVariantSpec,
  ProductionThemePreset,
} from '../data/projectPublishingData';
import {
  ProjectDesignItem,
  generateProjectExcelWorkbook,
  createProjectZipArchive,
  pushProjectToGoogleDrive,
  generateProceduralCanvasDesign,
} from '../services/projectPackagingService';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';
import * as XLSX from 'xlsx';

interface ProjectBatchStudioProps {
  onSelectDesignForWorkflow?: (design: ProjectDesignItem) => void;
  googleToken: string | null;
  googleEmail?: string;
  onConnectGoogle?: () => void;
  printifyToken?: string;
}

export const ProjectBatchStudio: React.FC<ProjectBatchStudioProps> = ({
  onSelectDesignForWorkflow,
  googleToken,
  googleEmail,
  onConnectGoogle,
  printifyToken,
}) => {
  // 1. Generation Parameters
  const [selectedThemeId, setSelectedThemeId] = useState<string>(PRODUCTION_THEMES[0].id);
  const currentTheme = PRODUCTION_THEMES.find((t) => t.id === selectedThemeId) || PRODUCTION_THEMES[0];
  const [batchCount, setBatchCount] = useState<number>(3);
  const [customPrompt, setCustomPrompt] = useState<string>(currentTheme.defaultPrompt);
  const [generationEngine, setGenerationEngine] = useState<'ai-procedural' | 'python-cli'>('ai-procedural');

  // 2. Active Project State
  const [projectName, setProjectName] = useState<string>(
    `${currentTheme.name.replace(/[^a-zA-Z0-9]/g, '_')}_Collection`
  );
  const [designs, setDesigns] = useState<ProjectDesignItem[]>([]);
  const [activePreviewDesign, setActivePreviewDesign] = useState<ProjectDesignItem | null>(null);

  // 3. Review & Preview Controls
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState<boolean>(true);
  const [selectedModelPreview, setSelectedModelPreview] = useState<DeviceModelSpec>(TARGET_DEVICE_MODELS_34[0]);
  const [activeTab, setActiveTab] = useState<'create' | 'review' | 'variants' | 'publish'>('create');

  // 4. Loading & Progress States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ step: string; percent: number } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 5. Python CLI Execution State
  const [pythonLogs, setPythonLogs] = useState<string>('');
  const [isPythonRunning, setIsPythonRunning] = useState<boolean>(false);

  // 6. Publishing & Drive State
  const [isPublishingDrive, setIsPublishingDrive] = useState<boolean>(false);
  const [drivePublishResult, setDrivePublishResult] = useState<{
    folderUrl: string;
    excelUrl: string;
  } | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isDiskExporting, setIsDiskExporting] = useState<boolean>(false);
  const [diskExportPath, setDiskExportPath] = useState<string | null>(null);

  // Keep prompt in sync with theme changes if user hasn't heavily modified it
  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = PRODUCTION_THEMES.find((t) => t.id === themeId);
    if (theme) {
      setCustomPrompt(theme.defaultPrompt);
      setProjectName(`${theme.name.replace(/[^a-zA-Z0-9]/g, '_')}_Collection`);
    }
  };

  // Generate batch designs via in-app engine (Gemini AI API + Procedural Vector Fallback)
  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setPublishMessage(null);
    setDrivePublishResult(null);

    const newDesigns: ProjectDesignItem[] = [];
    const count = Math.max(1, Math.min(batchCount, 12));

    try {
      for (let i = 1; i <= count; i++) {
        setGenerationProgress({
          step: `Generating Design ${i} of ${count}: ${currentTheme.name}...`,
          percent: Math.round(((i - 1) / count) * 100),
        });

        const sku = `CASE-${currentTheme.id.replace('theme-', '').toUpperCase().slice(0, 6)}-${String(i).padStart(3, '0')}`;
        const title = `${currentTheme.sampleTitles[(i - 1) % currentTheme.sampleTitles.length] || currentTheme.name} Vol. ${String(i).padStart(2, '0')}`;
        const description = `✨ ${title} - Premium Tough Phone Case\n\nElevate your device with this stunning ${currentTheme.category} artwork featuring ${currentTheme.characterDescription}. Designed with high-durability protection and edge-to-edge full bleed artwork.\n\n🌟 Features:\n• Dual-layer protection: Impact-resistant outer shell + shock-absorbing liner\n• Full-bleed 9:16 vertical print with rich fade-resistant colors\n• Precision cutouts for camera and all ports\n• Compatible with Qi wireless charging\n\n📱 Supported Devices: All 34 models (iPhone 18 down to 11, Samsung S26 down to S20).\n🎁 Perfect gift for art enthusiasts and collectors.`;
        const tags = [...currentTheme.suggestedTags];

        let imageUrl = '';
        const dimensions = { width: 1344, height: 2389 }; // Print-ready 9:16

        // Try API first
        try {
          const apiRes = await fetch('/api/generate-design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `${customPrompt}\n\nVariation ${i}: Focus character composition variation. Full bleed vertical 9:16 phone case graphic artwork. Zero mockups, no phone bezels.`,
              aspectRatio: '9:16',
            }),
          });
          const apiData = await apiRes.json();
          if (apiRes.ok && apiData.imageUrl) {
            imageUrl = apiData.imageUrl;
          }
        } catch (_) {}

        // If API did not return image (e.g. key missing or quota), use reliable procedural vector engine
        if (!imageUrl) {
          const procedural = generateProceduralCanvasDesign(
            currentTheme.name,
            customPrompt,
            Date.now() + i * 9999
          );
          imageUrl = procedural.dataUrl;
        }

        const designItem: ProjectDesignItem = {
          id: `proj-design-${Date.now()}-${i}`,
          sku,
          title,
          description,
          tags,
          prompt: customPrompt,
          themeId: currentTheme.id,
          imageUrl,
          dimensions,
          aspectRatio: '9:16',
          price: 24.99,
          status: 'approved',
          createdAt: Date.now(),
        };

        newDesigns.push(designItem);
      }

      setDesigns(newDesigns);
      setActivePreviewDesign(newDesigns[0]);
      setActiveTab('review');
      setGenerationProgress({ step: `Successfully generated ${newDesigns.length} designs!`, percent: 100 });
    } catch (err: any) {
      console.error('Batch generation failed:', err);
      setGenerationError(err.message || 'Batch generation encountered an error.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(null), 3000);
    }
  };

  // Run external Python pipeline script
  const handleRunPythonScript = async (engineType: 'gemini_web' | 'master' = 'gemini_web') => {
    setIsPythonRunning(true);
    setGenerationError(null);
    setPythonLogs(
      `[*] Spawning Python Selenium Generator (scripts/gemini_web_selenium.py)...\n` +
      `  * Target Theme:   "${currentTheme.name}" (${batchCount} design${batchCount > 1 ? 's' : ''})\n` +
      `  * Dimensions:     9:16 Vertical Full Bleed (8K Resolution)\n` +
      `  * Safe-Zone:      Lower 65% Focal Subject, Top 35% Camera Clearance\n` +
      `  * Automation:     Chrome Selenium + Google Login\n` +
      `  * Google Drive:   Auto-Sync to CaseCraft Designs Folder\n` +
      `  * Printify:       Auto-Generates Master Products Excel\n\n`
    );

    try {
      const res = await fetch('/api/projects/run-python-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: currentTheme.name,
          count: batchCount,
          engine: engineType,
          syncDrive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Python script failed.');
      }

      setPythonLogs(data.logs || 'Execution completed successfully.\n');

      if (Array.isArray(data.designs) && data.designs.length > 0) {
        const mappedDesigns: ProjectDesignItem[] = data.designs.map((d: any) => ({
          id: d.id,
          sku: d.sku,
          title: d.title,
          description: d.description,
          tags: d.tags || currentTheme.suggestedTags,
          prompt: customPrompt,
          themeId: currentTheme.id,
          imageUrl: d.imageUrl || d.webUrl,
          dimensions: d.dimensions || { width: 1344, height: 2389 },
          aspectRatio: '9:16',
          price: d.price || 24.99,
          status: 'approved',
          createdAt: Date.now(),
        }));

        setDesigns(mappedDesigns);
        setActivePreviewDesign(mappedDesigns[0]);
        setActiveTab('review');
        setPublishMessage(`Python Pipeline generated project "${data.projectName}" with ${mappedDesigns.length} designs!`);
      }
    } catch (err: any) {
      console.error('Python pipeline error:', err);
      setGenerationError(err.message || 'Python pipeline failed.');
      setPythonLogs((prev) => prev + `\n[ERROR]: ${err.message}`);
    } finally {
      setIsPythonRunning(false);
    }
  };

  // Push to Google Drive
  const handlePushToGoogleDrive = async () => {
    if (!googleToken) {
      onConnectGoogle?.();
      return;
    }
    if (designs.length === 0) {
      setGenerationError('Generate or load designs before pushing to Google Drive.');
      return;
    }

    setIsPublishingDrive(true);
    setPublishMessage('Connecting to Google Drive...');

    try {
      const result = await pushProjectToGoogleDrive(
        googleToken,
        projectName,
        designs,
        (status, percent) => {
          setPublishMessage(`${status} (${percent}%)`);
        }
      );

      setDrivePublishResult({
        folderUrl: result.folderUrl,
        excelUrl: result.excelFileUrl,
      });

      // Update local designs state with live Google Drive links
      setDesigns((prev) =>
        prev.map((d) => {
          const match = result.uploadedDesigns.find((u) => u.sku === d.sku);
          return match ? { ...d, driveFileUrl: match.fileUrl, driveFileId: match.fileId } : d;
        })
      );

      setPublishMessage(`Project successfully published to Google Drive! (${result.uploadedDesigns.length} designs + Excel metadata)`);
    } catch (err: any) {
      console.error('Google Drive push failed:', err);
      setGenerationError(err.message || 'Failed to push project to Google Drive.');
    } finally {
      setIsPublishingDrive(false);
    }
  };

  // Export as ZIP Archive
  const handleDownloadZip = async () => {
    if (designs.length === 0) return;
    setIsExportingZip(true);
    try {
      const zipBlob = await createProjectZipArchive(
        projectName,
        designs,
        drivePublishResult?.folderUrl
      );
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}_Publishing_Bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('ZIP generation failed:', err);
      setGenerationError(err.message || 'Failed to export ZIP bundle.');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Save directly to local disk folder via backend API
  const handleSaveToDisk = async () => {
    if (designs.length === 0) return;
    setIsDiskExporting(true);
    setGenerationError(null);

    try {
      const workbook = generateProjectExcelWorkbook(projectName, designs, drivePublishResult?.folderUrl);
      const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      const res = await fetch('/api/projects/export-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          designs,
          excelBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to export folder to disk.');

      setDiskExportPath(data.projectDir);
      setPublishMessage(`Project exported to server disk: ${data.projectDir}`);
    } catch (err: any) {
      console.error('Disk export failed:', err);
      setGenerationError(err.message || 'Failed to export folder to disk.');
    } finally {
      setIsDiskExporting(false);
    }
  };

  // Direct download of Excel workbook only
  const handleDownloadExcelOnly = () => {
    if (designs.length === 0) return;
    const wb = generateProjectExcelWorkbook(projectName, designs, drivePublishResult?.folderUrl);
    XLSX.writeFile(wb, `${projectName}_Master_Metadata.xlsx`);
  };

  const totalCatalogSkus = designs.length * 26;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-violet-600 text-white shadow-lg shadow-amber-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-amber-300 bg-clip-text text-transparent">
                  Project Studio & Batch Publisher
                </h1>
                <p className="text-xs text-slate-400">
                  Generate 9:16 designs, manage 34 models & 26 variants, organize project folders, and publish to Google Drive.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              34 Phone Models
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-950/80 text-violet-300 border border-violet-800">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              26 Variants / Design
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              4-Sheet Excel (.xlsx)
            </span>
            {googleEmail ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Drive: {googleEmail.split('@')[0]}
              </span>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <FolderUp className="w-3.5 h-3.5 text-amber-400" />
                Connect Google Drive
              </button>
            )}
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Prompt & Batch Generator
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'review'
                ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            2. Design Review & Safe-Zone ({designs.length})
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'variants'
                ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            3. 34 Models & 26 Variants Specs
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'publish'
                ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            4. Project Folder & Publishing
          </button>
        </div>
      </div>

      {/* 2. Messages & Alerts */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4">
        {generationError && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Notice</p>
              <p>{generationError}</p>
            </div>
            <button onClick={() => setGenerationError(null)} className="ml-auto text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {publishMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Workflow Update</p>
              <p>{publishMessage}</p>
            </div>
            <button onClick={() => setPublishMessage(null)} className="ml-auto text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {generationProgress && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 mb-4">
            <div className="flex justify-between text-xs text-slate-300 font-medium mb-1.5">
              <span>{generationProgress.step}</span>
              <span>{generationProgress.percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-violet-500 transition-all duration-300"
                style={{ width: `${generationProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Workspace Content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
        {/* TAB 1: CREATE */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Project Details */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-amber-400" />
                  Project Folder & Batch Setup
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Project / Application Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition font-mono"
                    placeholder="e.g. Vitrail_Woodland_Fox_Collection"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Outputs will be saved in a new folder named: <code className="text-amber-400/90">{projectName}_[Timestamp]</code>
                  </p>
                </div>

                {/* Predefined Production Themes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Select Curated Production Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRODUCTION_THEMES.map((theme) => {
                      const isSelected = theme.id === selectedThemeId;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSelectTheme(theme.id)}
                          className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-100 mb-1">{theme.name}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{theme.category}</div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                            <ShieldCheck className="w-3 h-3" />
                            9:16 Character Safe-Zone
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Count & Execution Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Number of Designs
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setBatchCount(num)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                            batchCount === num
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Execution Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGenerationEngine('ai-procedural')}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                          generationEngine === 'ai-procedural'
                            ? 'bg-slate-800 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        In-App Engine
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerationEngine('python-cli')}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                          generationEngine === 'python-cli'
                            ? 'bg-slate-800 border-violet-500 text-violet-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        Python Pipeline CLI
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Editor */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Artwork Generation Prompt (9:16 Vertical Safe-Zone)
                  </label>
                  <span className="text-[11px] text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                    Zero Mockups • Pure Art
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-amber-500 transition resize-y"
                  placeholder="Enter detailed prompt for vertical 9:16 phone case artwork..."
                />

                {/* Prompt Component Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                  <span className="text-slate-500">Theme Elements:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Character: {currentTheme.characterDescription.slice(0, 30)}...
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Safe-Zone: Top 35% halo
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Palette: {currentTheme.colorPalette.slice(0, 25)}...
                  </span>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {generationEngine === 'ai-procedural' ? (
                  <button
                    onClick={handleGenerateBatch}
                    disabled={isGenerating}
                    className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating {batchCount} Designs...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        Generate {batchCount} Designs (In-App Engine)
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRunPythonScript('gemini_web')}
                    disabled={isPythonRunning}
                    className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 text-white shadow-xl shadow-violet-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPythonRunning ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating via Chrome Selenium + Google Drive...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-5 h-5" />
                        Run Selenium Gemini Generator (Chrome + Drive + Excel)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Standards & Live Terminal Log */}
            <div className="lg:col-span-5 space-y-6">
              {/* Production Standards Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Commercial Phone Case Artwork Standard
                </h3>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100">Mandatory Character Element:</strong> Every design features a sentient character centered in the lower 60-65% of the canvas.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100">Top 35% Camera Safe-Zone:</strong> Camera cutouts will occlude the upper canvas. Celestial sky, halo, or mist only in top 35%.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100">Zero In-Art Mockups:</strong> Strict 100% full bleed 9:16 vertical art. No hardware bezels, pedestals, or lifestyle staging.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100">Full 34 Models Support:</strong> Exact dimensions mapped for iPhone 18 down to 11, and Samsung Galaxy S26 down to S20.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100">26 Variants Matrix:</strong> 13 Flagships x 2 Finishes (Glossy + Matte) for high conversion retail catalogs.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Python Terminal Log / Progress Window */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Terminal className="w-4 h-4 text-violet-400" />
                    Automation Script Console
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">python master_pipeline.py</span>
                </div>
                <div className="h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                  {pythonLogs ? (
                    <pre className="whitespace-pre-wrap">{pythonLogs}</pre>
                  ) : (
                    <div className="text-slate-600 italic">
                      CLI logs will stream here when "Run External Python Pipeline Script" is executed. You can also run directly from PowerShell:
                      <br /><br />
                      <span className="text-amber-400 select-all font-mono">
                        python master_pipeline.py --theme "{currentTheme.name}" --count {batchCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESIGN REVIEW & SAFE-ZONE PREVIEW */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {designs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-semibold text-slate-200">No Generated Designs Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click on "1. Prompt & Batch Generator" and generate a batch of designs to preview, inspect safe-zones, and verify dimensions.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition hover:bg-amber-400"
                >
                  Go to Generator
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Design Selection List */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
                    <span>Generated Batch ({designs.length} Designs)</span>
                    <span className="text-amber-400 font-mono">{totalCatalogSkus} Variants Total</span>
                  </div>

                  <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
                    {designs.map((d, index) => {
                      const isSelected = activePreviewDesign?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setActivePreviewDesign(d)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-slate-900 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <img
                            src={d.imageUrl}
                            alt={d.title}
                            className="w-14 h-24 object-cover rounded-lg border border-slate-700 bg-slate-950 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                                {d.sku}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-medium">9:16 Art</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200 truncate">{d.title}</div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {d.dimensions.width} x {d.dimensions.height} px • $24.99
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Interactive Safe-Zone Previewer & Inspector */}
                {activePreviewDesign && (
                  <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {activePreviewDesign.sku}
                          </span>
                          <h3 className="text-base font-bold text-slate-100">{activePreviewDesign.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Dimensions: {activePreviewDesign.dimensions.width} x {activePreviewDesign.dimensions.height} px (9:16 Full Bleed Vertical)
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSafeZoneOverlay(!showSafeZoneOverlay)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            showSafeZoneOverlay
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Safe-Zone Overlay: {showSafeZoneOverlay ? 'ON' : 'OFF'}
                        </button>

                        <select
                          value={selectedModelPreview.modelName}
                          onChange={(e) => {
                            const found = TARGET_DEVICE_MODELS_34.find((m) => m.modelName === e.target.value);
                            if (found) setSelectedModelPreview(found);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
                        >
                          {TARGET_DEVICE_MODELS_34.map((m) => (
                            <option key={m.modelName} value={m.modelName}>
                              {m.brand === 'Apple iPhone' ? ' ' : 'S '} {m.modelName} ({m.dimensionsMm.width}x{m.dimensionsMm.height}mm)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview Canvas with Safe Zone Overlay */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Artwork Canvas */}
                      <div className="md:col-span-5 flex justify-center">
                        <div className="relative w-64 h-[455px] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
                          <img
                            src={activePreviewDesign.imageUrl}
                            alt={activePreviewDesign.title}
                            className="w-full h-full object-cover"
                          />

                          {/* Safe Zone Overlay */}
                          {showSafeZoneOverlay && (
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Top 35% Camera Cutout Safe Zone */}
                              <div className="absolute top-0 inset-x-0 h-[35%] border-b-2 border-dashed border-red-500 bg-red-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center">
                                <div className="text-[10px] font-bold text-red-200 uppercase tracking-wider font-mono">
                                  CAMERA SAFE-ZONE (TOP 35%)
                                </div>
                                <div className="text-[9px] text-red-300/90 mt-0.5">
                                  {selectedModelPreview.modelName} camera module occlusion area
                                </div>
                                {/* Simulated camera cutout shape */}
                                <div className="mt-2 w-16 h-16 rounded-xl border border-red-400/80 bg-black/60 flex items-center justify-center">
                                  <div className="text-[8px] text-slate-400 font-mono">Cutout</div>
                                </div>
                              </div>

                              {/* Lower 65% Character Focal Safe Zone */}
                              <div className="absolute bottom-0 inset-x-0 h-[65%] border-t-2 border-emerald-500/80 bg-emerald-950/10 flex flex-col items-center justify-end p-2 pointer-events-none">
                                <div className="text-[10px] font-bold text-emerald-300 font-mono uppercase bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                                  ✓ SENTIENT CHARACTER FOCAL ZONE (65%)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metadata & Dimension Details */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                          <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            Target Device Dimensions: {selectedModelPreview.modelName}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                            <div>Print Area: <span className="text-slate-200">{selectedModelPreview.printAreaPx.width} x {selectedModelPreview.printAreaPx.height} px</span></div>
                            <div>Physical Case: <span className="text-slate-200">{selectedModelPreview.dimensionsMm.width} x {selectedModelPreview.dimensionsMm.height} mm</span></div>
                            <div>Resolution: <span className="text-slate-200">{selectedModelPreview.dpi} DPI (High Gamut)</span></div>
                            <div>Variant ID: <span className="text-amber-400">{selectedModelPreview.variantId}</span></div>
                          </div>
                        </div>

                        {/* Editable Title */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Etsy & Printify Title
                          </label>
                          <input
                            type="text"
                            value={activePreviewDesign.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setActivePreviewDesign({ ...activePreviewDesign, title: val });
                              setDesigns((prev) =>
                                prev.map((item) => (item.id === activePreviewDesign.id ? { ...item, title: val } : item))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                          />
                        </div>

                        {/* Editable Description */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            5-Part Product Description
                          </label>
                          <textarea
                            rows={4}
                            value={activePreviewDesign.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setActivePreviewDesign({ ...activePreviewDesign, description: val });
                              setDesigns((prev) =>
                                prev.map((item) => (item.id === activePreviewDesign.id ? { ...item, description: val } : item))
                              );
                            }}
                            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                          />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Tags ({activePreviewDesign.tags.length})
                          </label>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {activePreviewDesign.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] border border-slate-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Workflow Action */}
                        {onSelectDesignForWorkflow && (
                          <div className="pt-2">
                            <button
                              onClick={() => onSelectDesignForWorkflow(activePreviewDesign)}
                              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
                            >
                              <Layers className="w-4 h-4 text-amber-400" />
                              Load Design into Mockup & Listing Workspaces
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VARIANTS & 34 DEVICE MODELS BREAKDOWN */}
        {activeTab === 'variants' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 34 Phone Models List */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-200">
                      34 Certified Phone Case Models (Blueprint 269)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    100% Complete Lineup
                  </span>
                </div>

                <div className="max-h-[550px] overflow-y-auto pr-1 space-y-2">
                  {TARGET_DEVICE_MODELS_34.map((model, idx) => (
                    <div
                      key={model.modelName}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                          {model.modelName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {model.dimensionsMm.width} x {model.dimensionsMm.height} mm • {model.printAreaPx.width} x {model.printAreaPx.height} px
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          ID: {model.variantId}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">300 DPI 9:16</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 26 Commercial Variants Matrix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-violet-400" />
                    <h3 className="text-sm font-bold text-slate-200">
                      26 Variants Matrix per Design
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-violet-400 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-800">
                    13 Flagships × 2 Finishes
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Each generated design automatically produces 26 retail SKUs across glossy and matte finishes for top-converting Apple and Samsung devices:
                </p>

                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2">
                  {generate26VariantsForDesign(activePreviewDesign?.sku || 'CASE-SAMPLE').map((v) => (
                    <div
                      key={v.variantIndex}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">#{v.variantIndex}</span>
                          {v.modelName}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              v.finish === 'Glossy'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {v.finish}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {v.skuSuffix}
                        </div>
                      </div>
                      <div className="text-right font-mono text-slate-300">
                        ${v.msrp} USD
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROJECT FOLDER & PUBLISHING */}
        {activeTab === 'publish' && (
          <div className="space-y-8">
            {/* Folder Structure Visualizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-slate-200">
                    Standardized Project Folder Architecture
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Ready for Google Drive & Local Storage
                </span>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-amber-400 font-bold">📁 {projectName}_[Timestamp]/</div>
                <div className="pl-6 text-slate-400">├── 📊 {projectName}_Master_Metadata.xlsx <span className="text-slate-500">(4-sheet Excel: Products, Models, Variants, SEO)</span></div>
                <div className="pl-6 text-slate-400">├── 📄 README_PUBLISHING_MANIFEST.txt <span className="text-slate-500">(Production summary & model list)</span></div>
                <div className="pl-6 text-amber-300 font-semibold">├── 📁 designs/</div>
                {designs.slice(0, 4).map((d) => (
                  <div key={d.id} className="pl-12 text-slate-400">
                    ├── 🖼️ {d.sku}_9x16_Artwork.png <span className="text-slate-500">({d.dimensions.width}x{d.dimensions.height}px)</span>
                  </div>
                ))}
                {designs.length > 4 && (
                  <div className="pl-12 text-slate-500 italic">└── ... and {designs.length - 4} more design PNG files</div>
                )}
                <div className="pl-6 text-violet-300 font-semibold">├── 📁 variants/</div>
                <div className="pl-12 text-slate-400">├── 📁 {designs[0]?.sku || 'CASE-001'}/ <span className="text-slate-500">(variants_manifest.json with 26 SKUs)</span></div>
                <div className="pl-6 text-emerald-300 font-semibold">└── 📁 specs/</div>
                <div className="pl-12 text-slate-400">└── 📋 target_device_models_34.json <span className="text-slate-500">(Exact mm, px, DPI specs)</span></div>
              </div>
            </div>

            {/* Publishing Action Hub */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1: Push to Google Drive */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center mb-3">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Push to Google Drive</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatically create the project folder in Google Drive, upload all 9:16 PNGs + Excel file, and get shareable links.
                  </p>
                </div>

                {drivePublishResult && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Uploaded to Drive!
                    </div>
                    <a
                      href={drivePublishResult.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline break-all flex items-center gap-1 hover:text-blue-300"
                    >
                      Open Google Drive Folder <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <button
                  onClick={handlePushToGoogleDrive}
                  disabled={isPublishingDrive || designs.length === 0}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {isPublishingDrive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Pushing to Drive...
                    </>
                  ) : (
                    <>
                      <FolderUp className="w-4 h-4" />
                      {googleToken ? 'Push Folder to Google Drive' : 'Connect Drive & Push'}
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Export Structured ZIP */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Export Structured ZIP Archive</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Download the complete structured project archive directly to your computer (designs/, variants/, specs/, and .xlsx).
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isExportingZip || designs.length === 0}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isExportingZip ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Packaging ZIP...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Project ZIP (.zip)
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadExcelOnly}
                    disabled={designs.length === 0}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    Download Master Excel Only (.xlsx)
                  </button>
                </div>
              </div>

              {/* Option 3: Save to Local Server Disk */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3">
                    <FolderCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Save to Project Workspace Disk</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Create the folder in <code className="text-emerald-400 font-mono">projects/{projectName}/</code> on the workspace file system for external pipeline scripts.
                  </p>
                </div>

                {diskExportPath && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono break-all">
                    Saved to: <span className="text-emerald-300">{diskExportPath}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveToDisk}
                  disabled={isDiskExporting || designs.length === 0}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {isDiskExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving to Disk...
                    </>
                  ) : (
                    <>
                      <FolderCheck className="w-4 h-4" />
                      Save Folder to Workspace Disk
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
