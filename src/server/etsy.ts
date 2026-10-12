import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ override: true });

const ETSY_API_ROOT = 'https://api.etsy.com/v3/application';
const ETSY_OAUTH_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const ETSY_OAUTH_CONNECT_URL = 'https://www.etsy.com/oauth/connect';

export const DEFAULT_ETSY_CLIENT_ID = 'lwcieui5fkfttw43kdeqqurp';
export const DEFAULT_ETSY_CLIENT_SECRET = 'u41l2l4p62ywcbtsut2bxkj2x';
export const DEFAULT_ETSY_SCOPES = 'listings_r listings_w transactions_r shops_r';
export const DEFAULT_ETSY_SHOP_ID = '7939147';
export const DEFAULT_ETSY_SHOP_NAME = 'CraftCasesStudio';

export interface EtsyCredentials {
  clientId: string;
  clientSecret: string;
  scopes: string;
  shopId: string;
  shopName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userId?: string;
}

interface EtsySessionStore {
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  shopId?: string;
  shopName?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userId?: string;
  updatedAt?: string;
}

let memorySession: EtsySessionStore = {};
const pkceStore = new Map<string, { codeVerifier: string; redirectUri: string; createdAt: number }>();

function getSessionFilePath(): string {
  return path.resolve(process.cwd(), '.etsy-session.json');
}

function loadSessionFromDisk(): EtsySessionStore {
  try {
    const filePath = getSessionFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memorySession = { ...memorySession, ...parsed };
    }
  } catch {
    // Ignore disk read errors in serverless environments
  }
  return memorySession;
}

function saveSessionToDisk(update: Partial<EtsySessionStore>): EtsySessionStore {
  memorySession = {
    ...memorySession,
    ...update,
    updatedAt: new Date().toISOString(),
  };
  try {
    const filePath = getSessionFilePath();
    fs.writeFileSync(filePath, JSON.stringify(memorySession, null, 2), 'utf-8');
  } catch {
    // Ignore disk write errors on read-only serverless filesystems
  }
  return memorySession;
}

export function cleanCredentialValue(raw?: string): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function resolveEtsyCredentials(overrides?: Partial<EtsyCredentials>): EtsyCredentials {
  dotenv.config({ override: true });
  const stored = loadSessionFromDisk();

  const clientId =
    cleanCredentialValue(overrides?.clientId) ||
    cleanCredentialValue(stored.clientId) ||
    cleanCredentialValue(process.env.ETSY_CLIENT_ID) ||
    DEFAULT_ETSY_CLIENT_ID;

  const clientSecret =
    cleanCredentialValue(overrides?.clientSecret) ||
    cleanCredentialValue(stored.clientSecret) ||
    cleanCredentialValue(process.env.ETSY_CLIENT_SECRET) ||
    DEFAULT_ETSY_CLIENT_SECRET;

  const scopes =
    cleanCredentialValue(overrides?.scopes) ||
    cleanCredentialValue(stored.scopes) ||
    cleanCredentialValue(process.env.ETSY_SCOPES) ||
    DEFAULT_ETSY_SCOPES;

  const shopId =
    cleanCredentialValue(overrides?.shopId) ||
    cleanCredentialValue(stored.shopId) ||
    cleanCredentialValue(process.env.ETSY_SHOP_ID) ||
    DEFAULT_ETSY_SHOP_ID;

  const shopName =
    cleanCredentialValue(overrides?.shopName) ||
    cleanCredentialValue(stored.shopName) ||
    cleanCredentialValue(process.env.ETSY_SHOP_NAME) ||
    DEFAULT_ETSY_SHOP_NAME;

  const accessToken =
    cleanCredentialValue(overrides?.accessToken) ||
    cleanCredentialValue(stored.accessToken) ||
    cleanCredentialValue(process.env.ETSY_ACCESS_TOKEN) ||
    undefined;

  const refreshToken =
    cleanCredentialValue(overrides?.refreshToken) ||
    cleanCredentialValue(stored.refreshToken) ||
    cleanCredentialValue(process.env.ETSY_REFRESH_TOKEN) ||
    undefined;

  const userId =
    cleanCredentialValue(overrides?.userId) ||
    cleanCredentialValue(stored.userId) ||
    (accessToken && accessToken.includes('.') ? accessToken.split('.')[0] : undefined);

  return {
    clientId,
    clientSecret,
    scopes,
    shopId,
    shopName,
    accessToken,
    refreshToken,
    expiresAt: overrides?.expiresAt || stored.expiresAt,
    userId,
  };
}

