type JsonRecord = Record<string, any>;

const apiRoot = 'https://api.printify.com/v1';
const catalogCache = new Map<string, { expiresAt: number; request: Promise<any> }>();

function requiredToken() {
  const token = process.env.PRINTIFY_API_TOKEN?.trim();
  if (!token) throw new Error('Printify is not configured. Set PRINTIFY_API_TOKEN on the server.');
  return token;
}

async function printifyFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${requiredToken()}`, 'Content-Type': 'application/json', 'User-Agent': 'CraftCase/1.0', ...init.headers },
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const detail = data?.message || data?.error || data?.errors?.reason || `Printify returned HTTP ${response.status}.`;
    throw Object.assign(new Error(detail), {
      status: response.status,
      details: data,
      retryAfterSeconds: Number(response.headers.get('retry-after')) || undefined,
    });
  }
  return data;
}

function cachedCatalog(path: string) {
  const now = Date.now();
  const cached = catalogCache.get(path);
  if (cached && cached.expiresAt > now) return cached.request;
  let entry: { expiresAt: number; request: Promise<any> };
  const request = printifyFetch(path).catch((error) => {
    if (error?.status === 429) {
      entry.expiresAt = Date.now() + Math.max(30, Number(error.retryAfterSeconds) || 60) * 1000;
    } else {
      catalogCache.delete(path);
    }
    throw error;
  });
  entry = { expiresAt: now + 2 * 60 * 1000, request };
  catalogCache.set(path, entry);
  return request;
}

function safeSegment(value: string) {
  if (!/^\d+$/.test(String(value))) throw new Error('Invalid Printify catalog identifier.');
  return String(value);
}

function sanitizeName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100) || 'craft-case-image';
}

async function uploadImage(fileName: string, image: string) {
  if (!image) throw new Error(`Missing image data for ${fileName}.`);
  const payload: JsonRecord = { file_name: sanitizeName(fileName) };
  if (image.startsWith('data:')) {
    const match = image.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error(`Image ${fileName} has an invalid data URL.`);
    payload.contents = match[1];
  } else if (/^https:\/\//i.test(image)) {
    payload.url = image;
  } else {
    throw new Error(`Image ${fileName} must be a data URL or an HTTPS URL.`);
  }
  return printifyFetch('/uploads/images.json', { method: 'POST', body: JSON.stringify(payload) });
}

export async function handlePrintifyRequest(method: string, url: URL, body?: JsonRecord) {
  try {
    if (method === 'GET') {
      const resource = url.searchParams.get('resource') || 'connection';
      if (resource === 'connection') {
        if (!process.env.PRINTIFY_API_TOKEN?.trim()) return { status: 200, body: { connected: false, configured: false, shops: [] } };
        const shops = await printifyFetch('/shops.json');
        return { status: 200, body: { connected: true, configured: true, shops } };
      }
      if (resource === 'blueprints') return { status: 200, body: await cachedCatalog('/catalog/blueprints.json') };
      if (resource === 'providers') {
        const blueprintId = safeSegment(url.searchParams.get('blueprintId') || '');
        const path = `/catalog/blueprints/${blueprintId}/print_providers.json`;
        return { status: 200, body: await cachedCatalog(path) };
      }
      if (resource === 'variants') {
        const blueprintId = safeSegment(url.searchParams.get('blueprintId') || '');
        const providerId = safeSegment(url.searchParams.get('providerId') || '');
        const path = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json?show-out-of-stock=1`;
        return { status: 200, body: await cachedCatalog(path) };
      }
      return { status: 400, body: { error: 'Unknown Printify resource.' } };
    }

    if (method === 'POST' && body?.action === 'upload') {
      const { fileName, image } = body as any;
      const uploaded = await uploadImage(String(fileName || 'craft-case-image.png'), String(image || ''));
      if (!uploaded?.id) throw new Error('Printify did not return an ID for the image upload.');
      return { status: 200, body: { imageId: uploaded.id, image: uploaded } };
    }

    if (method === 'POST' && body?.action === 'publish') {
      const { shopId, product } = body as any;
      if (!shopId || !product) return { status: 400, body: { error: 'Shop and product information are required.' } };
      if (!product.listing?.title || !product.listing?.description) return { status: 400, body: { error: 'Complete the listing title and description before creating the Printify product.' } };
      const blueprintId = safeSegment(product.printify?.blueprintId || '');
      const providerId = safeSegment(product.printify?.printProviderId || '');
      const variantIds = (product.printify?.variantIds || []).map((id: unknown) => Number(safeSegment(String(id))));
      if (!variantIds.length) return { status: 400, body: { error: 'Select at least one Printify variant.' } };

      const artworkImageId = String(body.artworkImageId || '');
      const uploadedImageIds = Array.isArray(body.uploadedImageIds) ? body.uploadedImageIds.map(String) : [];
      if (!artworkImageId) return { status: 400, body: { error: 'Upload the design artwork before creating the Printify product.' } };

      const created = await printifyFetch(`/shops/${encodeURIComponent(String(shopId))}/products.json`, {
        method: 'POST',
        body: JSON.stringify({
          title: product.listing.title,
          description: product.listing.description,
          blueprint_id: Number(blueprintId),
          print_provider_id: Number(providerId),
          tags: (product.listing.tags || []).map((tag: string) => tag.trim()).filter(Boolean),
          variants: variantIds.map((id: number) => ({ id, price: Math.round(Number(product.product?.price || 24.99) * 100), is_enabled: true })),
          print_areas: [{ variant_ids: variantIds, placeholders: [{ position: 'front', images: [{ id: artworkImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }],
        }),
      });
      return { status: 200, body: { product: created, uploadedImageIds, shopId: String(shopId) } };
    }
    return { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error: any) {
    return {
      status: error?.status || 500,
      body: { error: error?.message || 'Printify request failed.', details: error?.details, retryAfterSeconds: error?.retryAfterSeconds },
    };
  }
}
