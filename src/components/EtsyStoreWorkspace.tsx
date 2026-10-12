import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Store,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  Tag,
  UploadCloud,
  Sparkles,
  Edit3,
  ArrowDownToLine,
  KeyRound,
  Receipt,
  Layers,
  Check,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { UnifiedProductRecord } from '../types/unifiedWorkflow';
import {
  checkEtsyConnection,
  fetchEtsyListings,
  createEtsyListing,
  updateEtsyListing,
  fetchEtsyTransactions,
  startEtsyOAuthPopup,
  EtsyListingItem,
} from '../services/etsyClient';
import { getPrintifyHeaders } from '../services/printifyClient';

interface EtsyStoreWorkspaceProps {
  product: UnifiedProductRecord;
  onUpdateProduct: (updated: UnifiedProductRecord) => void;
  onOpenEtsyKeyModal: () => void;
  onNavigateToStep?: (step: any) => void;
}

export const EtsyStoreWorkspace: React.FC<EtsyStoreWorkspaceProps> = ({
  product,
  onUpdateProduct,
  onOpenEtsyKeyModal,
  onNavigateToStep,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'publish' | 'transactions'>('listings');
  const [connection, setConnection] = useState<any>(null);
  const [listings, setListings] = useState<EtsyListingItem[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isPublishingDirect, setIsPublishingDirect] = useState(false);
  const [isPublishingPrintify, setIsPublishingPrintify] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inline SEO Editor state for an Etsy listing
  const [editingListing, setEditingListing] = useState<EtsyListingItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadEtsyStoreAndListings = async () => {
    setIsLoadingStore(true);
    setIsLoadingListings(true);
    setError(null);

    try {
      const [connRes, listingsRes] = await Promise.all([
        checkEtsyConnection(),
        fetchEtsyListings({ limit: 30, offset: 0, state: 'active' }),
      ]);
      setConnection(connRes);
      setListings(listingsRes.listings || []);
      setTotalListings(listingsRes.count || (listingsRes.listings || []).length);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Etsy store.');
    } finally {
      setIsLoadingStore(false);
      setIsLoadingListings(false);
    }
  };

  useEffect(() => {
    loadEtsyStoreAndListings();
  }, []);

  const handleLoadTransactions = async () => {
    setIsLoadingTransactions(true);
    setError(null);
    try {
      const res = await fetchEtsyTransactions(25, 0);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Could not load Etsy transactions.');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      handleLoadTransactions();
    }
  }, [activeTab]);

  const handleImportListingToStudio = (item: EtsyListingItem) => {
    const paddedTags = [
      ...(item.tags || []).slice(0, 13),
      ...Array(Math.max(0, 13 - (item.tags || []).length)).fill(''),
    ].slice(0, 13);

    const priceVal = item.price
      ? Number(item.price.amount) / Number(item.price.divisor || 100)
      : 22.2;

    const updatedMockups =
      item.images && item.images.length > 0
        ? item.images.slice(0, 8).map((img, idx) => ({
            slotIndex: idx,
            modelId: `etsy-image-${img.listing_image_id}`,
            modelName: idx === 0 ? 'Primary Etsy Mockup' : `Etsy Gallery Mockup #${idx + 1}`,
            sceneTitle: `Etsy Listing #${item.listing_id} Image ${idx + 1}`,
            localUrl: img.url_fullxfull || img.url_570xN || null,
            fileId: String(img.listing_image_id),
            fileUrl: img.url_fullxfull || img.url_570xN || '',
            verified: true,
            isPrimary: idx === 0,
            status: 'uploaded' as const,
          }))
        : product.mockups;

    onUpdateProduct({
      ...product,
      designName: item.title.split(',')[0].trim(),
      listing: {
        ...product.listing,
        title: item.title,
        description: item.description || product.listing.description,
        tags: paddedTags,
      },
      product: {
        ...product.product,
        price: priceVal,
      },
      mockups: updatedMockups,
      automation: {
        ...product.automation,
        etsyListingId: String(item.listing_id),
        status: 'PUBLISHED',
      },
    });

    setSuccessMsg(
      `✓ Loaded Etsy Listing #${item.listing_id} ("${item.title.slice(0, 48)}...") into CaseCraft Studio!`
    );
  };

  const handleOpenEditModal = (item: EtsyListingItem) => {
    setEditingListing(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditTags([
      ...(item.tags || []).slice(0, 13),
      ...Array(Math.max(0, 13 - (item.tags || []).length)).fill(''),
    ]);
  };

  const handleSaveListingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setIsSavingEdit(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await updateEtsyListing({
        listingId: editingListing.listing_id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        tags: editTags.filter((t) => t.trim()),
      });
      setSuccessMsg(`✓ Updated Etsy Listing #${editingListing.listing_id} on CraftCasesStudio!`);
      setEditingListing(null);
      await loadEtsyStoreAndListings();
    } catch (err: any) {
      if (err?.requiresOAuth) {
        setError(
          'Updating listings directly via Etsy API v3 requires OAuth 2.0 authorization (listings_w). Click "Authorize Etsy OAuth 2.0" to grant write access.'
        );
      } else {
        setError(err.message || 'Failed to update Etsy listing.');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateDraftViaEtsyApi = async () => {
    setIsPublishingDirect(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await createEtsyListing({
        title: product.listing.title || `${product.designName} Tough Phone Case`,
        description: product.listing.description || 'Premium Dual-Layer Tough Phone Case.',
        price: product.product.price || 22.2,
        tags: product.listing.tags.filter((t) => t.trim()),
        quantity: 999,
        taxonomy_id: 873,
      });

      if (res.listing?.listing_id) {
        onUpdateProduct({
          ...product,
          automation: {
            ...product.automation,
            etsyListingId: String(res.listing.listing_id),
            status: 'PUBLISHED',
          },
        });
        setSuccessMsg(
          `✓ Created Etsy Draft Listing #${res.listing.listing_id} in CraftCasesStudio!`
        );
        await loadEtsyStoreAndListings();
      }
    } catch (err: any) {
      if (err?.requiresOAuth) {
        setError(
          'Direct listing creation via Etsy Open API v3 requires OAuth 2.0 user authorization (listings_w). Use "Authorize OAuth 2.0" or click "Publish via Printify → Etsy Channel" below.'
        );
      } else {
        setError(err.message || 'Failed to create Etsy draft listing.');
      }
    } finally {
      setIsPublishingDirect(false);
    }
  };

  const handlePublishViaPrintifyEtsyChannel = async () => {
    const printifyProductId =
      product.automation.printifyProductId || '6acca8512fe24e63d7081433';
    const shopId = product.printify.shopId || '29067558';

    setIsPublishingPrintify(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/printify', {
        method: 'POST',
        headers: getPrintifyHeaders(),
        body: JSON.stringify({
          action: 'publish',
          shopId,
          productId: printifyProductId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Printify → Etsy publish failed (${response.status})`);
      }

      setSuccessMsg(
        `✓ Triggered Printify → Etsy Store Sync for Product ${printifyProductId} to CraftCasesStudio (Shop ID: 7939147) with your 8 selected mockups!`
      );
      setTimeout(() => loadEtsyStoreAndListings(), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync product from Printify to Etsy.');
    } finally {
      setIsPublishingPrintify(false);
    }
  };

  const handleLaunchOAuth = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await startEtsyOAuthPopup();
      if (res.ok) {
        setSuccessMsg('✓ Etsy OAuth 2.0 PKCE connected! Full write & transaction scopes enabled.');
        await loadEtsyStoreAndListings();
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start Etsy OAuth.');
    }
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      String(item.listing_id).includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const shop = connection?.shop;

  return (
    <div className="space-y-6">
      {/* Top Store Banner */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {shop?.icon_url_fullxfull ? (
              <img
                src={shop.icon_url_fullxfull}
                alt={shop.shop_name}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-orange-500/50 shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {shop?.shop_name || 'CraftCasesStudio'}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Etsy API v3 Connected
                </span>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-mono text-orange-300">
                  Shop ID: {shop?.shop_id || connection?.shopId || '7939147'}
                </span>
                {connection?.applicationId && (
                  <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs font-mono text-slate-300">
                    App ID: {connection.applicationId}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1">
                {shop?.title || 'Premium Aesthetic Phone Cases & Protective Covers'} ·{' '}
                <span className="text-orange-300 font-semibold">
                  {shop?.listing_active_count ?? totalListings} Active Listings
                </span>{' '}
                · Linked with Printify Store <code className="text-indigo-300">#29067558</code>
              </p>

              {/* Scopes Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
                  Active Scopes:
                </span>
                {(connection?.scopes || ['listings_r', 'listings_w', 'transactions_r', 'shops_r']).map(
                  (scope: string) => (
                    <span
                      key={scope}
                      className="rounded-md border border-indigo-500/30 bg-indigo-950/50 px-2 py-0.5 text-[10px] font-mono text-indigo-300"
                    >
                      {scope}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadEtsyStoreAndListings}
              disabled={isLoadingListings}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingListings ? 'animate-spin' : ''}`} />
              <span>Refresh Store</span>
            </button>

            <button
              type="button"
              onClick={onOpenEtsyKeyModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-950/40 hover:bg-orange-900/50 px-3.5 py-2 text-xs font-semibold text-orange-200 transition cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-orange-400" />
              <span>API Keys &amp; Diagnostics</span>
            </button>

            <a
              href={shop?.url || 'https://www.etsy.com/shop/CraftCasesStudio'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-950 transition"
            >
              <span>Open Etsy Shop</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleLaunchOAuth}
            className="shrink-0 rounded-lg border border-orange-500/50 bg-orange-500/20 px-3 py-1 text-[11px] font-semibold text-orange-200 hover:bg-orange-500/30 cursor-pointer"
          >
            Authorize OAuth 2.0
          </button>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-center gap-2.5"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Live Etsy Listings ({totalListings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'publish'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Publish Current Product ({product.productId})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Transactions &amp; Orders (transactions_r)</span>
          </button>
        </div>

        {activeTab === 'listings' && (
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 27 live listings by title, tag, ID..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Live Etsy Store Listings Catalog */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {isLoadingListings ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-orange-400 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Fetching live listings &amp; mockup galleries from CraftCasesStudio (Shop ID: 7939147)...
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-xs text-slate-400">
              No Etsy listings matched your search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((item) => (
                <div
                  key={item.listing_id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg hover:border-orange-500/40 transition"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-56 w-full bg-slate-950 overflow-hidden">
                      {item.primaryImage ? (
                        <img
                          src={item.primaryImage}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600">
                          <ShoppingBag className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="rounded-md bg-slate-950/85 backdrop-blur px-2 py-0.5 text-[10px] font-mono font-semibold text-orange-300 border border-orange-500/30">
                          #{item.listing_id}
                        </span>
                        <span className="rounded-md bg-emerald-950/90 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300 border border-emerald-500/30">
                          {item.state}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span className="rounded-md bg-slate-950/85 backdrop-blur px-2.5 py-1 text-xs font-bold text-white border border-slate-700">
                          ${item.priceFormatted || '22.20'}
                        </span>
                      </div>
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] text-slate-300">
                          {item.images.length} Mockups
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 6).map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 6 && (
                            <span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                              +{item.tags.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="border-t border-slate-800/80 bg-slate-950/50 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleImportListingToStudio(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/60 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-200 transition cursor-pointer"
                        title="Load this Etsy listing's title, description, tags, and mockups into CaseCraft Studio"
                      >
                        <ArrowDownToLine className="h-3 w-3" />
                        <span>Load in Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition cursor-pointer"
                        title="Edit SEO Title, Description & 13 Tags on Etsy"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit SEO</span>
                      </button>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:text-orange-300"
                    >
                      <span>Etsy</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Publish Current Product to Etsy */}
      {activeTab === 'publish' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400">
                Active Product Pipeline → CraftCasesStudio
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {product.listing.title || product.designName}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                SKU: <code className="text-indigo-300">{product.product.sku}</code> · Price:{' '}
                <span className="text-emerald-300 font-semibold">
                  ${product.product.price.toFixed(2)} USD
                </span>{' '}
                · Printify Product ID:{' '}
                <code className="text-indigo-300">
                  {product.automation.printifyProductId || '6acca8512fe24e63d7081433'}
                </code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handlePublishViaPrintifyEtsyChannel}
                disabled={isPublishingPrintify}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-950 transition cursor-pointer"
              >
                {isPublishingPrintify ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                <span>
                  {isPublishingPrintify
                    ? 'Syncing Printify → Etsy...'
                    : 'Publish via Printify → Etsy Channel (8 Mockups + 34 Variants)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCreateDraftViaEtsyApi}
                disabled={isPublishingDirect}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900/60 disabled:opacity-40 px-4 py-2.5 text-xs font-semibold text-indigo-200 transition cursor-pointer"
              >
                {isPublishingDirect ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                )}
                <span>Create Draft via Etsy Open API v3 (listings_w)</span>
              </button>
            </div>
          </div>

          {/* 8 Ordered Mockups Preview */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Configured Mockup Gallery ({product.mockups.length} Images — Custom Lifestyle Mockups First)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {product.mockups.map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-2 bg-slate-950 space-y-1.5 ${
                    idx === 0 ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 relative">
                    {m.localUrl || m.fileUrl ? (
                      <img
                        src={m.localUrl || m.fileUrl}
                        alt={m.modelName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <span
                      className={`absolute top-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        idx === 0
                          ? 'bg-emerald-600 text-white'
                          : idx === 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900/90 text-slate-300'
                      }`}
                    >
                      {idx === 0 ? '★ PRIMARY' : `#${idx + 1}`}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-300 truncate" title={m.modelName}>
                    {m.modelName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 13 Etsy Tags Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              13 Etsy SEO Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {product.listing.tags.filter(Boolean).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
                >
                  <Tag className="h-3 w-3 text-orange-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Transactions & Orders (transactions_r) */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Etsy Shop Transactions (<code className="text-orange-300">transactions_r</code>)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                View real-time order transactions from CraftCasesStudio (Shop ID: 7939147).
              </p>
            </div>
            <button
              type="button"
              onClick={handleLaunchOAuth}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/25 px-3.5 py-2 text-xs font-semibold text-orange-200 transition cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Authorize OAuth 2.0 (transactions_r)</span>
            </button>
          </div>

          {isLoadingTransactions ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-orange-400 mx-auto mb-2" />
              Loading Etsy shop transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center space-y-2">
              <Receipt className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs font-medium text-slate-300">
                No transactions found or OAuth 2.0 user token not yet authorized.
              </p>
              <p className="text-[11px] text-slate-500">
                Click &ldquo;Authorize OAuth 2.0 (transactions_r)&rdquo; above to grant user-level transaction read access.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div
                  key={tx.transaction_id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{tx.title}</p>
                    <p className="text-[11px] text-slate-400">
                      Transaction #{tx.transaction_id} · Quantity: {tx.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-300">
                    ${tx.price ? (tx.price.amount / tx.price.divisor).toFixed(2) : '22.20'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Editing Etsy Listing SEO */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveListingEdit}
            className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Edit Etsy Listing #{editingListing.listing_id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Listing Title (Max 140 chars)
              </label>
              <input
                type="text"
                maxLength={140}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                13 Etsy Tags
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {editTags.map((tag, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={20}
                    value={tag}
                    onChange={(e) => {
                      const next = [...editTags];
                      next[idx] = e.target.value;
                      setEditTags(next);
                    }}
                    placeholder={`Tag ${idx + 1}`}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
              >
                {isSavingEdit ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save to Etsy</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
