/**
 * Etsy Open API v3 Client Service
 * Manages ETSY_CLIENT_ID, ETSY_CLIENT_SECRET, ETSY_SCOPES, OAuth 2.0 PKCE flow,
 * Shop connection, Live Listings catalog, Listing creation/updates, and Transactions.
 */

export const ETSY_STORAGE_KEY = 'casecraft_etsy_credentials';

export const DEFAULT_ETSY_CLIENT_ID = 'lwcieui5fkfttw43kdeqqurp';
export const DEFAULT_ETSY_CLIENT_SECRET = 'u41l2l4p62ywcbtsut2bxkj2x';
export const DEFAULT_ETSY_SCOPES = 'listings_r listings_w transactions_r shops_r';
export const DEFAULT_ETSY_SHOP_ID = '7939147';
export const DEFAULT_ETSY_SHOP_NAME = 'CraftCasesStudio';

export interface StoredEtsyCredentials {
  clientId: string;
  clientSecret: string;
  scopes: string;
  shopId: string;
  shopName: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface EtsyListingItem {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: 'active' | 'draft' | 'inactive' | 'expired' | 'sold_out';
  url: string;
  price?: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  priceFormatted?: string;
  quantity: number;
  tags: string[];
  views?: number;
  num_favorers?: number;
  taxonomy_id?: number;
  shipping_profile_id?: number;
  primaryImage?: string | null;
  images?: {
    listing_image_id: number;
    rank: number;
    url_75x75?: string;
    url_170x135?: string;
    url_570xN?: string;
    url_fullxfull?: string;
  }[];
}

export function getStoredEtsyCredentials(): StoredEtsyCredentials {
  try {
    const raw = localStorage.getItem(ETSY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        clientId: parsed.clientId || DEFAULT_ETSY_CLIENT_ID,
        clientSecret: parsed.clientSecret || DEFAULT_ETSY_CLIENT_SECRET,
        scopes: parsed.scopes || DEFAULT_ETSY_SCOPES,
        shopId: parsed.shopId || DEFAULT_ETSY_SHOP_ID,
        shopName: parsed.shopName || DEFAULT_ETSY_SHOP_NAME,
        accessToken: parsed.accessToken || undefined,
        refreshToken: parsed.refreshToken || undefined,
      };
    }
  } catch {
    // ignore storage read error
  }
  return {
    clientId: DEFAULT_ETSY_CLIENT_ID,
    clientSecret: DEFAULT_ETSY_CLIENT_SECRET,
    scopes: DEFAULT_ETSY_SCOPES,
    shopId: DEFAULT_ETSY_SHOP_ID,
    shopName: DEFAULT_ETSY_SHOP_NAME,
  };
}

