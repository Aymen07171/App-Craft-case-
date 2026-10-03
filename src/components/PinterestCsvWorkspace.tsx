import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  Eye,
  RefreshCw,
  Share2,
  FileText,
  Tag,
  Info,
  Sheet,
  Key,
  FolderOpen,
  ArrowRight,
  Database,
  Cloud,
  CheckSquare,
  Link2,
} from 'lucide-react';
import {
  PinterestCsvRow,
  PINTEREST_CSV_HEADERS,
  PinterestGenerationOptions,
} from '../types/pinterest';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';
import {
  serializePinterestCsv,
  parsePinterestCsv,
  mapProductToPinterestPins,
  downloadCsvFile,
  SAMPLE_PINTEREST_CSV_ROWS,
} from '../services/pinterestCsvService';
import {
  listSpreadsheets,
  listWorksheets,
  createPinterestSpreadsheet,
  exportPinterestPinsToSpreadsheet,
  readPinterestPinsFromSpreadsheet,
  getSpreadsheetInfo,
  extractSpreadsheetId,
  GoogleSpreadsheetRef,
  GoogleWorksheetRef,
} from '../services/unifiedGoogleService';

interface PinterestCsvWorkspaceProps {
  product?: UnifiedProductRecord;
  workflowProducts?: Record<string, UnifiedProductRecord>;
  googleToken?: string | null;
  googleEmail?: string;
  onConnectGoogle?: () => void;
  onOpenGoogleSettings?: () => void;
}

