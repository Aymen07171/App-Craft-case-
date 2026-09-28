import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';

type CatalogItem = { id: number | string; title: string; name?: string; is_available?: boolean; is_enabled?: boolean; options?: any; placeholders?: any };
type Shop = { id: number | string; title: string };

interface Props {
  product: UnifiedProductRecord;
  onUpdateProduct: (product: UnifiedProductRecord) => void;
}

async function getPrintify(resource: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ resource, ...params });
  const response = await fetch(`/api/printify?${query}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Printify request failed (${response.status}).`);
  return data;
}

async function imageAsDataUrl(source: string) {
  if (source.startsWith('data:')) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not read generated asset (${response.status}).`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not encode image asset.'));
    reader.onerror = () => reject(new Error('Could not encode image asset.'));
    reader.readAsDataURL(blob);
  });
}

async function uploadPrintifyAsset(fileName: string, image: string) {
  const response = await fetch('/api/printify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', fileName, image }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.imageId) throw new Error(data.error || `Failed to upload ${fileName} to Printify.`);
  return String(data.imageId);
}

function catalogRows(value: any): CatalogItem[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.variants)) return value.variants;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

export const PrintifyPublishPanel: React.FC<Props> = ({ product, onUpdateProduct }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState(product.printify.shopId || '');
  const [blueprints, setBlueprints] = useState<CatalogItem[]>([]);
  const [providers, setProviders] = useState<CatalogItem[]>([]);
  const [variants, setVariants] = useState<CatalogItem[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState('');
  const [variantsReload, setVariantsReload] = useState(0);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const blueprintId = product.printify.blueprintId;
  const providerId = product.printify.printProviderId;
  const enabledVariantIds = useMemo(() => new Set(product.printify.variantIds.map(String)), [product.printify.variantIds]);

  const updatePrintify = (patch: Partial<UnifiedProductRecord['printify']>) => {
    onUpdateProduct({ ...product, printify: { ...product.printify, ...patch } });
  };

  const loadConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getPrintify('connection');
      const nextShops = result.shops || [];
      setShops(nextShops);
      setConfigured(Boolean(result.configured));
      setConnected(Boolean(result.connected));
      const nextShopId = String(nextShops.find((shop: Shop) => String(shop.id) === selectedShopId)?.id || nextShops[0]?.id || '');
      setSelectedShopId(nextShopId);
      if (nextShopId && nextShopId !== product.printify.shopId) updatePrintify({ shopId: nextShopId, status: 'ready', lastError: '' });
      if (result.connected) {
        const list = catalogRows(await getPrintify('blueprints')).filter((item) => /case/i.test(item.title || ''));
        setBlueprints(list);
        if (product.printify.blueprintId && !list.some((item) => String(item.id) === product.printify.blueprintId)) {
          updatePrintify({ blueprintId: '', printProviderId: '', variantIds: [], selectedModels: [] });
        }
      }
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Could not connect to Printify.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadConnection(); }, []);

  useEffect(() => {
    if (!connected || !blueprintId) { setProviders([]); return; }
    let cancelled = false;
    getPrintify('providers', { blueprintId }).then((data) => {
      if (cancelled) return;
      const list = catalogRows(data);
      setProviders(list);
      if (providerId && !list.some((item) => String(item.id) === providerId)) updatePrintify({ printProviderId: '', variantIds: [] });
    }).catch((err) => { if (!cancelled) setError(err.message || 'Could not load print providers.'); });
    return () => { cancelled = true; };
  }, [connected, blueprintId]);

  useEffect(() => {
    if (!connected || !blueprintId || !providerId) {
      setVariants([]);
      setVariantsError('');
      return;
    }
    let cancelled = false;
    setVariants([]);
    setVariantsLoading(true);
    setVariantsError('');
    getPrintify('variants', { blueprintId, providerId }).then((data) => {
      if (cancelled) return;
      const list = catalogRows(data);
      setVariants(list);
      if (!list.length) setVariantsError('Printify returned no variants for this case and provider. Try another provider or reload variants.');
      const validIds = new Set(list.map((item) => String(item.id)));
      if (product.printify.variantIds.some((id) => !validIds.has(String(id)))) {
        const selectedIds = product.printify.variantIds.filter((id) => validIds.has(String(id)));
        updatePrintify({ variantIds: selectedIds });
      }
    }).catch((err) => {
      if (!cancelled) {
        const message = err instanceof Error ? err.message : 'Could not load variants.';
        setVariantsError(message.toLowerCase().includes('too many attempts')
          ? 'Printify is temporarily rate limiting catalog requests. Wait about one minute, then reload variants.'
          : message);
      }
    }).finally(() => { if (!cancelled) setVariantsLoading(false); });
    return () => { cancelled = true; };
  }, [connected, blueprintId, providerId, variantsReload]);

  const handleBlueprintChange = (value: string) => {
    const next = blueprints.find((item) => String(item.id) === value);
    updatePrintify({ blueprintId: value, printProviderId: '', variantIds: [], selectedModels: next ? [next.title] : [] });
    setError('');
  };

  const handleProviderChange = (value: string) => {
    updatePrintify({ printProviderId: value, variantIds: [] });
    setError('');
  };

  const toggleVariant = (variant: CatalogItem) => {
    const id = String(variant.id);
    const selected = new Set(enabledVariantIds);
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    updatePrintify({ variantIds: [...selected], selectedModels: variants.filter((item) => selected.has(String(item.id))).map((item) => item.title) });
  };

  const createProduct = async () => {
    setPublishing(true);
    setError('');
    setNotice('Preparing artwork and generated mockups for upload...');
    updatePrintify({ status: 'publishing', lastError: '', lastAttemptAt: new Date().toISOString() });
    try {
      if (!product.design.localUrl && !product.design.fileUrl) throw new Error('This product has no design artwork to upload.');
      const artworkSource = product.design.fileUrl || await imageAsDataUrl(product.design.localUrl);
      const artworkImageId = await uploadPrintifyAsset(`${product.productId}-artwork.png`, artworkSource);
      const mockupImageIds: string[] = [];
      const uploadableMockups = product.mockups.filter((mockup) => mockup.fileUrl || mockup.localUrl);
      for (const [index, mockup] of uploadableMockups.entries()) {
        setNotice(`Uploading generated mockup ${index + 1} of ${uploadableMockups.length}...`);
        const image = mockup.fileUrl || await imageAsDataUrl(mockup.localUrl!);
        mockupImageIds.push(await uploadPrintifyAsset(`${product.productId}-${mockup.modelId || mockup.slotIndex}-mockup.png`, image));
      }
      setNotice('Creating a Printify draft product...');
      const response = await fetch('/api/printify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', shopId: selectedShopId, product, artworkImageId, uploadedImageIds: [artworkImageId, ...mockupImageIds] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.product?.id) throw new Error(data.error || 'Printify did not return a product ID.');
      const nextProduct = {
        ...product,
        printify: {
          ...product.printify,
          shopId: String(data.shopId),
          status: 'created' as const,
          uploadedImageIds: data.uploadedImageIds || [],
          productUrl: `https://printify.com/app/products/${data.product.id}`,
          lastError: '',
        },
        automation: { ...product.automation, printifyProductId: String(data.product.id), error: '' },
      };
      onUpdateProduct(nextProduct);
      setNotice(`Printify draft created. Product ID: ${data.product.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Printify product creation failed.';
      setError(message);
      setNotice('');
      updatePrintify({ status: 'failed', lastError: message });
    } finally {
      setPublishing(false);
    }
  };

  const savedProductId = product.automation.printifyProductId;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Printify connection & publishing</h3>
          <p className="mt-1 text-xs text-slate-400">Create a Printify draft using this product’s artwork, listing, and selected case variants.</p>
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${connected ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
          {loading ? 'Checking connection…' : connected ? 'Connected' : configured ? 'Connection unavailable' : 'Not configured'}
        </div>
      </div>

      {!connected && !configured && <p className="text-xs text-slate-400">Set <code className="text-indigo-300">PRINTIFY_API_TOKEN</code> as a server environment variable, then check the connection.</p>}
      {connected && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-400">Printify shop
          <select value={selectedShopId} onChange={(event) => { setSelectedShopId(event.target.value); updatePrintify({ shopId: event.target.value }); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white">
            {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.title} · {shop.id}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Printify case model
          <select value={blueprintId} onChange={(event) => handleBlueprintChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white">
            {!blueprintId && <option value="">Select a phone case model</option>}
            {blueprints.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">Print provider
          <select value={providerId} onChange={(event) => handleProviderChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white" disabled={!providers.length}>
            {!providerId && <option value="">Select a print provider</option>}
            {providers.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}
          </select>
        </label>
      </div>}

      {connected && blueprintId && providerId && <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-300">Variants to include</p>
          <button type="button" onClick={() => setVariantsReload((value) => value + 1)} disabled={variantsLoading} className="text-[11px] text-indigo-300 hover:text-indigo-200 disabled:opacity-50">
            {variantsLoading ? 'Loading variants…' : 'Reload variants'}
          </button>
        </div>
        {variantsError && <p className="mb-2 rounded-md border border-amber-800/60 bg-amber-950/30 p-2.5 text-xs text-amber-200">{variantsError}</p>}
        {variants.length > 0 && <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
          {variants.map((variant) => <label key={variant.id} className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${variant.is_available === false || variantsLoading ? 'text-slate-600' : 'cursor-pointer text-slate-300 hover:bg-slate-900'}`}>
            <input type="checkbox" checked={enabledVariantIds.has(String(variant.id))} disabled={variant.is_available === false || variantsLoading} onChange={() => toggleVariant(variant)} className="accent-indigo-500" />
            <span>{variant.title || `Variant ${variant.id}`}{variant.is_available === false ? ' · out of stock' : ''}</span><span className="ml-auto font-mono text-slate-500">{variant.id}</span>
          </label>)}
        </div>}
      </div>}

      {savedProductId && <div className="flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-xs text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> Draft exists in Printify · ID <span className="font-mono font-bold">{savedProductId}</span>{product.printify.productUrl && <a href={product.printify.productUrl} target="_blank" rel="noreferrer" className="ml-auto underline">Open</a>}
      </div>}
      {notice && !error && <div className="text-xs text-emerald-300">{notice}</div>}
      {error && <div className="flex items-start gap-2 rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div>{error}{product.printify.lastError && <div className="mt-1 text-rose-300/80">You can retry after correcting the issue.</div>}</div></div>}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
        <button type="button" onClick={() => void loadConnection()} disabled={loading || publishing} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Check connection
        </button>
        {connected && <button type="button" onClick={() => void createProduct()} disabled={publishing || Boolean(savedProductId) || !selectedShopId || !enabledVariantIds.size} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
          {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {publishing ? 'Creating Printify draft…' : product.printify.status === 'failed' ? 'Retry Printify creation' : 'Create Printify draft'}
        </button>}
        {product.printify.status === 'created' && <span className="text-xs text-emerald-300">Status: Draft created</span>}
      </div>
    </section>
  );
};