export function buildXApiKeyHeader(creds: EtsyCredentials): string {
  if (!creds.clientId) {
    throw new Error('ETSY_CLIENT_ID is missing. Please configure your Etsy API keystring.');
  }
  return creds.clientSecret ? `${creds.clientId}:${creds.clientSecret}` : creds.clientId;
}

async function refreshEtsyAccessTokenIfNeeded(creds: EtsyCredentials): Promise<EtsyCredentials> {
  if (!creds.accessToken || !creds.refreshToken) {
    return creds;
  }
  const now = Date.now();
  // Refresh if within 2 minutes of expiry
  if (creds.expiresAt && now < creds.expiresAt - 120_000) {
    return creds;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: creds.clientId,
      refresh_token: creds.refreshToken,
    });

    const response = await fetch(ETSY_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': buildXApiKeyHeader(creds),
      },
      body: params.toString(),
    });

    if (response.ok) {
      const tokenData: any = await response.json();
      const expiresAt = Date.now() + Number(tokenData.expires_in || 3600) * 1000;
      const userId = String(tokenData.access_token || '').split('.')[0] || creds.userId;
      saveSessionToDisk({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || creds.refreshToken,
        expiresAt,
        userId,
      });
      return {
        ...creds,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || creds.refreshToken,
        expiresAt,
        userId,
      };
    }
  } catch (err) {
    console.warn('[Etsy] Token auto-refresh failed:', err);
  }
  return creds;
}

