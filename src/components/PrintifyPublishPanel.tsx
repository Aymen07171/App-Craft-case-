import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ExternalLink, Image as ImageIcon, LoaderCircle, RefreshCw,
  UploadCloud, CircleDollarSign, Calculator, Info,
} from 'lucide-react';
import { GeneratedDesign } from '../design-studio/types';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';
import {
  applyEtsyCountryDefaults, calculatePrice, createPricingForProduct, formatUsd,
  normalizePricing, PRICING_SCENARIOS, ProductPricing, requiredSellingPrice,
  saveEtsyFeeDefaults,
} from '../utils/printifyPricing';

type CatalogItem = { id: number | string; title: string; name?: string; is_available?: boolean; is_enabled?: boolean; options?: any; placeholders?: any; cost?: number };
type Shop = { id: number | string; title: string; sales_channel?: string };
type ShippingRow = { attributes?: { variantId?: number | string; country?: { code?: string }; shippingCost?: { firstItem?: { amount?: number; currency?: string } } } };
interface Props {
  product: UnifiedProductRecord;
  designs: GeneratedDesign[];
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
    method: 'POST', headers: { 'Content-Type': 'application/json' },
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

const inputClass = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400';
const labelClass = 'block text-xs text-slate-400';
const statusStyle: Record<string, string> = {
  draft: 'border-amber-700/60 bg-amber-950/40 text-amber-200',
  created: 'border-amber-700/60 bg-amber-950/40 text-amber-200',
  ready: 'border-amber-700/60 bg-amber-950/40 text-amber-200',
  publishing: 'border-sky-700/60 bg-sky-950/40 text-sky-200',
  uploading: 'border-sky-700/60 bg-sky-950/40 text-sky-200',
  published: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200',
  failed: 'border-rose-700/60 bg-rose-950/40 text-rose-200',
  error: 'border-rose-700/60 bg-rose-950/40 text-rose-200',
};

export const PrintifyPublishPanel: React.FC<Props> = ({ product, designs, onUpdateProduct }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState(String(product.printify.shopId || ''));
  const [blueprints, setBlueprints] = useState<CatalogItem[]>([]);
  const [providers, setProviders] = useState<CatalogItem[]>([]);
  const [variants, setVariants] = useState<CatalogItem[]>([]);
  const [shippingRows, setShippingRows] = useState<ShippingRow[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [variantsError, setVariantsError] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [variantsReload, setVariantsReload] = useState(0);
  const [shippingReload, setShippingReload] = useState(0);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [feeDefaultsSaved, setFeeDefaultsSaved] = useState(false);

  const pricing = useMemo(() => normalizePricing(product.pricing, product.product.price), [product.pricing, product.product.price]);
  const blueprintId = product.printify.blueprintId;
  const providerId = product.printify.printProviderId;
  const enabledVariantIds = useMemo(() => new Set(product.printify.variantIds.map(String)), [product.printify.variantIds]);
  const selectedVariants = useMemo(() => variants.filter((item) => enabledVariantIds.has(String(item.id))), [variants, enabledVariantIds]);
  const selectedMockupSlots = product.printify.selectedMockupSlots ?? product.mockups
    .filter((mockup) => mockup.fileUrl || mockup.localUrl).map((mockup) => mockup.slotIndex);

  const selectableDesigns = useMemo(() => {
    const list = [...designs];
    if (product.design && product.design.localUrl) {
      const alreadyInList = list.some((d) => d.id === product.design.id || d.imageUrl === product.design.localUrl);
      if (!alreadyInList) {
        list.push({
          id: product.design.id || 'custom-uploaded-active',
          title: product.design.title || product.designName || 'Custom Uploaded Design',
          prompt: product.design.prompt || '',
          imageUrl: product.design.localUrl || product.design.fileUrl || '',
          niche: product.design.niche || '',
          createdAt: Date.now(),
          placeholders: {},
        });
      }
    }
    return list;
  }, [designs, product.design, product.designName]);
  const uploadedMockupCount = Math.max(0, (product.printify.uploadedImageIds?.length ?? 0) - 1);
  const savedProductId = product.automation.printifyProductId;
  const selectedShop = shops.find((shop) => String(shop.id) === selectedShopId);
  const shopChannel = (selectedShop?.sales_channel || 'disconnected').toLowerCase();
  const liveVariantCosts = selectedVariants.map((variant) => {
    const catalogCost = Number(variant.cost);
    return Number.isFinite(catalogCost) ? catalogCost : Number(product.printify.variantProductionCosts?.[String(variant.id)]);
  }).filter((cost) => Number.isFinite(cost) && cost >= 0);
  const liveProductionCost = liveVariantCosts.length ? Math.max(...liveVariantCosts) / 100 : undefined;
  const liveProductionRange = liveVariantCosts.length
    ? [Math.min(...liveVariantCosts) / 100, Math.max(...liveVariantCosts) / 100] as const : undefined;
  const shippingRates = selectedVariants.map((variant) => {
    const matching = shippingRows.map((row) => row.attributes).filter((attributes) => String(attributes?.variantId) === String(variant.id));
    const rate = matching.find((attributes) => attributes?.country?.code === pricing.shippingCountryCode)
      || matching.find((attributes) => attributes?.country?.code === 'REST_OF_THE_WORLD');
    return rate?.shippingCost?.firstItem;
  }).filter((cost): cost is { amount?: number; currency?: string } => Number.isFinite(Number(cost?.amount)));
  const liveShippingCost = shippingRates.length === selectedVariants.length && shippingRates.length > 0
    && shippingRates.every((rate) => (rate.currency || 'USD') === 'USD')
    ? Math.max(...shippingRates.map((rate) => Number(rate.amount))) / 100 : undefined;
  const calculation = useMemo(() => calculatePrice(pricing), [pricing]);
  const productionCostConfigured = pricing.productionCost > 0 || (pricing.productionCostSource === 'printify' && liveProductionCost !== undefined);
  const shippingCostConfigured = pricing.shippingCost > 0 || (pricing.shippingCostSource === 'printify' && liveShippingCost !== undefined);
  const status = product.printify.status || (savedProductId ? 'draft' : 'draft');
  const statusLabel = status === 'created' || status === 'ready' ? 'Draft' : status[0].toUpperCase() + status.slice(1);

  const updateRecord = (updated: UnifiedProductRecord) => onUpdateProduct(updated);
  const updatePrintify = (patch: Partial<UnifiedProductRecord['printify']>) => {
    updateRecord({ ...product, printify: { ...product.printify, ...patch } });
  };
  const savePricing = (next: ProductPricing) => {
    if (next.targetMode !== 'price') {
      const recommended = requiredSellingPrice(next, next.targetMode);
      if (recommended !== null) next = { ...next, sellingPrice: recommended };
    }
    setReviewed(false);
    setFeeDefaultsSaved(false);
    updateRecord({ ...product, pricing: next, product: { ...product.product, price: next.sellingPrice } });
  };
  const changePricing = (patch: Partial<ProductPricing>, recalculate = true) => {
    let next = { ...pricing, ...patch };
    if (recalculate && next.targetMode !== 'price') {
      const recommended = requiredSellingPrice(next, next.targetMode);
      if (recommended !== null) next = { ...next, sellingPrice: recommended };
    }
    savePricing(next);
  };
  const updateAmount = (key: keyof ProductPricing, value: string) => {
    const amount = value === '' ? 0 : Number(value);
    if (!Number.isFinite(amount)) return;
    if (key === 'productionCost' || key === 'shippingCost') {
      changePricing({ [key]: amount, [key === 'productionCost' ? 'productionCostSource' : 'shippingCostSource']: 'manual' } as Partial<ProductPricing>);
    } else {
      changePricing({ [key]: amount } as Partial<ProductPricing>);
    }
  };

  const loadConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getPrintify('connection');
      const nextShops: Shop[] = result.shops || [];
      setShops(nextShops);
      setConfigured(Boolean(result.configured));
      setConnected(Boolean(result.connected));
      const nextShopId = String(nextShops.find((shop) => String(shop.id) === selectedShopId)?.id || nextShops[0]?.id || '');
      setSelectedShopId(nextShopId);
      if (nextShopId && nextShopId !== product.printify.shopId) updatePrintify({ shopId: nextShopId });
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
      setVariants([]); setVariantsError(''); return;
    }
    let cancelled = false;
    setVariants([]); setVariantsLoading(true); setVariantsError('');
    getPrintify('variants', { blueprintId, providerId }).then((data) => {
      if (cancelled) return;
      const list = catalogRows(data);
      setVariants(list);
      if (!list.length) setVariantsError('Printify returned no variants for this case and provider. Try another provider or reload variants.');
      const validIds = new Set(list.map((item) => String(item.id)));
      if (product.printify.variantIds.some((id) => !validIds.has(String(id)))) {
        updatePrintify({ variantIds: product.printify.variantIds.filter((id) => validIds.has(String(id))) });
      }
    }).catch((err) => {
      if (!cancelled) {
        const message = err instanceof Error ? err.message : 'Could not load variants.';
        setVariantsError(message.toLowerCase().includes('too many attempts')
          ? 'Printify is temporarily rate limiting catalog requests. Wait about one minute, then reload variants.' : message);
      }
    }).finally(() => { if (!cancelled) setVariantsLoading(false); });
    return () => { cancelled = true; };
  }, [connected, blueprintId, providerId, variantsReload]);

  useEffect(() => {
    if (!connected || !blueprintId || !providerId) { setShippingRows([]); return; }
    let cancelled = false;
    setShippingRows([]); setShippingLoading(true); setShippingError('');
    getPrintify('shipping', { blueprintId, providerId, method: pricing.shippingMethod }).then((data) => {
      if (cancelled) return;
      setShippingRows(Array.isArray(data?.data) ? data.data : []);
    }).catch((err) => { if (!cancelled) setShippingError(err instanceof Error ? err.message : 'Could not load shipping estimates.'); })
      .finally(() => { if (!cancelled) setShippingLoading(false); });
    return () => { cancelled = true; };
  }, [connected, blueprintId, providerId, pricing.shippingMethod, shippingReload]);

  useEffect(() => {
    if (!enabledVariantIds.size && (pricing.productionCostSource === 'printify' || pricing.shippingCostSource === 'printify')) {
      if (pricing.productionCost !== 0 || pricing.shippingCost !== 0) savePricing({
        ...pricing,
        productionCost: pricing.productionCostSource === 'printify' ? 0 : pricing.productionCost,
        shippingCost: pricing.shippingCostSource === 'printify' ? 0 : pricing.shippingCost,
      });
      return;
    }
    if (liveProductionCost === undefined || pricing.productionCostSource !== 'printify' || pricing.productionCost === liveProductionCost) return;
    savePricing({ ...pricing, productionCost: liveProductionCost });
  }, [enabledVariantIds.size, liveProductionCost, pricing.productionCostSource]);

  useEffect(() => {
    if (liveShippingCost === undefined || pricing.shippingCostSource !== 'printify' || pricing.shippingCost === liveShippingCost) return;
    savePricing({ ...pricing, shippingCost: liveShippingCost });
  }, [liveShippingCost, pricing.shippingCostSource]);

  const handleBlueprintChange = (value: string) => {
    const next = blueprints.find((item) => String(item.id) === value);
    setReviewed(false);
    updateRecord({
      ...product,
      printify: { ...product.printify, blueprintId: value, printProviderId: '', variantIds: [], selectedModels: next ? [next.title] : [], variantProductionCosts: {} },
      pricing: { ...pricing, productionCost: pricing.productionCostSource === 'printify' ? 0 : pricing.productionCost, shippingCost: pricing.shippingCostSource === 'printify' ? 0 : pricing.shippingCost },
    });
    setError('');
  };
  const handleProviderChange = (value: string) => {
    setReviewed(false);
    updateRecord({
      ...product,
      printify: { ...product.printify, printProviderId: value, variantIds: [], variantProductionCosts: {} },
      pricing: { ...pricing, productionCost: pricing.productionCostSource === 'printify' ? 0 : pricing.productionCost, shippingCost: pricing.shippingCostSource === 'printify' ? 0 : pricing.shippingCost },
    });
    setError('');
  };
  const toggleVariant = (variant: CatalogItem) => {
    const selected = new Set(enabledVariantIds);
    if (selected.has(String(variant.id))) selected.delete(String(variant.id)); else selected.add(String(variant.id));
    setReviewed(false);
    updatePrintify({ variantIds: [...selected], selectedModels: variants.filter((item) => selected.has(String(item.id))).map((item) => item.title) });
  };
  const selectAllVariants = () => {
    const availableIds = variants.filter((v) => v.is_available !== false).map((v) => String(v.id));
    setReviewed(false);
    updatePrintify({
      variantIds: availableIds,
      selectedModels: variants.filter((v) => availableIds.includes(String(v.id))).map((v) => v.title || `Variant ${v.id}`),
    });
  };
  const clearAllVariants = () => {
    setReviewed(false);
    updatePrintify({
      variantIds: [],
      selectedModels: [],
    });
  };
  const toggleMockup = (slotIndex: number) => {
    const selected = new Set(selectedMockupSlots);
    if (selected.has(slotIndex)) selected.delete(slotIndex); else selected.add(slotIndex);
    setReviewed(false);
    updatePrintify({ selectedMockupSlots: [...selected] });
  };
  const selectDesign = (design: GeneratedDesign) => {
    if (design.id === product.design.id) return;
    setReviewed(false);
    updateRecord({
      ...product,
      designName: design.title,
      design: {
        ...product.design, id: design.id, title: design.title, prompt: design.prompt,
        localUrl: design.imageUrl, sourceUrl: design.imageUrl, niche: design.niche,
        fileId: '', fileUrl: '', verified: false,
      },
    });
  };

  useEffect(() => {
    if (!product.pricing) savePricing(createPricingForProduct(product.product.price));
  }, [product.productId]);

  const evaluatePrintifyProduct = async (showNotice = true, finalCheck = true) => {
    if (!savedProductId || !selectedShopId) return;
    try {
      const remote = await getPrintify('product', { shopId: selectedShopId, productId: savedProductId });
      const external = Array.isArray(remote.external) ? remote.external[0] : remote.external;
      const nextStatus = remote.is_locked ? 'uploading' : external?.id || external?.handle ? 'published' : finalCheck ? 'failed' : 'uploading';
      if (nextStatus === 'published') {
        updateRecord({
          ...product,
          printify: { ...product.printify, status: 'published', publishedProductUrl: /^https:\/\//i.test(String(external?.handle || '')) ? String(external.handle) : '', productStatusCheckedAt: new Date().toISOString(), lastError: '' },
          automation: {
            ...product.automation,
            etsyListingId: String(selectedShop?.sales_channel?.toLowerCase().includes('etsy') ? (external?.id || product.automation.etsyListingId || '') : product.automation.etsyListingId),
            publishedDate: new Date().toISOString(),
          },
        });
      } else {
        updatePrintify({ status: nextStatus, productStatusCheckedAt: new Date().toISOString(), lastError: nextStatus === 'failed' ? 'Printify reports that publishing finished without a connected-store product. Retry publishing or check the connected shop.' : '' });
      }
      if (showNotice) setNotice(nextStatus === 'published' ? `Published to ${selectedShop?.sales_channel || 'connected store'} · ID ${external?.id}` : nextStatus === 'uploading' ? 'Printify is still sending this product to the connected shop.' : 'The connected shop did not confirm publication. You can retry.');
      return nextStatus;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not check the Printify product status.';
      updatePrintify({ status: 'error', lastError: message });
      if (showNotice) setError(message);
      return 'error';
    }
  };

  const createProduct = async () => {
    setPublishing(true); setError(''); setNotice('Preparing artwork and selected mockups for upload...');
    updatePrintify({ status: 'uploading', lastError: '', lastAttemptAt: new Date().toISOString() });
    try {
      const artworkSource = product.design.fileUrl || product.design.localUrl;
      if (!artworkSource) throw new Error('This product has no design artwork to upload.');
      const artwork = product.design.fileUrl || await imageAsDataUrl(artworkSource);
      const artworkImageId = await uploadPrintifyAsset(`${product.productId}-artwork.png`, artwork);
      const selectedMockups = product.mockups.filter((mockup) => selectedMockupSlots.includes(mockup.slotIndex) && (mockup.fileUrl || mockup.localUrl));
      const mockupImageIds: string[] = [];
      for (const [index, mockup] of selectedMockups.entries()) {
        setNotice(`Uploading selected mockup ${index + 1} of ${selectedMockups.length}...`);
        const image = mockup.fileUrl || await imageAsDataUrl(mockup.localUrl!);
        mockupImageIds.push(await uploadPrintifyAsset(`${product.productId}-${mockup.modelId || mockup.slotIndex}-mockup.png`, image));
      }
      setNotice('Creating your Printify draft product...');
      const productPayload = {
        ...product,
        product: { ...product.product, price: pricing.sellingPrice },
        pricing,
        printify: { ...product.printify, shopId: selectedShopId, selectedMockupSlots },
      };
      const response = await fetch('/api/printify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create', shopId: selectedShopId,
          product: { productId: productPayload.productId, listing: productPayload.listing, product: productPayload.product, pricing, printify: productPayload.printify },
          artworkImageId, uploadedImageIds: [artworkImageId, ...mockupImageIds],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.product?.id) throw new Error(data.error || 'Printify did not return a product ID.');
      const variantProductionCosts = Object.fromEntries((data.product.variants || [])
        .filter((variant: any) => Number.isFinite(Number(variant.cost)) && Number(variant.cost) >= 0)
        .map((variant: any) => [String(variant.id), Number(variant.cost)]));
      let savedPricing = { ...pricing };
      const returnedCosts = Object.values(variantProductionCosts) as number[];
      if (savedPricing.productionCostSource === 'printify' && returnedCosts.length) {
        savedPricing.productionCost = Math.max(...returnedCosts) / 100;
        if (savedPricing.targetMode !== 'price') {
          const recommended = requiredSellingPrice(savedPricing, savedPricing.targetMode);
          if (recommended !== null) savedPricing.sellingPrice = recommended;
        }
      }
      updateRecord({
        ...productPayload,
        product: { ...productPayload.product, price: savedPricing.sellingPrice },
        pricing: savedPricing,
        printify: { ...productPayload.printify, status: 'draft', uploadedImageIds: data.uploadedImageIds || [], variantProductionCosts, productUrl: `https://printify.com/app/products/${data.product.id}`, lastError: '' },
        automation: { ...product.automation, printifyProductId: String(data.product.id), error: '' },
      });
      setNotice(`Printify draft created · Product ID ${data.product.id} · ${mockupImageIds.length} custom mockup${mockupImageIds.length === 1 ? '' : 's'} uploaded to the Media Library. Use Mockups > Upload in Printify to add them to this product's gallery.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Printify product creation failed.';
      setError(message); setNotice(''); updatePrintify({ status: 'failed', lastError: message });
    } finally { setPublishing(false); }
  };

  const publishToShop = async () => {
    if (!savedProductId || !selectedShopId) return;
    setPublishing(true); setError(''); setNotice('Sending the product to your connected sales channel...');
    updatePrintify({ status: 'uploading', lastError: '', lastAttemptAt: new Date().toISOString() });
    try {
      const artworkSource = product.design.fileUrl || product.design.localUrl;
      if (!artworkSource) throw new Error('This product has no design artwork to upload.');
      const artwork = product.design.fileUrl || await imageAsDataUrl(artworkSource);
      const artworkImageId = await uploadPrintifyAsset(`${product.productId}-artwork.png`, artwork);
      const response = await fetch('/api/printify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish-product', shopId: selectedShopId, productId: savedProductId, price: pricing.sellingPrice, artworkImageId, product: { listing: product.listing } }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Printify could not start publishing this product.');
      setNotice('Publish request accepted. Waiting for the connected shop to confirm...');
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1800));
        const nextStatus = await evaluatePrintifyProduct(false, false);
        if (nextStatus === 'published') { setNotice(`Published to ${selectedShop?.sales_channel || 'connected store'} · ID ${savedProductId}`); break; }
        if (nextStatus === 'error') { setError('Could not check publication status. Use “Check status” to retry.'); setNotice(''); break; }
        if (attempt === 5) {
          const finalStatus = await evaluatePrintifyProduct(false, true);
          if (finalStatus === 'published') setNotice(`Published to ${selectedShop?.sales_channel || 'connected store'} · ID ${savedProductId}`);
          else if (finalStatus === 'failed' || finalStatus === 'error') { setError('The connected shop did not confirm publication. You can retry.'); setNotice(''); }
          else setNotice('Still uploading to the connected shop. Use “Check status” to refresh this when it finishes.');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not publish this Printify product.';
      setError(message); updatePrintify({ status: 'failed', lastError: message }); setNotice('');
    } finally { setPublishing(false); }
  };

  const setTargetMode = (mode: ProductPricing['targetMode']) => {
    let next = { ...pricing, targetMode: mode };
    if (mode !== 'price') {
      const recommended = requiredSellingPrice(next, mode);
      if (recommended !== null) next = { ...next, sellingPrice: recommended };
    }
    savePricing(next);
  };
  const priceForMode = (value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    if (!Number.isFinite(parsed)) return;
    const patch = pricing.targetMode === 'margin' ? { targetMargin: Math.min(0.99, Math.max(0, parsed / 100)) } : { targetProfit: parsed };
    changePricing(patch);
  };
  const selectEtsyCountry = (country: ProductPricing['etsySellerCountry']) => savePricing(applyEtsyCountryDefaults(pricing, country));
  const recommendation = pricing.targetMode === 'price' ? undefined : requiredSellingPrice(pricing, pricing.targetMode);

  const field = (title: string, key: keyof ProductPricing, options: { step?: string; help?: string } = {}) => (
    <label key={String(key)} className={labelClass}>{title}
      <input type="number" min="0" step={options.step || '0.01'} value={Number(pricing[key]) || 0}
        onChange={(event) => updateAmount(key, event.target.value)} disabled={publishing} className={inputClass} />
      {options.help && <span className="mt-1 block text-[10px] leading-4 text-slate-500">{options.help}</span>}
    </label>
  );
  const rateField = (title: string, key: keyof ProductPricing, help?: string) => (
    <label key={String(key)} className={labelClass}>{title}
      <div className="relative mt-1"><input type="number" min="0" step="0.1" value={(Number(pricing[key]) || 0) * 100} disabled={publishing}
        onChange={(event) => updateAmount(key, String((event.target.value === '' ? 0 : Number(event.target.value)) / 100))}
        className={`${inputClass} pr-8`} /><span className="absolute top-2.5 right-3 text-xs text-slate-500">%</span></div>
      {help && <span className="mt-1 block text-[10px] leading-4 text-slate-500">{help}</span>}
    </label>
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div><h3 className="text-sm font-semibold text-white">Printify product setup</h3>
            <p className="mt-1 text-xs text-slate-400">Choose the existing design, generated mockups, case and variants for {product.productId}.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle[status] || statusStyle.draft}`}>Status: {statusLabel}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${connected ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
              {loading ? 'Checking connection…' : connected ? 'Connected' : configured ? 'Connection unavailable' : 'Not configured'}
            </span>
          </div>
        </div>

        {!connected && !configured && <p className="text-xs text-slate-400">Set <code className="text-indigo-300">PRINTIFY_API_TOKEN</code> as a server environment variable, then check the connection.</p>}
        {connected && <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>Printify shop
              <select value={selectedShopId} disabled={Boolean(savedProductId) || publishing} onChange={(event) => { setSelectedShopId(event.target.value); setReviewed(false); updatePrintify({ shopId: event.target.value }); }} className={inputClass}>
                {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.title} · {shop.id}</option>)}
              </select>
              <span className="mt-1 block text-[10px] text-slate-500">Sales channel: {selectedShop?.sales_channel || 'checking...'}</span>
            </label>
            <label className={labelClass}>Printify case model
              <select value={blueprintId} disabled={Boolean(savedProductId) || publishing} onChange={(event) => handleBlueprintChange(event.target.value)} className={inputClass}>
                {!blueprintId && <option value="">Select a phone case model</option>}
                {blueprints.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}
              </select>
            </label>
            <label className={labelClass}>Print provider
              <select value={providerId} onChange={(event) => handleProviderChange(event.target.value)} className={inputClass} disabled={!providers.length || Boolean(savedProductId) || publishing}>
                {!providerId && <option value="">Select a print provider</option>}
                {providers.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}
              </select>
            </label>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="mb-2 flex items-center justify-between gap-2"><div><h4 className="text-xs font-semibold text-white">Design artwork</h4><p className="mt-1 text-[11px] text-slate-500">This artwork will be placed on the selected Printify variants.</p></div><span className="text-[10px] text-slate-500">{product.design.title || product.designName}</span></div>
            {selectableDesigns.length > 0 && <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {selectableDesigns.map((design) => {
                const isSelected = Boolean(product.design.id === design.id || (product.design.localUrl && product.design.localUrl === design.imageUrl));
                return (
                  <label key={design.id} className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${isSelected ? 'border-indigo-400/70 bg-indigo-400/10 text-white' : 'border-slate-800 text-slate-300'} ${savedProductId || publishing ? 'opacity-60' : 'cursor-pointer'}`}>
                    <input type="radio" name="printify-design" checked={isSelected} disabled={Boolean(savedProductId) || publishing} onChange={() => selectDesign(design)} className="accent-indigo-400" />
                    <span className="min-w-0 truncate">{design.title}</span>
                  </label>
                );
              })}
            </div>}
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
              {product.design.localUrl || product.design.fileUrl ? <img src={product.design.localUrl || product.design.fileUrl} alt={product.design.title || 'Selected design'} className="h-16 w-12 rounded border border-slate-700 object-cover" /> : <span className="flex h-16 w-12 items-center justify-center rounded border border-dashed border-slate-700 text-slate-500"><ImageIcon className="h-5 w-5" /></span>}
              <div className="min-w-0"><p className="truncate text-xs font-medium text-white">{product.design.title || product.designName}</p><p className="mt-1 text-[10px] text-slate-500">{product.design.fileUrl ? 'Google Drive original' : product.design.localUrl ? 'Generated design' : 'No artwork available'}</p></div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="mb-2 flex items-center justify-between"><div><h4 className="text-xs font-semibold text-white">Generated mockups</h4><p className="mt-1 text-[11px] text-slate-500">Selected scenes upload to the Printify Media Library.</p></div><span className="text-[10px] text-slate-500">{selectedMockupSlots.length} selected</span></div>
            {product.mockups.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {product.mockups.map((mockup) => {
                const available = Boolean(mockup.fileUrl || mockup.localUrl);
                return <label key={mockup.slotIndex} className={`flex items-center gap-2 rounded-lg border p-2 ${selectedMockupSlots.includes(mockup.slotIndex) ? 'border-indigo-400/60 bg-indigo-400/5' : 'border-slate-800'} ${!available || savedProductId ? 'opacity-50' : 'cursor-pointer'}`}>
                  <input type="checkbox" checked={selectedMockupSlots.includes(mockup.slotIndex)} disabled={!available || Boolean(savedProductId) || publishing} onChange={() => toggleMockup(mockup.slotIndex)} className="accent-indigo-400" />
                  {available ? <img src={mockup.localUrl || mockup.fileUrl} alt={mockup.sceneTitle || mockup.modelName} className="h-12 w-12 rounded object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded bg-slate-950 text-slate-600"><ImageIcon className="h-4 w-4" /></span>}
                  <span className="min-w-0"><span className="block truncate text-[11px] text-slate-200">{mockup.sceneTitle || mockup.modelName || `Mockup ${mockup.slotIndex + 1}`}</span><span className="block text-[10px] text-slate-500">{savedProductId && selectedMockupSlots.includes(mockup.slotIndex) ? 'Uploaded to Media Library' : available ? 'Ready to upload' : 'No generated image'}</span></span>
                </label>;
              })}
            </div> : <p className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">Generated mockups will appear here after the existing mockup workflow.</p>}
            <div role="note" className="mt-3 rounded-lg border border-amber-800/60 bg-amber-950/25 p-3 text-[11px] leading-5 text-amber-100">
              <p className="flex items-start gap-2"><Info className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-300" /><span><strong>Media Library upload does not add product gallery mockups.</strong> Printify's public product API generates the gallery images and exposes them as read-only. To show your generated scenes on this product, open it in Printify and use <strong>Mockups &gt; Upload</strong>.</span></p>
              {savedProductId && <p className="mt-2 pl-5 text-amber-200/90">{uploadedMockupCount > 0 ? `${uploadedMockupCount} custom mockup${uploadedMockupCount === 1 ? '' : 's'} uploaded to the Media Library for this draft.` : 'No custom mockup uploads are recorded for this draft.'} Use the <strong>Open in Printify</strong> link above to continue.</p>}
            </div>
          </div>

          {blueprintId && providerId && <div className="border-t border-slate-800 pt-4">
            <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-white">Variants to include</h4>
                <p className="mt-1 text-[11px] text-slate-500">Catalog production costs are shown per variant when available.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {variants.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={selectAllVariants}
                      disabled={variantsLoading || Boolean(savedProductId) || publishing}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 disabled:opacity-40 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-700 text-xs">|</span>
                    <button
                      type="button"
                      onClick={clearAllVariants}
                      disabled={variantsLoading || Boolean(savedProductId) || publishing}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-slate-200 disabled:opacity-40 hover:underline"
                    >
                      Clear all
                    </button>
                    <span className="text-slate-700 text-xs">|</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setVariantsReload((value) => value + 1)}
                  disabled={variantsLoading}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${variantsLoading ? 'animate-spin' : ''}`} />
                  {variantsLoading ? 'Loading…' : 'Reload'}
                </button>
              </div>
            </div>
            {variantsError && <p className="mb-2 rounded-md border border-amber-800/60 bg-amber-950/30 p-2.5 text-xs text-amber-200">{variantsError}</p>}
            {variants.length > 0 && <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2">
              {variants.map((variant) => {
                const costCents = Number.isFinite(Number(variant.cost)) ? Number(variant.cost) : product.printify.variantProductionCosts?.[String(variant.id)];
                return <label key={variant.id} className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${variant.is_available === false || variantsLoading ? 'text-slate-600' : 'cursor-pointer text-slate-300 hover:bg-slate-900'}`}>
                  <input type="checkbox" checked={enabledVariantIds.has(String(variant.id))} disabled={variant.is_available === false || variantsLoading || Boolean(savedProductId) || publishing} onChange={() => toggleVariant(variant)} className="accent-indigo-500" />
                  <span>{variant.title || `Variant ${variant.id}`}{variant.is_available === false ? ' · out of stock' : ''}</span>
                  {Number.isFinite(Number(costCents)) && <span className="ml-auto tabular-nums text-emerald-300">{formatUsd(Number(costCents) / 100)}</span>}
                  <span className="font-mono text-slate-600">{variant.id}</span>
                </label>;
              })}
            </div>}
          </div>}
        </>}

        {savedProductId && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs">
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyle[status] || statusStyle.draft}`}>{statusLabel}</span>
          <span className="text-slate-300">Printify Product ID <strong className="font-mono text-white">{savedProductId}</strong></span>
          {product.printify.productUrl && <a href={product.printify.productUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">Open in Printify <ExternalLink className="h-3 w-3" /></a>}
          {product.printify.publishedProductUrl && <a href={product.printify.publishedProductUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200">Open listing <ExternalLink className="h-3 w-3" /></a>}
        </div>}
        {savedProductId && <p className="text-[10px] leading-4 text-slate-500">The selected design, Printify model, provider and variants are set on this draft. Your latest selling price is synced before publishing.</p>}
        {notice && !error && <div role="status" className="text-xs text-emerald-300">{notice}</div>}
        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div>{error}{product.printify.lastError && <div className="mt-1 text-rose-300/80">You can retry after correcting the issue.</div>}</div></div>}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
          <button type="button" onClick={() => void loadConnection()} disabled={loading || publishing} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Check connection</button>
          {connected && !savedProductId && <button type="button" onClick={() => void createProduct()} disabled={publishing || pricing.sellingPrice <= 0 || !selectedShopId || !product.design.localUrl && !product.design.fileUrl || !blueprintId || !providerId || !enabledVariantIds.size || !(product.listing.title.trim() && product.listing.description.trim())} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
            {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{publishing ? 'Creating Printify draft…' : status === 'failed' ? 'Retry draft creation' : 'Create Printify draft'}
          </button>}
          {connected && savedProductId && shopChannel !== 'disconnected' && <button type="button" onClick={() => void publishToShop()} disabled={publishing || status === 'uploading' || !reviewed || pricing.sellingPrice <= 0 || !productionCostConfigured || !shippingCostConfigured || (pricing.etsySellerCountry === 'MA' && pricing.etsyPaymentProcessingFixed <= 0)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
            {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{publishing ? 'Publishing…' : status === 'failed' || status === 'error' ? 'Retry publishing' : status === 'published' ? 'Update connected shop' : 'Publish to connected shop'}
          </button>}
          {savedProductId && status === 'uploading' && !publishing && <button type="button" onClick={() => void evaluatePrintifyProduct()} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">Check status</button>}
          {connected && savedProductId && shopChannel === 'disconnected' && <span className="text-xs text-amber-200">Connect this Printify shop to a sales channel to publish.</span>}
          {publishing && <span className="text-xs text-slate-400">Keep this page open while the request completes.</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-400/10 text-indigo-200"><Calculator className="h-4 w-4" /></span><div><h3 className="text-sm font-semibold text-white">Pricing & profit calculator</h3><p className="mt-1 text-xs text-slate-400">{product.productId} · USD · inputs saved with this product</p></div></div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${calculation.netProfit >= 0 ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200' : 'border-rose-700/60 bg-rose-950/40 text-rose-200'}`}>{calculation.netProfit >= 0 ? 'Profitable at this price' : 'Below break-even'}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div><p className="mb-2 text-xs font-semibold text-slate-200">Set your pricing goal</p>
              <div className="grid grid-cols-3 gap-2">
                {([['price', 'Selling price'], ['margin', 'Profit margin'], ['profit', 'Profit amount']] as const).map(([mode, title]) => <button key={mode} type="button" onClick={() => setTargetMode(mode)} disabled={publishing} aria-pressed={pricing.targetMode === mode} className={`rounded-lg border px-2 py-2 text-[11px] font-medium ${pricing.targetMode === mode ? 'border-indigo-400 bg-indigo-400/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-800/70'}`}>{title}</button>)}
              </div>
              <label className={`${labelClass} mt-3`}>{pricing.targetMode === 'price' ? 'Target selling price' : pricing.targetMode === 'margin' ? 'Desired profit margin' : 'Desired profit per order'}
                <div className="relative mt-1">
                  <input type="number" min="0" step={pricing.targetMode === 'margin' ? '1' : '0.01'} value={pricing.targetMode === 'price' ? pricing.sellingPrice : pricing.targetMode === 'margin' ? pricing.targetMargin * 100 : pricing.targetProfit} disabled={publishing}
                    onChange={(event) => pricing.targetMode === 'price'
                      ? changePricing({ sellingPrice: event.target.value === '' ? 0 : Number(event.target.value) }, false)
                      : priceForMode(event.target.value)} className={`${inputClass} pr-14`} />
                  <span className="absolute top-2.5 right-3 text-xs text-slate-500">{pricing.targetMode === 'margin' ? '%' : '$'}</span>
                </div>
              </label>
              {recommendation !== undefined && recommendation !== null && <p className="mt-2 rounded-lg border border-indigo-400/20 bg-indigo-400/5 p-2.5 text-xs text-indigo-100">Recommended price: <strong>{formatUsd(recommendation)}</strong></p>}
              {recommendation === null && <p className="mt-2 rounded-lg border border-amber-800/50 bg-amber-950/20 p-2.5 text-[11px] text-amber-200">This goal is above the available margin after variable fees. Lower the target or review the fee inputs.</p>}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-white">Printify and fulfillment costs</p><span className={`text-[10px] ${pricing.productionCostSource === 'printify' && liveProductionCost !== undefined ? 'text-emerald-300' : 'text-amber-200'}`}>{pricing.productionCostSource === 'printify' && liveProductionCost !== undefined ? 'Live catalog' : 'Manual / estimated'}</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {field('Production cost per case', 'productionCost', { help: liveProductionRange ? `Selected variants: ${formatUsd(liveProductionRange[0])}–${formatUsd(liveProductionRange[1])}. Using the highest variant cost.` : 'Printify catalog did not return a cost; enter the production cost shown in the Printify Product Creator.' })}
                {field('Printify shipping to customer', 'shippingCost', { help: liveShippingCost !== undefined ? `Live ${pricing.shippingMethod} rate for ${pricing.shippingCountryCode}; highest selected variant rate.` : 'No matching live rate. Enter the shipping rate for the delivery destination below.' })}
                <label className={labelClass}>Shipping destination country (ISO code)
                  <div className="flex gap-2"><input maxLength={2} value={pricing.shippingCountryCode} disabled={publishing} onChange={(event) => changePricing({ shippingCountryCode: event.target.value.trim().toUpperCase(), shippingCost: 0, shippingCostSource: 'printify' })} className={`${inputClass} w-20 uppercase`} /><select value={pricing.shippingMethod} disabled={publishing} onChange={(event) => changePricing({ shippingMethod: event.target.value as ProductPricing['shippingMethod'], shippingCost: 0, shippingCostSource: 'printify' })} className={`${inputClass} flex-1`}><option value="standard">Standard</option><option value="economy">Economy</option><option value="priority">Priority</option><option value="express">Express</option></select></div>
                  {shippingLoading && <span className="mt-1 block text-[10px] text-slate-500">Loading live Printify shipping rates…</span>}{shippingError && <span className="mt-1 block text-[10px] text-amber-200">{shippingError}</span>}
                </label>
                {field('Other Printify fees', 'printifyFees', { help: 'Subscription or service fees allocated per order, if applicable.' })}
                {field('Other fulfillment costs', 'fulfillmentOther')}
                {field('Customer shipping charged on Etsy', 'customerShippingCharged', { help: 'Included in Etsy fee calculations and order revenue.' })}
              </div>
              <button type="button" onClick={() => { savePricing({ ...pricing, productionCostSource: 'printify', shippingCostSource: 'printify' }); setVariantsReload((value) => value + 1); setShippingReload((value) => value + 1); }} className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-indigo-300 hover:text-indigo-200"><RefreshCw className="h-3 w-3" />Use latest available Printify rates</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-white">Etsy fees</p><a href="https://help.etsy.com/hc/en-us/articles/115014483627-What-are-the-Fees-and-Taxes-for-Selling-on-Etsy" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-300 hover:text-indigo-200">Official fee guide <ExternalLink className="inline h-3 w-3" /></a></div>
              <label className={labelClass}>Seller payment account country
              <select value={pricing.etsySellerCountry} disabled={publishing} onChange={(event) => selectEtsyCountry(event.target.value as ProductPricing['etsySellerCountry'])} className={inputClass}><option value="US">United States</option><option value="MA">Morocco</option><option value="OTHER">Other / configure rates</option></select>
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {field('Listing / renewal fee allocated per sale (USD)', 'etsyListingFee')}
                {rateField('Transaction rate', 'etsyTransactionRate', 'Official standard rate: 6.5% of order total.')}
                {rateField('Payment processing rate', 'etsyPaymentProcessingRate')}
                {field('Payment processing fixed fee (USD)', 'etsyPaymentProcessingFixed', { help: pricing.etsySellerCountry === 'MA' ? 'Morocco: official fixed fee is 5 MAD; enter its current USD equivalent.' : 'Country-specific. US default is $0.25 per order.' })}
                {rateField('Regulatory operating fee', 'etsyRegulatoryRate', 'Only applies in some seller countries. Set the current country rate if applicable.')}
                {field('Other Etsy fees per order', 'etsyOtherFees', { help: 'VAT on seller fees, conversion, deposit or other charges, if applicable.' })}
              </div>
              {pricing.etsySellerCountry === 'MA' && pricing.etsyPaymentProcessingFixed <= 0 && <p className="mt-2 rounded-md border border-amber-800/60 bg-amber-950/20 p-2 text-[10px] text-amber-200">Set the USD equivalent of Etsy’s 5 MAD payment processing fee before publishing.</p>}
              <div className="mt-3 rounded-lg border border-slate-800 p-2.5">
                <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={pricing.etsyOffsiteAdsEnabled} disabled={publishing} onChange={(event) => changePricing({ etsyOffsiteAdsEnabled: event.target.checked })} className="accent-indigo-400" />Include Etsy Offsite Ads fee</label>
                {pricing.etsyOffsiteAdsEnabled && <div className="mt-2 grid gap-3 sm:grid-cols-2">{rateField('Offsite Ads rate', 'etsyOffsiteAdsRate')}{field('Order fee cap (USD)', 'etsyOffsiteAdsOrderCap')}</div>}
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Etsy documents 15% below $10,000 in trailing 365-day sales, 12% at or above it, capped at $100 per order. Choose the rate that applies to your shop.</p>
              </div>
              <button type="button" disabled={publishing} onClick={() => setFeeDefaultsSaved(saveEtsyFeeDefaults(pricing))} className="mt-3 rounded-md border border-slate-700 px-2.5 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800 disabled:opacity-50">{feeDefaultsSaved ? 'Etsy fee defaults saved for new products' : 'Save these Etsy fees as defaults for new products'}</button>
              <p className="mt-1 text-[10px] text-slate-600">Saved on this device; existing products keep their own pricing.</p>
            </div>

            <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-white">My design, marketing and custom costs</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {field('AI design generation per sale', 'designGenerationCost')}
                {field('Mockup generation per sale', 'mockupGenerationCost')}
                {field('Advertising per sale', 'advertisingCost')}
                {field('Additional marketing', 'marketingCost')}
                {field('Other custom expenses', 'otherExpenses')}
              </div>
            </details>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-white">Before publishing · {product.productId}</p><p className="mt-1 text-[10px] text-slate-500">Estimated per order · USD</p></div><CircleDollarSign className="h-4 w-4 text-indigo-300" /></div>
            <div className="space-y-1.5 text-xs">
              {(!productionCostConfigured || !shippingCostConfigured) && <p className="mb-2 rounded-md border border-amber-800/60 bg-amber-950/20 p-2 text-[10px] leading-4 text-amber-200">Enter missing Printify production or shipping costs before publishing. Zero values would overstate the estimated profit.</p>}
              <SummaryRow label="Product / production cost" value={formatUsd(pricing.productionCost)} hint={pricing.productionCostSource === 'printify' && liveProductionCost !== undefined ? 'Printify catalog' : 'manual estimate'} />
              <SummaryRow label="Printify shipping" value={formatUsd(pricing.shippingCost)} hint={pricing.shippingCostSource === 'printify' && liveShippingCost !== undefined ? 'live rate' : 'manual estimate'} />
              <SummaryRow label="Other Printify costs" value={formatUsd(pricing.printifyFees + pricing.fulfillmentOther)} />
              <SummaryRow label="Etsy listing / renewal" value={formatUsd(calculation.listingFee)} />
              <SummaryRow label="Etsy transaction" value={formatUsd(calculation.transactionFee)} />
              <SummaryRow label="Etsy payment processing" value={formatUsd(calculation.paymentProcessingFee)} />
              {pricing.etsyOffsiteAdsEnabled && <SummaryRow label="Etsy Offsite Ads" value={formatUsd(calculation.offsiteAdsFee)} />}
              <SummaryRow label="Other Etsy fees" value={formatUsd(pricing.etsyOtherFees + calculation.revenue * pricing.etsyRegulatoryRate)} />
              <SummaryRow label="Total Etsy fees" value={formatUsd(calculation.etsyFees)} hint="calculated" />
              <SummaryRow label="Your additional costs" value={formatUsd(calculation.additionalCosts)} />
              <div className="my-2 border-t border-slate-800" />
              <SummaryRow label="Total cost per order" value={formatUsd(calculation.totalCost)} strong />
              <SummaryRow label="Selling price" value={formatUsd(pricing.sellingPrice)} />
              {pricing.customerShippingCharged > 0 && <SummaryRow label="Customer shipping collected" value={formatUsd(pricing.customerShippingCharged)} />}
              <SummaryRow label="Estimated net profit / after fees" value={formatUsd(calculation.netProfit)} strong positive={calculation.netProfit >= 0} />
              <SummaryRow label="Profit margin" value={`${(calculation.profitMargin * 100).toFixed(1)}%`} strong positive={calculation.netProfit >= 0} />
            </div>
            <label className="mt-4 flex items-start gap-2 border-t border-slate-800 pt-3 text-[11px] leading-4 text-slate-300"><input type="checkbox" checked={reviewed} disabled={publishing} onChange={(event) => setReviewed(event.target.checked)} className="mt-0.5 accent-emerald-400" />I reviewed the estimated fees and profit for this product before publishing.</label>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="border-b border-slate-800 bg-slate-950/60 px-3 py-2.5"><p className="text-xs font-semibold text-white">Price comparison</p><p className="mt-1 text-[10px] text-slate-500">Compare expected cost and profit before choosing a price.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-[11px]">
              <thead className="bg-slate-950/30 text-slate-500"><tr><th className="px-3 py-2 font-medium">Selling price</th><th className="px-3 py-2 text-right font-medium">Total cost</th><th className="px-3 py-2 text-right font-medium">Etsy fees</th><th className="px-3 py-2 text-right font-medium">Net profit</th><th className="px-3 py-2 text-right font-medium">Margin</th></tr></thead>
              <tbody>{PRICING_SCENARIOS.map((price) => { const scenario = calculatePrice(pricing, price); return <tr key={price} className={`border-t border-slate-800 ${Math.abs(price - pricing.sellingPrice) < 0.005 ? 'bg-indigo-400/5' : ''}`}>
                <td className="px-3 py-2.5 font-medium text-white">{formatUsd(price)}{Math.abs(price - pricing.sellingPrice) < 0.005 && <span className="ml-1.5 text-[9px] text-indigo-300">Current</span>}</td><td className="px-3 py-2.5 text-right text-slate-300">{formatUsd(scenario.totalCost)}</td><td className="px-3 py-2.5 text-right text-slate-300">{formatUsd(scenario.etsyFees)}</td><td className={`px-3 py-2.5 text-right ${scenario.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatUsd(scenario.netProfit)}</td><td className={`px-3 py-2.5 text-right ${scenario.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{(scenario.profitMargin * 100).toFixed(1)}%</td>
              </tr>; })}</tbody>
            </table></div>
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-[10px] leading-4 text-slate-500"><Info className="mt-0.5 h-3 w-3 shrink-0" />Official Etsy US defaults shown: $0.20 listing, 6.5% transaction, and 3% + $0.25 payment processing. Etsy fee rates vary by seller country and can change; adjust these editable inputs to match your shop. Printify costs and shipping are live catalog values when available; other entries are estimates you control. Tax on the buyer is excluded.</p>
        <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
          <a href="https://help.etsy.com/hc/en-us/articles/115014483627-What-are-the-Fees-and-Taxes-for-Selling-on-Etsy" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">Etsy official fees</a>
          <a href="https://help.etsy.com/hc/en-us/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">Etsy processing rates by country</a>
          <a href="https://developers.printify.com/" target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200">Printify API catalog, cost and shipping data</a>
        </div>
      </section>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; hint?: string; strong?: boolean; positive?: boolean }> = ({ label, value, hint, strong, positive }) => (
  <div className={`flex items-baseline justify-between gap-3 ${strong ? 'font-semibold' : ''}`}><span className={`${strong ? 'text-slate-200' : 'text-slate-400'}`}>{label}{hint && <span className="ml-1.5 text-[9px] font-normal text-slate-600">{hint}</span>}</span><span className={`tabular-nums ${positive === undefined ? 'text-white' : positive ? 'text-emerald-300' : 'text-rose-300'}`}>{value}</span></div>
);
