import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Star,
  StarOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Eye,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { PRINTIFY_TEMPLATES, PrintifyTemplateRef, findPrintifyTemplate } from '../data/printifyReferences';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';

interface CustomMockupManagerProps {
  product: UnifiedProductRecord;
  onUpdateProduct: (updated: UnifiedProductRecord) => void;
  onProceedToReview?: () => void;
}

export const CustomMockupManager: React.FC<CustomMockupManagerProps> = ({
  product,
  onUpdateProduct,
  onProceedToReview,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMockupIndex, setSelectedMockupIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mockups = product.mockups || [];

  const handleUploadMockups = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const validFiles = files.filter((f) => validExtensions.includes(f.type) || f.name.endsWith('.svg'));

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Supported formats are PNG, JPG, WebP, and SVG.');
    }

    if (!validFiles.length) return;

    let processedCount = 0;
    const newMockupItems: UnifiedProductRecord['mockups'] = [];

    validFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        // Auto-detect phone model from file name if possible, else default to product's selected model or iPhone 15 Pro Max
        const lowerName = file.name.toLowerCase();
        let matchedTemplate: PrintifyTemplateRef | undefined = undefined;

        for (const t of PRINTIFY_TEMPLATES) {
          const cleanModel = t.modelName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanFile = lowerName.replace(/[^a-z0-9]/g, '');
          if (cleanFile.includes(cleanModel)) {
            matchedTemplate = t;
            break;
          }
        }

        const defaultTemplate =
          matchedTemplate ||
          findPrintifyTemplate(product.printify.selectedModels?.[0] || 'iPhone 15 Pro Max') ||
          PRINTIFY_TEMPLATES[0];

        const slotIndex = mockups.length + newMockupItems.length;
        const isFirstOverall = mockups.length === 0 && newMockupItems.length === 0;

        newMockupItems.push({
          slotIndex,
          modelId: defaultTemplate.id,
          modelName: defaultTemplate.modelName,
          sceneTitle: file.name.replace(/\.[^/.]+$/, ''),
          prompt: 'User uploaded custom product mockup',
          localUrl: dataUrl,
          fileId: '',
          fileUrl: '',
          verified: false,
          status: 'generated',
          isPrimary: isFirstOverall,
          sourceType: 'user-upload',
          originalFileName: file.name,
        });

        processedCount++;
        if (processedCount === validFiles.length) {
          // Re-index all slots
          const combined = [...mockups, ...newMockupItems].map((m, i) => ({
            ...m,
            slotIndex: i,
          }));

          // Make sure exactly one mockup is marked primary
          if (!combined.some((m) => m.isPrimary) && combined.length > 0) {
            combined[0].isPrimary = true;
          }

          onUpdateProduct({
            ...product,
            mockups: combined,
          });

          setNotice(`Successfully added ${validFiles.length} custom mockup${validFiles.length > 1 ? 's' : ''}!`);
          setTimeout(() => setNotice(null), 4000);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSetPrimary = (index: number) => {
    const updated = mockups.map((m, i) => ({
      ...m,
      isPrimary: i === index,
    }));

    // Move primary to index 0 so it's the main listing image
    const [primaryItem] = updated.splice(index, 1);
    updated.unshift(primaryItem);

    // Re-index slots
    const reindexed = updated.map((m, i) => ({ ...m, slotIndex: i }));

    onUpdateProduct({
      ...product,
      mockups: reindexed,
    });

    setNotice(`"${primaryItem.sceneTitle || primaryItem.modelName}" set as primary listing image.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleMoveMockup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mockups.length) return;

    const list = [...mockups];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reindexed = list.map((m, i) => ({ ...m, slotIndex: i }));
    onUpdateProduct({
      ...product,
      mockups: reindexed,
    });
  };

  const handleRemoveMockup = (index: number) => {
    const list = mockups.filter((_, i) => i !== index);
    if (list.length > 0 && !list.some((m) => m.isPrimary)) {
      list[0].isPrimary = true;
    }
    const reindexed = list.map((m, i) => ({ ...m, slotIndex: i }));

    onUpdateProduct({
      ...product,
      mockups: reindexed,
    });
  };

  const handleChangeModelAssociation = (index: number, newModelId: string) => {
    const template = findPrintifyTemplate(newModelId);
    if (!template) return;

    const list = mockups.map((m, i) => {
      if (i === index) {
        return {
          ...m,
          modelId: template.id,
          modelName: template.modelName,
        };
      }
      return m;
    });

    onUpdateProduct({
      ...product,
      mockups: list,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800/60 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Custom Mockup Library
              </span>
              <span className="text-xs text-slate-400">Workflow C & Hybrid</span>
            </div>
            <h2 className="text-xl font-bold text-white">Upload & Manage Your Custom Mockup Images</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Provide your own professionally shot or rendered mockups (JPG, PNG, SVG, WebP). Associate mockups with specific phone models, select the primary main image, and reorder listing media.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUploadMockups}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-purple-600/20"
            >
              <Upload className="w-4 h-4" />
              Upload Mockup Images
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-800/60 text-purple-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Mockup Gallery Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Product Mockups & Media Gallery ({mockups.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The primary mockup is used as the cover photo for your Printify product and Etsy listing.
            </p>
          </div>

          {mockups.length > 0 && onProceedToReview && (
            <button
              type="button"
              onClick={onProceedToReview}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" /> Review & Create Listing
            </button>
          )}
        </div>

        {mockups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <ImageIcon className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No Custom Mockups Uploaded Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              If you have finished mockups created in Photoshop, Placeit, or photography studios, upload them directly here to associate them with your Printify product.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
            >
              <Upload className="w-3.5 h-3.5" /> Choose Mockup Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockups.map((mockup, idx) => {
              const isPrimary = Boolean(mockup.isPrimary || idx === 0);
              return (
                <div
                  key={`${mockup.slotIndex}-${idx}`}
                  className={`rounded-xl border overflow-hidden transition-all flex flex-col bg-slate-950 ${
                    isPrimary
                      ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xl shadow-purple-950/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Image Preview Area */}
                  <div className="relative aspect-4/3 bg-slate-900 overflow-hidden flex items-center justify-center group">
                    {mockup.localUrl ? (
                      <img
                        src={mockup.localUrl}
                        alt={mockup.sceneTitle || mockup.modelName}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[10px] mt-1">Pending rendering</span>
                      </div>
                    )}

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute top-2.5 left-2.5 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" /> PRIMARY IMAGE
                      </div>
                    )}

                    {/* Reorder & Action Buttons */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveMockup(idx, 'up')}
                        title="Move Earlier in Gallery"
                        className="p-1 rounded bg-black/60 hover:bg-black/90 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === mockups.length - 1}
                        onClick={() => handleMoveMockup(idx, 'down')}
                        title="Move Later in Gallery"
                        className="p-1 rounded bg-black/60 hover:bg-black/90 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMockup(idx)}
                        title="Remove Mockup"
                        className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] text-slate-400 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                      <span className="truncate mr-2 font-mono">Slot #{idx + 1}</span>
                      <span className="uppercase text-[9px] font-semibold tracking-wider text-slate-300">
                        {mockup.sourceType === 'user-upload' ? 'Custom Upload' : 'AI Rendered'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content & Model Association */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">Associated Phone Model:</span>
                      </div>
                      
                      {/* Model Association Dropdown */}
                      <div className="relative">
                        <select
                          value={mockup.modelId || 'iphone-15-pro-max'}
                          onChange={(e) => handleChangeModelAssociation(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                        >
                          <optgroup label="Apple iPhone">
                            {PRINTIFY_TEMPLATES.filter((t) => t.brand === 'apple').map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.modelName}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Samsung Galaxy">
                            {PRINTIFY_TEMPLATES.filter((t) => t.brand === 'samsung').map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.modelName}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                        File: {mockup.originalFileName || mockup.sceneTitle || 'mockup.png'}
                      </p>
                    </div>

                    {/* Bottom Action: Set as Primary */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {!isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5 transition"
                        >
                          <Star className="w-3.5 h-3.5" /> Set as Primary Image
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Main Listing Cover
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