export async function etsyFetch(
  endpointPath: string,
  init: RequestInit = {},
  credOverrides?: Partial<EtsyCredentials>,
  requireOAuth = false
): Promise<any> {
  let creds = resolveEtsyCredentials(credOverrides);
  creds = await refreshEtsyAccessTokenIfNeeded(creds);

  const xApiKey = buildXApiKeyHeader(creds);
  const headers: Record<string, string> = {
    'x-api-key': xApiKey,
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };

  if (!(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (creds.accessToken) {
    headers['Authorization'] = `Bearer ${creds.accessToken}`;
  } else if (requireOAuth) {
    throw Object.assign(
      new Error(
        'This Etsy action requires OAuth 2.0 user authorization (scopes: listings_w / transactions_r). Click "Authorize Etsy OAuth 2.0" to grant access.'
      ),
      { status: 401, requiresOAuth: true }
    );
  }

  const fullUrl = endpointPath.startsWith('http')
    ? endpointPath
    : `${ETSY_API_ROOT}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;

  const response = await fetch(fullUrl, {
    ...init,
    headers,
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errMsg =
      data?.error_description ||
      data?.error ||
      data?.message ||
      `Etsy API returned HTTP ${response.status}`;
    throw Object.assign(new Error(errMsg), {
      status: response.status,
      details: data,
    });
  }

  return data;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function generatePkceChallenge(redirectUri: string) {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hash);
  const nonce = base64UrlEncode(crypto.randomBytes(12));

  // Encode codeVerifier + redirectUri inside state so serverless callbacks are 100% stateless
  const statePayload = JSON.stringify({
    n: nonce,
    v: codeVerifier,
    r: redirectUri,
  });
  const state = base64UrlEncode(Buffer.from(statePayload, 'utf-8'));

  pkceStore.set(state, {
    codeVerifier,
    redirectUri,
    createdAt: Date.now(),
  });

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

function decodePkceState(state: string): { codeVerifier?: string; redirectUri?: string } {
  const inMemory = pkceStore.get(state);
  if (inMemory) {
    return inMemory;
  }
  try {
    const padded = state.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    return {
      codeVerifier: parsed.v,
      redirectUri: parsed.r,
    };
  } catch {
    return {};
  }
}

export async function handleEtsyRequest(
  method: string,
  url: URL,
  body: any = {},
  credOverrides?: Partial<EtsyCredentials>
): Promise<{ status: number; body: any; html?: string }> {
  const action = url.searchParams.get('action') || body?.action || 'connection';

  try {
    // 1. Check Connection & Store Overview
    if (action === 'connection') {
      const creds = resolveEtsyCredentials({
        clientId: body?.clientId || credOverrides?.clientId,
        clientSecret: body?.clientSecret || credOverrides?.clientSecret,
        scopes: body?.scopes || credOverrides?.scopes,
        shopId: body?.shopId || url.searchParams.get('shopId') || credOverrides?.shopId,
        shopName: body?.shopName || url.searchParams.get('shopName') || credOverrides?.shopName,
        accessToken: body?.accessToken || credOverrides?.accessToken,
      });

      const ping = await etsyFetch('/openapi-ping', { method: 'GET' }, creds);

      let shop: any = null;
      try {
        if (creds.shopId) {
          shop = await etsyFetch(`/shops/${creds.shopId}`, { method: 'GET' }, creds);
        } else if (creds.shopName) {
          const searchRes = await etsyFetch(
            `/shops?shop_name=${encodeURIComponent(creds.shopName)}`,
            { method: 'GET' },
            creds
          );
          shop = searchRes?.results?.[0] || null;
        }
      } catch (shopErr: any) {
        console.warn('[Etsy] Could not fetch shop during connection check:', shopErr?.message);
      }

      return {
        status: 200,
        body: {
          connected: true,
          applicationId: ping?.application_id,
          clientId: creds.clientId,
          hasClientSecret: Boolean(creds.clientSecret),
          scopes: creds.scopes.split(/\s+/).filter(Boolean),
          scopesString: creds.scopes,
          shopId: shop?.shop_id ? String(shop.shop_id) : creds.shopId,
          shopName: shop?.shop_name || creds.shopName,
          shop,
          oauthConnected: Boolean(creds.accessToken),
          oauthUserId: creds.userId || (shop?.user_id ? String(shop.user_id) : undefined),
        },
      };
    }

    // 2. Save & Verify Credentials
    if (action === 'save-credentials' && method === 'POST') {
      const nextCreds = resolveEtsyCredentials({
        clientId: body?.clientId,
        clientSecret: body?.clientSecret,
        scopes: body?.scopes,
        shopId: body?.shopId,
        shopName: body?.shopName,
        accessToken: body?.accessToken,
        refreshToken: body?.refreshToken,
      });

      const ping = await etsyFetch('/openapi-ping', { method: 'GET' }, nextCreds);
      let shop: any = null;
      if (nextCreds.shopId) {
        try {
          shop = await etsyFetch(`/shops/${nextCreds.shopId}`, { method: 'GET' }, nextCreds);
        } catch {
          // fallback to shopName search
        }
      }
      if (!shop && nextCreds.shopName) {
        try {
          const byName = await etsyFetch(
            `/shops?shop_name=${encodeURIComponent(nextCreds.shopName)}`,
            { method: 'GET' },
            nextCreds
          );
          shop = byName?.results?.[0] || null;
        } catch {
          // ignore
        }
      }

      const resolvedShopId = shop?.shop_id ? String(shop.shop_id) : nextCreds.shopId;
      const resolvedShopName = shop?.shop_name || nextCreds.shopName;

      saveSessionToDisk({
        clientId: nextCreds.clientId,
        clientSecret: nextCreds.clientSecret,
        scopes: nextCreds.scopes,
        shopId: resolvedShopId,
        shopName: resolvedShopName,
        ...(body?.accessToken !== undefined ? { accessToken: cleanCredentialValue(body.accessToken) } : {}),
        ...(body?.refreshToken !== undefined ? { refreshToken: cleanCredentialValue(body.refreshToken) } : {}),
      });

      return {
        status: 200,
        body: {
          connected: true,
          applicationId: ping?.application_id,
          clientId: nextCreds.clientId,
          scopes: nextCreds.scopes.split(/\s+/).filter(Boolean),
          shopId: resolvedShopId,
          shopName: resolvedShopName,
          shop,
          oauthConnected: Boolean(nextCreds.accessToken),
        },
      };
    }

    // 3. Diagnose Health Check
    if (action === 'diagnose') {
      const creds = resolveEtsyCredentials({
        clientId: body?.clientId || credOverrides?.clientId,
        clientSecret: body?.clientSecret || credOverrides?.clientSecret,
        scopes: body?.scopes || credOverrides?.scopes,
        shopId: body?.shopId || credOverrides?.shopId,
        shopName: body?.shopName || credOverrides?.shopName,
        accessToken: body?.accessToken || credOverrides?.accessToken,
      });

      const steps: any[] = [];
      let allOk = true;

      // Step 1: Credentials Check
      const hasIdAndSecret = Boolean(creds.clientId && creds.clientSecret);
      steps.push({
        step: 'credentials_check',
        ok: hasIdAndSecret,
        message: hasIdAndSecret
          ? `Etsy Keystring (${creds.clientId.slice(0, 6)}...) and Shared Secret configured with scopes: ${creds.scopes}`
          : 'Missing ETSY_CLIENT_ID or ETSY_CLIENT_SECRET.',
      });
      if (!hasIdAndSecret) allOk = false;

      // Step 2: OpenAPI Ping
      let appId: number | null = null;
      try {
        const ping = await etsyFetch('/openapi-ping', { method: 'GET' }, creds);
        appId = ping?.application_id || null;
        steps.push({
          step: 'openapi_ping',
          ok: true,
          applicationId: appId,
          message: `Etsy Open API v3 Ping succeeded (Application ID: ${appId}).`,
        });
      } catch (err: any) {
        allOk = false;
        steps.push({
          step: 'openapi_ping',
          ok: false,
          message: `Etsy Open API v3 Ping failed: ${err.message}`,
        });
      }

      // Step 3: Shop Lookup
      let shopData: any = null;
      try {
        shopData = await etsyFetch(`/shops/${creds.shopId}`, { method: 'GET' }, creds);
        steps.push({
          step: 'shop_connection',
          ok: true,
          shopId: shopData.shop_id,
          shopName: shopData.shop_name,
          activeListings: shopData.listing_active_count,
          message: `Connected to Etsy Shop "${shopData.shop_name}" (ID: ${shopData.shop_id}) — ${shopData.listing_active_count} active listings.`,
        });
      } catch (err: any) {
        allOk = false;
        steps.push({
          step: 'shop_connection',
          ok: false,
          message: `Could not load Etsy Shop ${creds.shopId}: ${err.message}`,
        });
      }

      // Step 4: Active Listings Read Verification (listings_r)
      try {
        const listingsRes = await etsyFetch(
          `/shops/${creds.shopId}/listings/active?limit=5`,
          { method: 'GET' },
          creds
        );
        steps.push({
          step: 'listings_read',
          ok: true,
          totalCount: listingsRes.count,
          message: `Verified listings_r access: retrieved ${listingsRes.results?.length || 0} of ${listingsRes.count || 0} active listings.`,
        });
      } catch (err: any) {
        allOk = false;
        steps.push({
          step: 'listings_read',
          ok: false,
          message: `Failed to read active listings: ${err.message}`,
        });
      }

      return {
        status: 200,
        body: {
          ok: allOk,
          message: allOk
            ? `Etsy API v3 verified! Connected to ${shopData?.shop_name || creds.shopName} (App ID: ${appId}, ${shopData?.listing_active_count ?? 0} active listings).`
            : 'One or more diagnostic checks reported an issue.',
          report: {
            applicationId: appId,
            clientId: creds.clientId,
            scopes: creds.scopes.split(/\s+/).filter(Boolean),
            shop: shopData,
            oauthConnected: Boolean(creds.accessToken),
            steps,
          },
        },
      };
    }

    // 4. Start OAuth 2.0 PKCE Flow
    if (action === 'oauth-start') {
      const creds = resolveEtsyCredentials(credOverrides);
      const origin = `${url.protocol}//${url.host}`;
      const redirectUri =
        url.searchParams.get('redirectUri') ||
        body?.redirectUri ||
        process.env.ETSY_REDIRECT_URI ||
        `${origin}/api/etsy?action=oauth-callback`;

      const { codeVerifier, codeChallenge, state } = generatePkceChallenge(redirectUri);

      const authParams = new URLSearchParams({
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: creds.scopes,
        client_id: creds.clientId,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `${ETSY_OAUTH_CONNECT_URL}?${authParams.toString()}`;

      return {
        status: 200,
        body: {
          authUrl,
          state,
          codeVerifier,
          codeChallenge,
          redirectUri,
          scopes: creds.scopes,
        },
      };
    }

    // 5. OAuth 2.0 Callback (GET popup redirect or POST manual code exchange)
    if (action === 'oauth-callback' || action === 'oauth-exchange') {
      const creds = resolveEtsyCredentials(credOverrides);
      const code = url.searchParams.get('code') || body?.code;
      const state = url.searchParams.get('state') || body?.state || '';
      const oauthError = url.searchParams.get('error') || body?.error;
      const oauthErrorDesc = url.searchParams.get('error_description') || body?.error_description;

      if (oauthError) {
        const errMsg = `${oauthError}: ${oauthErrorDesc || 'Authorization declined or failed.'}`;
        if (method === 'GET') {
          return {
            status: 400,
            body: { error: errMsg },
            html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#090d16;color:#f8fafc;padding:32px;text-align:center;">
              <h2 style="color:#fb7185;">Etsy OAuth Authorization Error</h2>
              <p>${errMsg}</p>
              <p style="font-size:12px;color:#94a3b8;">Ensure your Callback URL is registered in your Etsy Developer App settings.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'ETSY_OAUTH_RESULT', ok: false, error: ${JSON.stringify(errMsg)} }, '*');
                }
              </script>
            </body></html>`,
          };
        }
        return { status: 400, body: { error: errMsg } };
      }

      if (!code) {
        return { status: 400, body: { error: 'Missing authorization code from Etsy OAuth.' } };
      }

      const decodedState = decodePkceState(state);
      const codeVerifier = body?.codeVerifier || decodedState.codeVerifier;
      const origin = `${url.protocol}//${url.host}`;
      const redirectUri =
        body?.redirectUri ||
        decodedState.redirectUri ||
        process.env.ETSY_REDIRECT_URI ||
        `${origin}/api/etsy?action=oauth-callback`;

      if (!codeVerifier) {
        return {
          status: 400,
          body: { error: 'Missing PKCE code_verifier for Etsy OAuth token exchange.' },
        };
      }

      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: creds.clientId,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
      });

      const tokenRes = await fetch(ETSY_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': buildXApiKeyHeader(creds),
        },
        body: tokenParams.toString(),
      });

      const tokenData: any = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenData.access_token) {
        const msg =
          tokenData.error_description ||
          tokenData.error ||
          `Failed to exchange Etsy authorization code (HTTP ${tokenRes.status}).`;
        if (method === 'GET') {
          return {
            status: tokenRes.status,
            body: { error: msg },
            html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#090d16;color:#f8fafc;padding:32px;text-align:center;">
              <h2 style="color:#fb7185;">Etsy Token Exchange Failed</h2>
              <p>${msg}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'ETSY_OAUTH_RESULT', ok: false, error: ${JSON.stringify(msg)} }, '*');
                }
              </script>
            </body></html>`,
          };
        }
        return { status: tokenRes.status, body: { error: msg, details: tokenData } };
      }

      const expiresAt = Date.now() + Number(tokenData.expires_in || 3600) * 1000;
      const userId = String(tokenData.access_token).split('.')[0] || undefined;

      saveSessionToDisk({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        userId,
      });

      if (method === 'GET') {
        return {
          status: 200,
          body: { ok: true, accessToken: tokenData.access_token, userId },
          html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#090d16;color:#f8fafc;padding:32px;text-align:center;">
            <h2 style="color:#34d399;">✓ Connected to Etsy Store!</h2>
            <p>OAuth 2.0 authorization complete. This window will close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ETSY_OAUTH_RESULT',
                  ok: true,
                  accessToken: ${JSON.stringify(tokenData.access_token)},
                  refreshToken: ${JSON.stringify(tokenData.refresh_token || '')},
                  userId: ${JSON.stringify(userId || '')}
                }, '*');
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </body></html>`,
        };
      }

      return {
        status: 200,
        body: {
          ok: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          userId,
        },
      };
    }

    // 6. Fetch Shop Info & Sections
    if (action === 'shop') {
      const creds = resolveEtsyCredentials(credOverrides);
      const shopId = url.searchParams.get('shopId') || body?.shopId || creds.shopId;
      const [shop, sectionsRes] = await Promise.all([
        etsyFetch(`/shops/${shopId}`, { method: 'GET' }, creds),
        etsyFetch(`/shops/${shopId}/sections`, { method: 'GET' }, creds).catch(() => ({ results: [] })),
      ]);

      return {
        status: 200,
        body: {
          shop,
          sections: sectionsRes?.results || [],
        },
      };
    }

    // 7. Fetch Active / All Shop Listings with Images
    if (action === 'listings') {
      const creds = resolveEtsyCredentials(credOverrides);
      const shopId = url.searchParams.get('shopId') || body?.shopId || creds.shopId;
      const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
      const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);
      const stateFilter = url.searchParams.get('state') || 'active';

      let listingsData: any;
      if (creds.accessToken && stateFilter !== 'active') {
        listingsData = await etsyFetch(
          `/shops/${shopId}/listings?state=${encodeURIComponent(stateFilter)}&limit=${limit}&offset=${offset}`,
          { method: 'GET' },
          creds,
          true
        );
      } else {
        listingsData = await etsyFetch(
          `/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`,
          { method: 'GET' },
          creds
        );
      }

      const rawListings: any[] = Array.isArray(listingsData?.results) ? listingsData.results : [];

      // Fetch primary & gallery images for each listing concurrently (batches of 6)
      const enrichedListings = await Promise.all(
        rawListings.map(async (item) => {
          try {
            const imgRes = await etsyFetch(
              `/listings/${item.listing_id}/images`,
              { method: 'GET' },
              creds
            );
            const images = Array.isArray(imgRes?.results) ? imgRes.results : [];
            return {
              ...item,
              priceFormatted: item.price
                ? (Number(item.price.amount) / Number(item.price.divisor || 100)).toFixed(2)
                : '22.20',
              primaryImage: images[0]?.url_570xN || images[0]?.url_fullxfull || null,
              images: images.map((img: any) => ({
                listing_image_id: img.listing_image_id,
                rank: img.rank,
                url_75x75: img.url_75x75,
                url_170x135: img.url_170x135,
                url_570xN: img.url_570xN,
                url_fullxfull: img.url_fullxfull,
              })),
            };
          } catch {
            return {
              ...item,
              priceFormatted: item.price
                ? (Number(item.price.amount) / Number(item.price.divisor || 100)).toFixed(2)
                : '22.20',
              primaryImage: null,
              images: [],
            };
          }
        })
      );

      return {
        status: 200,
        body: {
          count: listingsData?.count || enrichedListings.length,
          shopId,
          listings: enrichedListings,
        },
      };
    }

    // 8. Fetch Single Listing Details + Images
    if (action === 'listing-details') {
      const creds = resolveEtsyCredentials(credOverrides);
      const listingId = url.searchParams.get('listingId') || body?.listingId;
      if (!listingId) {
        return { status: 400, body: { error: 'Missing listingId parameter.' } };
      }

      const [listing, imagesRes] = await Promise.all([
        etsyFetch(`/listings/${listingId}`, { method: 'GET' }, creds),
        etsyFetch(`/listings/${listingId}/images`, { method: 'GET' }, creds).catch(() => ({
          results: [],
        })),
      ]);

      return {
        status: 200,
        body: {
          listing: {
            ...listing,
            images: imagesRes?.results || [],
          },
        },
      };
    }

    // 9. Create Draft / Active Listing on Etsy (listings_w)
    if (action === 'create-listing' && method === 'POST') {
      const creds = resolveEtsyCredentials(credOverrides);
      const shopId = body?.shopId || creds.shopId;

      const cleanTags = Array.isArray(body?.tags)
        ? body.tags
            .map((t: string) =>
              String(t || '')
                .trim()
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .slice(0, 20)
                .trim()
            )
            .filter(Boolean)
            .slice(0, 13)
        : [];

      const payload: Record<string, any> = {
        quantity: Number(body?.quantity || 999),
        title: String(body?.title || 'Custom Tough Phone Case').slice(0, 140),
        description: String(body?.description || ''),
        price: Number(body?.price || 22.2),
        who_made: body?.who_made || 'someone_else',
        when_made: body?.when_made || 'made_to_order',
        taxonomy_id: Number(body?.taxonomy_id || 873), // 873 = Electronics & Accessories > Electronics Cases > Phone Cases
        tags: cleanTags,
        is_supply: false,
        type: 'physical',
      };

      if (body?.shipping_profile_id) {
        payload.shipping_profile_id = Number(body.shipping_profile_id);
      }
      if (body?.return_policy_id) {
        payload.return_policy_id = Number(body.return_policy_id);
      }
      if (body?.shop_section_id) {
        payload.shop_section_id = Number(body.shop_section_id);
      }

      const createdListing = await etsyFetch(
        `/shops/${shopId}/listings`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        creds,
        true
      );

      return {
        status: 201,
        body: {
          ok: true,
          listing: createdListing,
        },
      };
    }

    // 10. Update Existing Listing on Etsy (listings_w)
    if (action === 'update-listing' && method === 'POST') {
      const creds = resolveEtsyCredentials(credOverrides);
      const shopId = body?.shopId || creds.shopId;
      const listingId = body?.listingId;
      if (!listingId) {
        return { status: 400, body: { error: 'Missing listingId for Etsy update.' } };
      }

      const patchPayload: Record<string, any> = {};
      if (body?.title) patchPayload.title = String(body.title).slice(0, 140);
      if (body?.description) patchPayload.description = String(body.description);
      if (Array.isArray(body?.tags)) {
        patchPayload.tags = body.tags
          .map((t: string) =>
            String(t || '')
              .trim()
              .replace(/[^a-zA-Z0-9\s-]/g, '')
              .slice(0, 20)
              .trim()
          )
          .filter(Boolean)
          .slice(0, 13);
      }
      if (body?.state) patchPayload.state = body.state;

      const updated = await etsyFetch(
        `/shops/${shopId}/listings/${listingId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patchPayload),
        },
        creds,
        true
      );

      return {
        status: 200,
        body: {
          ok: true,
          listing: updated,
        },
      };
    }

    // 11. Fetch Shop Transactions (transactions_r)
    if (action === 'transactions') {
      const creds = resolveEtsyCredentials(credOverrides);
      const shopId = url.searchParams.get('shopId') || body?.shopId || creds.shopId;
      const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
      const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0);

      const txData = await etsyFetch(
        `/shops/${shopId}/transactions?limit=${limit}&offset=${offset}`,
        { method: 'GET' },
        creds,
        true
      );

      return {
        status: 200,
        body: {
          count: txData?.count || 0,
          transactions: txData?.results || [],
        },
      };
    }

    // 12. Disconnect / Clear OAuth Session
    if (action === 'disconnect' && method === 'POST') {
      saveSessionToDisk({
        accessToken: '',
        refreshToken: '',
        expiresAt: 0,
      });
      return {
        status: 200,
        body: { ok: true, message: 'Etsy OAuth session cleared.' },
      };
    }

    return {
      status: 400,
      body: { error: `Unsupported Etsy action: ${action}` },
    };
  } catch (err: any) {
    const status = err?.status || 500;
    return {
      status,
      body: {
        error: err?.message || 'Etsy API request failed.',
        requiresOAuth: Boolean(err?.requiresOAuth),
        details: err?.details || undefined,
      },
    };
  }
}