export const PinterestCsvWorkspace: React.FC<PinterestCsvWorkspaceProps> = ({
  product,
  workflowProducts,
  googleToken,
  googleEmail,
  onConnectGoogle,
  onOpenGoogleSettings,
}) => {
  // Current active rows in workspace
  const [rows, setRows] = useState<PinterestCsvRow[]>(SAMPLE_PINTEREST_CSV_ROWS);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [showRawPreview, setShowRawPreview] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // Auto-generation options
  const [boardName, setBoardName] = useState<string>('Aesthetic Tech & Accessories');
  const [destinationLink, setDestinationLink] = useState<string>('https://myshop.example.com/products/case');
  const [includeDesign, setIncludeDesign] = useState<boolean>(true);
  const [includePrimaryMockup, setIncludePrimaryMockup] = useState<boolean>(true);
  const [includeAllMockups, setIncludeAllMockups] = useState<boolean>(false);
  const [titleFormat, setTitleFormat] = useState<'product-title' | 'title-with-callout' | 'seo-focused'>('title-with-callout');
  const [utmCampaign, setUtmCampaign] = useState<string>('phone_cases_q4');
  const [scheduleIntervalDays, setScheduleIntervalDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Selected row for detail drawer/modal
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Derived current CSV serialization
  const currentSerializedCsv = useMemo(() => {
    return serializePinterestCsv(rows);
  }, [rows]);

  // Validation metrics
  const validationSummary = useMemo(() => {
    let titleWarnings = 0;
    let descWarnings = 0;
    let missingMedia = 0;
    let missingBoard = 0;

    rows.forEach((row) => {
      if (!row.Title || row.Title.length > 100) titleWarnings++;
      if (row.Description && row.Description.length > 500) descWarnings++;
      if (!row['Media URL']) missingMedia++;
      if (!row['Pinterest board']) missingBoard++;
    });

    return {
      total: rows.length,
      titleWarnings,
      descWarnings,
      missingMedia,
      missingBoard,
      isValid: missingMedia === 0 && missingBoard === 0,
    };
  }, [rows]);

  // Handle uploading existing CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = parsePinterestCsv(content);
        if (res.errors.length > 0) {
          setUploadError(`CSV validation error: ${res.errors.join('; ')}`);
          return;
        }
        setRows(res.rows);
        setSuccessMessage(`Successfully imported ${res.rows.length} Pinterest pins from ${file.name}!`);
        if (res.warnings.length > 0) {
          setUploadError(`Imported with warnings: ${res.warnings.slice(0, 3).join('; ')}`);
        }
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Populate from current product
  const handleAutoPopulateFromProduct = (targetProduct?: UnifiedProductRecord) => {
    const prod = targetProduct || product;
    if (!prod) {
      setUploadError('No product selected to populate pins from.');
      return;
    }

    const options: PinterestGenerationOptions = {
      boardName,
      defaultDestinationLink: destinationLink,
      includeDesignAsset: includeDesign,
      includePrimaryMockup: includePrimaryMockup,
      includeAllMockups: includeAllMockups,
      titleFormat,
      descriptionFormat: 'hook-and-tags',
      tagsAsKeywords: true,
      utmCampaign,
      startDate,
      scheduleIntervalDays,
    };

    const generated = mapProductToPinterestPins(prod, options);
    if (generated.length === 0) {
      setUploadError('Could not generate pins: Ensure the product has artwork or generated mockups.');
      return;
    }

    setRows((prev) => [...generated, ...prev]);
    setSuccessMessage(`Generated ${generated.length} Pinterest pin rows for ${prod.productId} (${prod.designName})!`);
  };

  // Populate batch from all workflows
  const handlePopulateAllWorkflows = () => {
    if (!workflowProducts) return;
    const allGenerated: PinterestCsvRow[] = [];

    Object.values(workflowProducts).forEach((prod) => {
      const options: PinterestGenerationOptions = {
        boardName,
        defaultDestinationLink: destinationLink,
        includeDesignAsset: includeDesign,
        includePrimaryMockup: includePrimaryMockup,
        includeAllMockups: includeAllMockups,
        titleFormat,
        descriptionFormat: 'hook-and-tags',
        tagsAsKeywords: true,
        utmCampaign,
        startDate,
        scheduleIntervalDays,
      };
      const pins = mapProductToPinterestPins(prod, options);
      allGenerated.push(...pins);
    });

    if (allGenerated.length > 0) {
      setRows((prev) => [...allGenerated, ...prev]);
      setSuccessMessage(`Batch generated ${allGenerated.length} Pinterest pins from all active product workflows!`);
    }
  };

  // Add empty custom row
  const handleAddRow = () => {
    const newRow: PinterestCsvRow = {
      Title: 'New Aesthetic Phone Case Pin Title',
      'Media URL': product?.mockups?.[0]?.localUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800',
      'Pinterest board': boardName,
      Thumbnail: '',
      Description: 'Discover this unique artistic phone case. Sleek, dual-layer tough protection with vivid wrap art.',
      Link: destinationLink,
      'Publish date': startDate,
      Keywords: 'aesthetic phone case, tough iphone case, gift for her',
    };
    setRows([newRow, ...rows]);
    setActiveRowIndex(0);
  };

  // Remove row
  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
    if (activeRowIndex === index) {
      setActiveRowIndex(null);
    } else if (activeRowIndex !== null && activeRowIndex > index) {
      setActiveRowIndex(activeRowIndex - 1);
    }
  };

  // Update specific field in a row
  const handleUpdateRowField = (index: number, field: keyof PinterestCsvRow, val: string) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setRows(updated);
  };

  // Copy CSV to clipboard
  const handleCopyCsv = () => {
    navigator.clipboard.writeText(currentSerializedCsv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Download official CSV
  const handleDownloadCsv = () => {
    const filename = `pinterest_bulk_pins_${product?.productId || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvFile(currentSerializedCsv, filename);
  };

  // Reset to user's sample template
  const handleResetSample = () => {
    setRows(SAMPLE_PINTEREST_CSV_ROWS);
    setSuccessMessage('Loaded Pinterest sample template.');
  };

  // Google Sheets Integration State
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetRef[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [spreadsheetInputUrl, setSpreadsheetInputUrl] = useState<string>('');
  const [worksheets, setWorksheets] = useState<GoogleWorksheetRef[]>([]);
  const [selectedWorksheetTitle, setSelectedWorksheetTitle] = useState<string>('Pins');
  const [exportMode, setExportMode] = useState<'append' | 'overwrite'>('append');

  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);
  const [isExportingToSheet, setIsExportingToSheet] = useState<boolean>(false);
  const [isImportingFromSheet, setIsImportingFromSheet] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');

  const [sheetSuccessMessage, setSheetSuccessMessage] = useState<string | null>(null);
  const [sheetErrorMessage, setSheetErrorMessage] = useState<string | null>(null);
  const [activeSheetUrl, setActiveSheetUrl] = useState<string | null>(null);
  const [activeSpreadsheetTitle, setActiveSpreadsheetTitle] = useState<string>('');

  // Auto-fetch spreadsheets when googleToken changes
  useEffect(() => {
    if (!googleToken) {
      setSpreadsheets([]);
      return;
    }

    const fetchSpreadsheets = async () => {
      setIsLoadingSheets(true);
      try {
        const list = await listSpreadsheets(googleToken, 'my-drive');
        setSpreadsheets(list);
        if (list.length > 0 && !selectedSpreadsheetId) {
          setSelectedSpreadsheetId(list[0].id);
          setActiveSpreadsheetTitle(list[0].name);
          setActiveSheetUrl(`https://docs.google.com/spreadsheets/d/${list[0].id}/edit`);
        }
      } catch (err: any) {
        console.error('Failed to list spreadsheets:', err);
      } finally {
        setIsLoadingSheets(false);
      }
    };

    fetchSpreadsheets();
  }, [googleToken]);

  // Load worksheets when selectedSpreadsheetId changes
  useEffect(() => {
    if (!googleToken || !selectedSpreadsheetId) {
      setWorksheets([]);
      return;
    }

    const fetchWorksheets = async () => {
      try {
        const sheets = await listWorksheets(googleToken, selectedSpreadsheetId);
        setWorksheets(sheets);
        if (sheets.length > 0) {
          const pinSheet = sheets.find(
            (s) =>
              s.title.toLowerCase().includes('pin') ||
              s.title.toLowerCase().includes('pinterest')
          );
          setSelectedWorksheetTitle(pinSheet ? pinSheet.title : sheets[0].title);
        }
      } catch (err: any) {
        console.error('Failed to list worksheets:', err);
      }
    };

    fetchWorksheets();
  }, [googleToken, selectedSpreadsheetId]);

  // Connect via pasted URL or raw Spreadsheet ID
  const handleConnectSpreadsheetByUrl = async () => {
    if (!googleToken) {
      onConnectGoogle?.();
      return;
    }
    const cleanId = extractSpreadsheetId(spreadsheetInputUrl);
    if (!cleanId) {
      setSheetErrorMessage('Please paste a valid Google Spreadsheet URL or ID.');
      return;
    }

    setIsLoadingSheets(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);
    try {
      const info = await getSpreadsheetInfo(googleToken, cleanId);
      setSelectedSpreadsheetId(info.id);
      setActiveSpreadsheetTitle(info.title);
      setActiveSheetUrl(`https://docs.google.com/spreadsheets/d/${info.id}/edit`);
      setWorksheets(info.sheets);
      if (info.sheets.length > 0) {
        const pinSheet = info.sheets.find(
          (s: GoogleWorksheetRef) =>
            s.title.toLowerCase().includes('pin') ||
            s.title.toLowerCase().includes('pinterest')
        );
        setSelectedWorksheetTitle(pinSheet ? pinSheet.title : info.sheets[0].title);
      }

      setSpreadsheets((prev) => {
        if (prev.some((s) => s.id === info.id)) return prev;
        return [{ id: info.id, name: info.title }, ...prev];
      });

      setSheetSuccessMessage(`Connected to spreadsheet: "${info.title}" (${info.sheets.length} sheets found)`);
    } catch (err: any) {
      setSheetErrorMessage(`Could not access spreadsheet: ${err.message || 'Please check sharing permissions or URL'}`);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Create brand new Pinterest spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!googleToken) {
      onConnectGoogle?.();
      return;
    }
    setIsCreatingSheet(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);
    try {
      const title = newSheetTitle.trim() || `Pinterest Bulk Pins (${new Date().toISOString().split('T')[0]})`;
      const created = await createPinterestSpreadsheet(googleToken, title);
      setSpreadsheets((prev) => [{ id: created.id, name: created.title }, ...prev]);
      setSelectedSpreadsheetId(created.id);
      setActiveSpreadsheetTitle(created.title);
      setActiveSheetUrl(created.url);
      setSelectedWorksheetTitle(created.worksheetTitle);
      setWorksheets([{ id: 0, title: created.worksheetTitle, index: 0 }]);
      setNewSheetTitle('');
      setSheetSuccessMessage(`Created and connected new Pinterest spreadsheet: "${created.title}"!`);
    } catch (err: any) {
      setSheetErrorMessage(`Failed to create spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Export pins to Google Sheet
  const handleExportToSheet = async () => {
    if (!googleToken) {
      onConnectGoogle?.();
      return;
    }
    const targetSpreadsheetId = selectedSpreadsheetId || extractSpreadsheetId(spreadsheetInputUrl);
    if (!targetSpreadsheetId) {
      setSheetErrorMessage('Please select or paste a Google Spreadsheet to export to.');
      return;
    }
    if (rows.length === 0) {
      setSheetErrorMessage('No Pinterest pins in workspace to export. Click "Auto-Populate" or add custom pins first.');
      return;
    }

    setIsExportingToSheet(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);

    try {
      const targetWorksheet = selectedWorksheetTitle || 'Pins';
      const result = await exportPinterestPinsToSpreadsheet(
        googleToken,
        targetSpreadsheetId,
        targetWorksheet,
        rows,
        exportMode
      );
      setActiveSheetUrl(result.spreadsheetUrl);
      setSheetSuccessMessage(
        `Successfully exported ${result.count} Pinterest pins to "${activeSpreadsheetTitle || 'Google Sheet'}" [Tab: ${targetWorksheet}] (${exportMode === 'overwrite' ? 'Overwrote existing data rows' : 'Appended rows to sheet'})!`
      );
    } catch (err: any) {
      setSheetErrorMessage(`Export to Google Sheet failed: ${err.message}`);
    } finally {
      setIsExportingToSheet(false);
    }
  };

  // Import pins from Google Sheet
  const handleImportFromSheet = async () => {
    if (!googleToken) {
      onConnectGoogle?.();
      return;
    }
    const targetSpreadsheetId = selectedSpreadsheetId || extractSpreadsheetId(spreadsheetInputUrl);
    if (!targetSpreadsheetId) {
      setSheetErrorMessage('Please select or paste a Google Spreadsheet to import from.');
      return;
    }

    setIsImportingFromSheet(true);
    setSheetErrorMessage(null);
    setSheetSuccessMessage(null);

    try {
      const targetWorksheet = selectedWorksheetTitle || 'Pins';
      const imported = await readPinterestPinsFromSpreadsheet(
        googleToken,
        targetSpreadsheetId,
        targetWorksheet
      );
      if (imported.length === 0) {
        setSheetErrorMessage(`No pin rows found in "${targetWorksheet}". Make sure row 1 has headers and row 2+ has pin data.`);
        return;
      }
      setRows(imported);
      setActiveRowIndex(0);
      setSheetSuccessMessage(`Successfully imported ${imported.length} Pinterest pins from Google Sheet [${targetWorksheet}]!`);
    } catch (err: any) {
      setSheetErrorMessage(`Import from Google Sheet failed: ${err.message}`);
    } finally {
      setIsImportingFromSheet(false);
    }
  };

  const activeRow = activeRowIndex !== null ? rows[activeRowIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-md shadow-rose-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Share2 className="h-5 w-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Pinterest Bulk Pin CSV Generator</h2>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
                  Step 1: CSV Handler
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate, edit, and validate RFC-4180 bulk creation CSV files directly formatted for Pinterest's uploader.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Google Sheets Status Pill */}
            {googleToken ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-300">
                <Sheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium truncate max-w-[140px]">{googleEmail || 'Google Connected'}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnectGoogle}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 px-3 py-1.5 text-xs font-semibold text-amber-300 transition cursor-pointer"
              >
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>Connect Google Sheets</span>
              </button>
            )}

            <label className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-indigo-400" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleCopyCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              {copiedCsv ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copiedCsv ? 'Copied!' : 'Copy CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportToSheet}
              disabled={isExportingToSheet || rows.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/70 disabled:opacity-50 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition shadow-md shadow-emerald-950/30 cursor-pointer"
            >
              {isExportingToSheet ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              ) : (
                <Sheet className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>{isExportingToSheet ? 'Exporting...' : 'Export to Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition shadow-md shadow-rose-950 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV ({rows.length} Pins)</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {uploadError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p>{uploadError}</p>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Status Metrics Ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Total Pins</span>
            <p className="mt-0.5 text-xl font-bold text-white">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Target Board</span>
            <p className="mt-0.5 text-xs font-medium text-rose-300 truncate" title={boardName}>{boardName}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Specification</span>
            <p className="mt-0.5 text-xs font-medium text-emerald-400">8 Pinterest Headers ✓</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Format Health</span>
            <p className={`mt-0.5 text-xs font-semibold ${validationSummary.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {validationSummary.isValid ? '100% Valid' : 'Missing required fields'}
            </p>
          </div>
        </div>

        {/* Auto-populate Generator Controls */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Automated Pin Population Settings
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetSample}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Load Pinterest Sample Rows
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Pinterest Board Name *
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g. Aesthetic Tech & Accessories"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Destination Product Link *
              </label>
              <input
                type="url"
                value={destinationLink}
                onChange={(e) => setDestinationLink(e.target.value)}
                placeholder="https://myshop.com/products/case"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Pin Title Style
              </label>
              <select
                value={titleFormat}
                onChange={(e) => setTitleFormat(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="title-with-callout">On Device Callout ("On Device • Model | Title")</option>
                <option value="seo-focused">SEO Focused ("Niche • Title")</option>
                <option value="product-title">Direct Product Title</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                UTM Campaign Tag
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="e.g. holiday_cases_2026"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Media Inclusion Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDesign}
                onChange={(e) => setIncludeDesign(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 accent-rose-500"
              />
              <span>Generate Design Art Pin</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePrimaryMockup}
                onChange={(e) => setIncludePrimaryMockup(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 accent-rose-500"
              />
              <span>Generate Primary Lifestyle Mockup Pin</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAllMockups}
                onChange={(e) => setIncludeAllMockups(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 accent-rose-500"
              />
              <span>Generate All Mockup Angles (Slots 1-6)</span>
            </label>
          </div>

          {/* Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleAutoPopulateFromProduct()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-4 py-2 text-xs font-semibold text-white transition shadow-md shadow-rose-950 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Populate Pins from Current Product ({product?.productId || 'Active'})</span>
            </button>

            {workflowProducts && Object.keys(workflowProducts).length > 1 && (
              <button
                type="button"
                onClick={handlePopulateAllWorkflows}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Batch Populate from All Active Workflows</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer ml-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Row</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Live Export & Sync Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Sheet className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Google Spreadsheet Live Export &amp; Sync</h3>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Direct Integration
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect your Pinterest CSV pin records directly with any Google Spreadsheet to export, update, or import bulk pins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleToken ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 font-medium">
                  Connected: {googleEmail || 'Active'}
                </span>
                {onOpenGoogleSettings && (
                  <button
                    type="button"
                    onClick={onOpenGoogleSettings}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
                  >
                    OAuth Settings
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnectGoogle}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/50 hover:bg-amber-900/60 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition cursor-pointer shadow-sm"
              >
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>Connect Google Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {sheetErrorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Google Sheets Sync Error</p>
              <p>{sheetErrorMessage}</p>
            </div>
          </div>
        )}

        {sheetSuccessMessage && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <p>{sheetSuccessMessage}</p>
            </div>
            {activeSheetUrl && (
              <a
                href={activeSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline shrink-0"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Spreadsheet Selector & URL Connect Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Option 1: Paste Spreadsheet Link or ID */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Option 1: Paste Spreadsheet URL or ID</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">e.g. /d/1BxiMVs...</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={spreadsheetInputUrl}
                onChange={(e) => setSpreadsheetInputUrl(e.target.value)}
                placeholder="Paste Google Spreadsheet URL or raw ID here..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleConnectSpreadsheetByUrl}
                disabled={isLoadingSheets || !spreadsheetInputUrl.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                {isLoadingSheets ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Connect</span>
              </button>
            </div>
          </div>

          {/* Option 2: Select from Google Drive */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                <span>Option 2: Select from Google Drive</span>
              </label>
              {selectedSpreadsheetId && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  ID: {selectedSpreadsheetId.slice(0, 8)}...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSpreadsheetId}
                onChange={(e) => {
                  setSelectedSpreadsheetId(e.target.value);
                  const found = spreadsheets.find((s) => s.id === e.target.value);
                  if (found) {
                    setActiveSpreadsheetTitle(found.name);
                    setActiveSheetUrl(`https://docs.google.com/spreadsheets/d/${found.id}/edit`);
                  }
                }}
                disabled={isLoadingSheets || spreadsheets.length === 0}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {spreadsheets.length === 0 ? (
                  <option value="">
                    {googleToken ? 'No spreadsheets found in Drive' : 'Connect Google account to list spreadsheets'}
                  </option>
                ) : (
                  spreadsheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={handleCreateNewSpreadsheet}
                disabled={isCreatingSheet || !googleToken}
                title="Create a new Google Spreadsheet formatted with Pinterest columns"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                {isCreatingSheet ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>New Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Worksheet / Tab & Export Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Target Worksheet/Tab:</span>
              <select
                value={selectedWorksheetTitle}
                onChange={(e) => setSelectedWorksheetTitle(e.target.value)}
                disabled={worksheets.length === 0}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {worksheets.length === 0 ? (
                  <option value="Pins">Pins (Auto-created)</option>
                ) : (
                  worksheets.map((ws) => (
                    <option key={ws.id} value={ws.title}>
                      {ws.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Sync Mode:</span>
              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setExportMode('append')}
                  className={`px-2.5 py-0.5 rounded font-medium transition cursor-pointer ${
                    exportMode === 'append'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Append Rows
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('overwrite')}
                  className={`px-2.5 py-0.5 rounded font-medium transition cursor-pointer ${
                    exportMode === 'overwrite'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Overwrite / Replace
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImportFromSheet}
              disabled={isImportingFromSheet || !selectedSpreadsheetId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 px-3 py-1.5 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              {isImportingFromSheet ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : (
                <Upload className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>Import from Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleExportToSheet}
              disabled={isExportingToSheet || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 px-4 py-1.5 text-xs font-semibold text-white transition shadow-md shadow-emerald-950 cursor-pointer"
            >
              {isExportingToSheet ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sheet className="h-3.5 w-3.5" />
              )}
              <span>Export {rows.length} Pins to Spreadsheet</span>
            </button>

            {activeSheetUrl && (
              <a
                href={activeSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition cursor-pointer"
              >
                <span>View Sheet</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Table & Editor */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Interactive Data Grid (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  CSV Pin Records ({rows.length})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRawPreview(!showRawPreview)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                >
                  {showRawPreview ? 'Show Visual Table' : 'Show Raw CSV Text'}
                </button>
              </div>
            </div>

            {showRawPreview ? (
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
                <pre className="select-all">{currentSerializedCsv}</pre>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Media</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Board</th>
                      <th className="py-2.5 px-3">Keywords</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rows.map((row, idx) => {
                      const isSelected = activeRowIndex === idx;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setActiveRowIndex(idx)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-rose-950/30 text-white'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            {row['Media URL'] ? (
                              <div className="h-10 w-8 rounded overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                                <img
                                  src={row['Media URL']}
                                  alt="Pin Preview"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-400">No Image</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <p className="font-semibold text-white truncate" title={row.Title}>
                              {row.Title || <span className="text-slate-500 italic">Untitled</span>}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {row.Title.length}/100 chars
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300 truncate max-w-[120px] block">
                              {row['Pinterest board']}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[160px]">
                            <span className="truncate block text-[11px] text-slate-400" title={row.Keywords}>
                              {row.Keywords || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRow(idx);
                              }}
                              title="Delete Pin Row"
                              className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Row Quick Inspector / Editor */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Pin Inspector {activeRowIndex !== null ? `(#${activeRowIndex + 1})` : ''}
              </h3>
              {activeRow && (
                <span className="text-[11px] text-rose-300 font-mono">
                  {activeRow['Pinterest board']}
                </span>
              )}
            </div>

            {activeRow ? (
              <div className="space-y-3.5 text-xs">
                {/* Media Image Preview */}
                {activeRow['Media URL'] && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 flex items-center gap-3">
                    <img
                      src={activeRow['Media URL']}
                      alt="Pin Asset"
                      className="h-16 w-12 rounded object-cover border border-slate-700"
                    />
                    <div className="overflow-hidden space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Image Asset URL:</p>
                      <a
                        href={activeRow['Media URL']}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline truncate block"
                      >
                        {activeRow['Media URL']}
                      </a>
                    </div>
                  </div>
                )}

                {/* Edit Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">Title</label>
                    <span className={`text-[10px] font-mono ${activeRow.Title.length > 100 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                      {activeRow.Title.length}/100 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeRow.Title}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Title', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Edit Media URL */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Media URL</label>
                  <input
                    type="url"
                    value={activeRow['Media URL']}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Media URL', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Edit Board */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Pinterest Board</label>
                  <input
                    type="text"
                    value={activeRow['Pinterest board']}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Pinterest board', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Edit Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">Description</label>
                    <span className={`text-[10px] font-mono ${activeRow.Description.length > 500 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                      {activeRow.Description.length}/500 chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={activeRow.Description}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Description', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Edit Link */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Destination Link</label>
                  <input
                    type="url"
                    value={activeRow.Link}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Link', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Edit Keywords */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Keywords (Comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={activeRow.Keywords}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Keywords', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Publish Date */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Publish Date (Optional Scheduled Date)
                  </label>
                  <input
                    type="date"
                    value={activeRow['Publish date']}
                    onChange={(e) => handleUpdateRowField(activeRowIndex!, 'Publish date', e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Select a pin row from the table to inspect and edit details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
