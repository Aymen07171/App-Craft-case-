import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  KeyRound,
  Store,
} from 'lucide-react';
import {
  getStoredEtsyCredentials,
  saveAndVerifyEtsyCredentials,
  diagnoseEtsyHealth,
  parseEtsyCredentialsFromFile,
  startEtsyOAuthPopup,
  checkEtsyConnection,
} from '../services/etsyClient';

interface EtsyKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (info: any) => void;
}

export const EtsyKeyModal: React.FC<EtsyKeyModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const initialCreds = getStoredEtsyCredentials();
  const [clientId, setClientId] = useState(initialCreds.clientId);
  const [clientSecret, setClientSecret] = useState(initialCreds.clientSecret);
  const [scopes, setScopes] = useState(initialCreds.scopes);
  const [shopId, setShopId] = useState(initialCreds.shopId);
  const [accessToken, setAccessToken] = useState(initialCreds.accessToken || '');
  const [showSecret, setShowSecret] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isOAuthRunning, setIsOAuthRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredEtsyCredentials();
      setClientId(stored.clientId);
      setClientSecret(stored.clientSecret);
      setScopes(stored.scopes);
      setShopId(stored.shopId);
      setAccessToken(stored.accessToken || '');
      setError(null);
      setSuccessMsg(null);
      setDiagnosticReport(null);

      setIsLoading(true);
      checkEtsyConnection(stored)
        .then((res) => {
          if (res.connected) {
            setShopInfo(res.shop || null);
            setApplicationId(res.applicationId || null);
            setOauthConnected(Boolean(res.oauthConnected));
            if (res.shopId) setShopId(String(res.shopId));
          }
        })
        .catch((err) => {
          setError(err.message || 'Could not verify Etsy connection.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsed = parseEtsyCredentialsFromFile(content);
      if (parsed) {
        if (parsed.clientId) setClientId(parsed.clientId);
        if (parsed.clientSecret) setClientSecret(parsed.clientSecret);
        if (parsed.scopes) setScopes(parsed.scopes);
        if (parsed.shopId) setShopId(parsed.shopId);
        if (parsed.accessToken) setAccessToken(parsed.accessToken);
        setImportedFileName(file.name);
        setSuccessMsg(`Extracted Etsy API credentials from "${file.name}". Click "Save & Connect" to verify.`);
      } else {
        setError(`Could not find ETSY_CLIENT_ID / ETSY_CLIENT_SECRET in "${file.name}".`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAndVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await saveAndVerifyEtsyCredentials({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        scopes: scopes.trim(),
        shopId: shopId.trim(),
        accessToken: accessToken.trim() || undefined,
      });

      setShopInfo(res.shop || null);
      setApplicationId(res.applicationId || null);
      setOauthConnected(Boolean(res.oauthConnected));
      setSuccessMsg(
        `✓ Connected to Etsy Store "${res.shopName || 'CraftCasesStudio'}" (Shop ID: ${
          res.shopId
        }, App ID: ${res.applicationId})`
      );
      if (onConnected) onConnected(res);
    } catch (err: any) {
      setError(err.message || 'Failed to verify Etsy credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await diagnoseEtsyHealth({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        scopes: scopes.trim(),
        shopId: shopId.trim(),
        accessToken: accessToken.trim() || undefined,
      });
      setDiagnosticReport(res.report || null);
      if (res.report?.shop) setShopInfo(res.report.shop);
      if (res.report?.applicationId) setApplicationId(res.report.applicationId);
      if (res.ok) {
        setSuccessMsg(res.message);
      } else {
        setError(res.message || 'Diagnostic check reported an issue.');
      }
    } catch (err: any) {
      setError(err.message || 'Etsy diagnostic check failed.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAuthorizeOAuth = async () => {
    setIsOAuthRunning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await startEtsyOAuthPopup();
      if (res.ok && res.accessToken) {
        setAccessToken(res.accessToken);
        setOauthConnected(true);
        setSuccessMsg('✓ Etsy OAuth 2.0 PKCE token authorized! Full write & transaction scopes are active.');
        if (onConnected) onConnected(res);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to launch Etsy OAuth 2.0 flow.');
    } finally {
      setIsOAuthRunning(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="etsy-key-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-orange-900/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl space-y-5 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <h2 id="etsy-key-modal-title" className="text-base font-bold text-white">
                Etsy Open API v3 Store Integration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct connection to your Etsy Shop via Keystring, Shared Secret, and OAuth 2.0 PKCE Scopes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Store Connection Banner */}
        <div
          className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
            shopInfo
              ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200'
              : 'border-slate-800 bg-slate-950 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {shopInfo?.icon_url_fullxfull ? (
              <img
                src={shopInfo.icon_url_fullxfull}
                alt={shopInfo.shop_name}
                className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40"
              />
            ) : (
              <Store className="h-5 w-5 text-emerald-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {shopInfo?.shop_name || 'CraftCasesStudio'}
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Shop ID: {shopInfo?.shop_id || shopId}
                </span>
                {applicationId && (
                  <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[10px] font-mono text-orange-300">
                    App ID: {applicationId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {shopInfo
                  ? `${shopInfo.listing_active_count ?? 0} Active Listings · Currency: ${shopInfo.currency_code || 'USD'}`
                  : 'Verifying Etsy Open API v3 connection...'}
              </p>
            </div>
          </div>

          {shopInfo?.url && (
            <a
              href={shopInfo.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-900/30 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-900/50 transition"
            >
              Visit Etsy Shop <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveAndVerify} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ETSY_CLIENT_ID (Keystring)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="lwcieui5fkfttw43kdeqqurp"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ETSY_CLIENT_SECRET (Shared Secret)
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="u41l2l4p62ywcbtsut2bxkj2x"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 pr-9 text-xs font-mono text-white outline-none focus:border-orange-400"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute top-2 right-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ETSY_SCOPES
              </label>
              <input
                type="text"
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                placeholder="listings_r listings_w transactions_r shops_r"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-orange-200 outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ETSY_SHOP_ID
              </label>
              <input
                type="text"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="7939147"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* OAuth 2.0 PKCE Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-orange-400" />
                  OAuth 2.0 User Authorization (for <code className="text-orange-300">listings_w</code> &amp; <code className="text-orange-300">transactions_r</code>)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Callback URL to register in Etsy Developer Portal:{' '}
                  <code className="text-indigo-300 select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/etsy?action=oauth-callback` : 'http://localhost:3000/api/etsy?action=oauth-callback'}
                  </code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAuthorizeOAuth}
                disabled={isOAuthRunning}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/50 bg-orange-500/15 hover:bg-orange-500/25 px-3 py-1.5 text-xs font-semibold text-orange-200 transition cursor-pointer"
              >
                {isOAuthRunning ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                <span>{oauthConnected ? 'Re-Authorize OAuth 2.0' : 'Authorize Etsy OAuth 2.0'}</span>
              </button>
            </div>

            <div>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Optional: Paste OAuth 2.0 Bearer Access Token directly (if already generated)"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-mono text-slate-200 outline-none focus:border-orange-500/60"
              />
            </div>
          </div>

          {/* File Import Option */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs">
            <span className="text-slate-400">
              {importedFileName ? (
                <span className="text-emerald-300 font-semibold">✓ Loaded {importedFileName}</span>
              ) : (
                'Or import ETSY_CLIENT_ID & ETSY_CLIENT_SECRET from a .env file'
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" /> Browse .env
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".env,.txt,.json,text/plain"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
          </div>

          {/* Diagnostic Report Steps */}
          {diagnosticReport?.steps && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Etsy Open API v3 Diagnostic Report
              </p>
              {diagnosticReport.steps.map((s: any) => (
                <div key={s.step} className="flex items-start gap-2 text-[11px]">
                  <span className={s.ok ? 'text-emerald-400' : 'text-rose-400'}>
                    {s.ok ? '✓' : '✗'}
                  </span>
                  <span className={s.ok ? 'text-slate-200' : 'text-rose-300'}>{s.message}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <a
              href="https://www.etsy.com/developers/your-apps"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-orange-400 hover:text-orange-300 underline flex items-center gap-1"
            >
              Etsy Developer Portal <ExternalLink className="h-3 w-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiagnose}
                disabled={isDiagnosing || isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/50 bg-teal-950/40 hover:bg-teal-900/60 px-3.5 py-2 text-xs font-semibold text-teal-200 transition cursor-pointer"
              >
                {isDiagnosing ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-teal-300" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                )}
                <span>{isDiagnosing ? 'Testing Etsy API...' : 'Diagnose Etsy API'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isLoading || isDiagnosing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-40 shadow-md shadow-orange-950 cursor-pointer"
              >
                {isLoading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>{isLoading ? 'Verifying...' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