export function setStoredEtsyCredentials(creds: Partial<StoredEtsyCredentials>): StoredEtsyCredentials {
  const current = getStoredEtsyCredentials();
  const updated: StoredEtsyCredentials = {
    ...current,
    ...creds,
  };
  try {
    localStorage.setItem(ETSY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save Etsy credentials to localStorage:', err);
  }
  return updated;
}

export function clearStoredEtsyCredentials(): void {
  try {
    localStorage.removeItem(ETSY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function parseEtsyCredentialsFromFile(content: string): Partial<StoredEtsyCredentials> | null {
  if (!content) return null;
  const trimmed = content.trim();
  const result: Partial<StoredEtsyCredentials> = {};

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.ETSY_CLIENT_ID || parsed.clientId) {
        result.clientId = String(parsed.ETSY_CLIENT_ID || parsed.clientId).trim();
      }
      if (parsed.ETSY_CLIENT_SECRET || parsed.clientSecret) {
        result.clientSecret = String(parsed.ETSY_CLIENT_SECRET || parsed.clientSecret).trim();
      }
      if (parsed.ETSY_SCOPES || parsed.scopes) {
        result.scopes = String(parsed.ETSY_SCOPES || parsed.scopes).trim();
      }
      if (parsed.ETSY_SHOP_ID || parsed.shopId) {
        result.shopId = String(parsed.ETSY_SHOP_ID || parsed.shopId).trim();
      }
      if (parsed.ETSY_ACCESS_TOKEN || parsed.accessToken) {
        result.accessToken = String(parsed.ETSY_ACCESS_TOKEN || parsed.accessToken).trim();
      }
      if (Object.keys(result).length > 0) return result;
    } catch {
      // Fall through to line parser
    }
  }

  const idMatch = trimmed.match(/ETSY_CLIENT_ID\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (idMatch?.[1]) result.clientId = idMatch[1].trim();

  const secretMatch = trimmed.match(/ETSY_CLIENT_SECRET\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (secretMatch?.[1]) result.clientSecret = secretMatch[1].trim();

  const scopesMatch = trimmed.match(/ETSY_SCOPES\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (scopesMatch?.[1]) result.scopes = scopesMatch[1].replace(/^["']|["']$/g, '').trim();

  const shopIdMatch = trimmed.match(/ETSY_SHOP_ID\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (shopIdMatch?.[1]) result.shopId = shopIdMatch[1].trim();

  const tokenMatch = trimmed.match(/ETSY_ACCESS_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/i);
  if (tokenMatch?.[1]) result.accessToken = tokenMatch[1].trim();

  return Object.keys(result).length > 0 ? result : null;
}

export function getEtsyHeaders(overrides?: Partial<StoredEtsyCredentials>): HeadersInit {
  const creds = { ...getStoredEtsyCredentials(), ...overrides };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (creds.clientId) headers['x-etsy-client-id'] = creds.clientId;
  if (creds.clientSecret) headers['x-etsy-client-secret'] = creds.clientSecret;
  if (creds.scopes) headers['x-etsy-scopes'] = creds.scopes;
  if (creds.shopId) headers['x-etsy-shop-id'] = creds.shopId;
  if (creds.accessToken) headers['x-etsy-access-token'] = creds.accessToken;
  return headers;
}

export async function checkEtsyConnection(overrides?: Partial<StoredEtsyCredentials>) {
  const creds = { ...getStoredEtsyCredentials(), ...overrides };
  const params = new URLSearchParams({ action: 'connection' });
  if (creds.shopId) params.set('shopId', creds.shopId);
  if (creds.shopName) params.set('shopName', creds.shopName);

  const res = await fetch(`/api/etsy?${params.toString()}`, {
    headers: getEtsyHeaders(creds),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Etsy connection check failed (${res.status})`);
  }
  return data;
}

export async function saveAndVerifyEtsyCredentials(creds: Partial<StoredEtsyCredentials>) {
  const merged = { ...getStoredEtsyCredentials(), ...creds };
  const res = await fetch('/api/etsy', {
    method: 'POST',
    headers: getEtsyHeaders(merged),
    body: JSON.stringify({
      action: 'save-credentials',
      ...merged,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to verify Etsy credentials (${res.status})`);
  }
  setStoredEtsyCredentials({
    ...merged,
    shopId: data.shopId || merged.shopId,
    shopName: data.shopName || merged.shopName,
  });
  return data;
}

export async function diagnoseEtsyHealth(overrides?: Partial<StoredEtsyCredentials>) {
  const creds = { ...getStoredEtsyCredentials(), ...overrides };
  const res = await fetch('/api/etsy', {
    method: 'POST',
    headers: getEtsyHeaders(creds),
    body: JSON.stringify({
      action: 'diagnose',
      ...creds,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Etsy diagnostic health check failed.');
  }
  return data;
}

export async function fetchEtsyListings(options?: {
  shopId?: string;
  limit?: number;
  offset?: number;
  state?: string;
}): Promise<{ count: number; shopId: string; listings: EtsyListingItem[] }> {
  const creds = getStoredEtsyCredentials();
  const params = new URLSearchParams({
    action: 'listings',
    shopId: options?.shopId || creds.shopId,
    limit: String(options?.limit || 25),
    offset: String(options?.offset || 0),
    state: options?.state || 'active',
  });

  const res = await fetch(`/api/etsy?${params.toString()}`, {
    headers: getEtsyHeaders(creds),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to load Etsy listings (${res.status})`);
  }
  return data;
}

export async function createEtsyListing(payload: {
  title: string;
  description: string;
  price: number;
  tags: string[];
  quantity?: number;
  taxonomy_id?: number;
  shipping_profile_id?: number;
}) {
  const creds = getStoredEtsyCredentials();
  const res = await fetch('/api/etsy', {
    method: 'POST',
    headers: getEtsyHeaders(creds),
    body: JSON.stringify({
      action: 'create-listing',
      shopId: creds.shopId,
      ...payload,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || `Failed to create Etsy listing (${res.status})`), {
      requiresOAuth: Boolean(data.requiresOAuth),
    });
  }
  return data;
}

export async function updateEtsyListing(payload: {
  listingId: number | string;
  title?: string;
  description?: string;
  tags?: string[];
  state?: 'active' | 'inactive' | 'draft';
}) {
  const creds = getStoredEtsyCredentials();
  const res = await fetch('/api/etsy', {
    method: 'POST',
    headers: getEtsyHeaders(creds),
    body: JSON.stringify({
      action: 'update-listing',
      shopId: creds.shopId,
      ...payload,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || `Failed to update Etsy listing (${res.status})`), {
      requiresOAuth: Boolean(data.requiresOAuth),
    });
  }
  return data;
}

export async function fetchEtsyTransactions(limit = 25, offset = 0) {
  const creds = getStoredEtsyCredentials();
  const params = new URLSearchParams({
    action: 'transactions',
    shopId: creds.shopId,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/etsy?${params.toString()}`, {
    headers: getEtsyHeaders(creds),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(data.error || `Failed to fetch Etsy transactions (${res.status})`),
      { requiresOAuth: Boolean(data.requiresOAuth) }
    );
  }
  return data;
}

export async function startEtsyOAuthPopup(): Promise<{
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  error?: string;
}> {
  const creds = getStoredEtsyCredentials();
  const redirectUri = `${window.location.origin}/api/etsy?action=oauth-callback`;
  const params = new URLSearchParams({
    action: 'oauth-start',
    redirectUri,
  });

  const res = await fetch(`/api/etsy?${params.toString()}`, {
    headers: getEtsyHeaders(creds),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.authUrl) {
    throw new Error(data.error || 'Could not initialize Etsy OAuth 2.0 PKCE flow.');
  }

  return new Promise((resolve) => {
    const width = 620;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      data.authUrl,
      'etsy_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      resolve({
        ok: false,
        error: 'Popup blocked by browser. Please allow popups for this site and try again.',
      });
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ETSY_OAUTH_RESULT') {
        window.removeEventListener('message', handleMessage);
        clearInterval(pollTimer);
        if (event.data.ok && event.data.accessToken) {
          setStoredEtsyCredentials({
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken || undefined,
          });
          resolve({
            ok: true,
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            userId: event.data.userId,
          });
        } else {
          resolve({
            ok: false,
            error: event.data.error || 'Etsy OAuth authorization failed.',
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
        resolve({
          ok: false,
          error: 'OAuth window was closed before completing authorization.',
        });
      }
    }, 800);
  });
}
