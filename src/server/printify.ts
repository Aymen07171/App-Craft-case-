type JsonRecord = Record<string, any>;

const apiRoot = 'https://api.printify.com/v1';
const apiV2Root = 'https://api.printify.com/v2';
const catalogCache = new Map<string, { expiresAt: number; request: Promise<any> }>();

function requiredToken(customToken?: string) {
  const token = customToken?.trim() || process.env.PRINTIFY_API_TOKEN?.trim();
  if (!token || token.startsWith('your_')) {
    return null;
  }
  return token;
}

async function printifyFetch(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CraftCase/1.0',
      ...init.headers,
    },
  });
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const detail =
      data?.message || data?.error || data?.errors?.reason || `Printify returned HTTP ${response.status}.`;
    throw Object.assign(new Error(detail), {
      status: response.status,
      details: data,
      retryAfterSeconds: Number(response.headers.get('retry-after')) || undefined,
    });
  }
  return data;
}

async function printifyV2Fetch(path: string, token: string) {
  const response = await fetch(`${apiV2Root}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CraftCase/1.0',
    },
  });
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const detail =
      data?.message || data?.error || data?.errors?.reason || `Printify returned HTTP ${response.status}.`;
    throw Object.assign(new Error(detail), { status: response.status, details: data });
  }
  return data;
}

function cachedCatalog(path: string, token: string) {
  const now = Date.now();
  const cached = catalogCache.get(path);
  if (cached && cached.expiresAt > now) return cached.request;
  let entry: { expiresAt: number; request: Promise<any> };
  const request = printifyFetch(path, token).catch((error) => {
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
  if (!/^[a-zA-Z0-9_-]+$/.test(String(value))) throw new Error('Invalid Printify catalog identifier.');
  return String(value);
}

function sanitizeName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100) || 'craft-case-image';
}

function catalogRows(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.variants)) return value.variants;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

async function uploadImage(fileName: string, image: string, token: string) {
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
  return printifyFetch('/uploads/images.json', token, { method: 'POST', body: JSON.stringify(payload) });
}

export async function handlePrintifyRequest(
  method: string,
  url: URL,
  body?: JsonRecord,
  customToken?: string
) {
  const token = requiredToken(customToken);

  try {
    if (method === 'GET') {
      const resource = url.searchParams.get('resource') || 'connection';

      if (resource === 'connection') {
        if (!token) {
          return {
            status: 200,
            body: {
              connected: true,
              configured: false,
              demoMode: true,
              shops: [{ id: 'demo_shop_01', title: 'Demo Store (Local Preview)', sales_channel: 'Etsy' }],
            },
          };
        }
        const shops = await printifyFetch('/shops.json', token);
        return { status: 200, body: { connected: true, configured: true, shops } };
      }

      if (resource === 'blueprints') {
        if (!token) {
          return {
            status: 200,
            body: [
              { id: 68, title: 'Tough Cases' },
              { id: 269, title: 'Slim Cases' },
              { id: 528, title: 'Clear Cases' },
            ],
          };
        }
        return { status: 200, body: await cachedCatalog('/catalog/blueprints.json', token) };
      }

      if (resource === 'providers') {
        if (!token) {
          return { status: 200, body: [{ id: 1, title: 'Spoke Custom Products' }] };
        }
        const blueprintId = safeSegment(url.searchParams.get('blueprintId') || '68');
        const path = `/catalog/blueprints/${blueprintId}/print_providers.json`;
        return { status: 200, body: await cachedCatalog(path, token) };
      }

      if (resource === 'variants') {
        if (!token) {
          return {
            status: 200,
            body: [
              { id: 104273, title: 'iPhone 15 Pro Max', cost: 1050, is_available: true },
              { id: 104271, title: 'iPhone 15 Pro', cost: 1050, is_available: true },
              { id: 104269, title: 'iPhone 15', cost: 1050, is_available: true },
              { id: 104310, title: 'Samsung Galaxy S24 Ultra', cost: 1050, is_available: true },
            ],
          };
        }
        const blueprintId = safeSegment(url.searchParams.get('blueprintId') || '68');
        const providerId = safeSegment(url.searchParams.get('providerId') || '1');
        const path = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json?show-out-of-stock=1`;
        return { status: 200, body: await cachedCatalog(path, token) };
      }

      if (resource === 'shipping') {
        if (!token) {
          return {
            status: 200,
            body: {
              data: [
                {
                  attributes: {
                    variantId: '104273',
                    country: { code: 'US' },
                    shippingCost: { firstItem: { amount: 450, currency: 'USD' } },
                  },
                },
              ],
            },
          };
        }
        const blueprintId = safeSegment(url.searchParams.get('blueprintId') || '68');
        const providerId = safeSegment(url.searchParams.get('providerId') || '1');
        const method = url.searchParams.get('method') || 'standard';
        const path = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping/${method}.json`;
        return { status: 200, body: await printifyV2Fetch(path, token) };
      }

      if (resource === 'product') {
        const shopId = safeSegment(url.searchParams.get('shopId') || 'demo_shop_01');
        const productId = url.searchParams.get('productId') || '';
        if (!token) {
          return {
            status: 200,
            body: {
              id: productId || `pf_draft_${Date.now()}`,
              title: 'Custom Tough Phone Case',
              is_locked: false,
              external: { id: `etsy_${Date.now()}`, handle: `https://printify.com/app/products/${productId}` },
            },
          };
        }
        return {
          status: 200,
          body: await printifyFetch(`/shops/${shopId}/products/${encodeURIComponent(productId)}.json`, token),
        };
      }

      return { status: 400, body: { error: 'Unknown Printify resource.' } };
    }

    if (method === 'POST' && body?.action === 'upload') {
      const { fileName, image } = body as any;

      if (!token) {
        return {
          status: 200,
          body: {
            imageId: `img_demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            image: { id: `img_demo_${Date.now()}` },
            demoMode: true,
          },
        };
      }

      const uploaded = await uploadImage(String(fileName || 'craft-case-image.png'), String(image || ''), token);
      if (!uploaded?.id) throw new Error('Printify did not return an ID for the image upload.');
      return { status: 200, body: { imageId: uploaded.id, image: uploaded } };
    }

    if (method === 'POST' && body?.action === 'publish-product') {
      const shopId = safeSegment(String(body.shopId || 'demo_shop_01'));
      const productId = String(body.productId || `pf_draft_${Date.now()}`);
      const price = Number(body.price);

      if (!token) {
        return {
          status: 200,
          body: {
            result: { id: productId, status: 'published' },
            artworkImageId: body.artworkImageId || 'img_demo',
            demoMode: true,
          },
        };
      }

      const artworkImageId = String(body.artworkImageId || '');
      const existing = await printifyFetch(`/shops/${shopId}/products/${encodeURIComponent(productId)}.json`, token);
      const existingVariants = existing.variants || [];

      await printifyFetch(`/shops/${shopId}/products/${encodeURIComponent(productId)}.json`, token, {
        method: 'PUT',
        body: JSON.stringify({
          title: body.product?.listing?.title || existing.title,
          description: body.product?.listing?.description || existing.description,
          blueprint_id: existing.blueprint_id,
          print_provider_id: existing.print_provider_id,
          tags: (body.product?.listing?.tags || existing.tags || []).map((tag: string) => String(tag).trim()).filter(Boolean),
          variants: existingVariants.map((variant: any) => ({
            id: variant.id,
            price: Math.round(price * 100),
            is_enabled: variant.is_enabled !== false,
          })),
          print_areas: (existing.print_areas || []).map((area: any) => ({
            variant_ids: area.variant_ids,
            placeholders: (area.placeholders || []).map((placeholder: any) => ({
              position: placeholder.position,
              ...(placeholder.decoration_method ? { decoration_method: placeholder.decoration_method } : {}),
              images: [{ id: artworkImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
            })),
            ...(area.background ? { background: area.background } : {}),
          })),
        }),
      });

      const result = await printifyFetch(`/shops/${shopId}/products/${encodeURIComponent(productId)}/publish.json`, token, {
        method: 'POST',
        body: JSON.stringify({
          title: true,
          description: true,
          images: true,
          variants: true,
          tags: true,
          key_features: true,
          shipping_template: true,
        }),
      });

      return { status: 200, body: { result, artworkImageId } };
    }

    if (method === 'POST' && (body?.action === 'create' || body?.action === 'publish')) {
      const { shopId, product } = body as any;
      if (!shopId || !product) return { status: 400, body: { error: 'Shop and product information are required.' } };

      const blueprintId = safeSegment(product.printify?.blueprintId || '68');
      const providerId = safeSegment(product.printify?.printProviderId || '1');
      const variantIds = (product.printify?.variantIds || ['104273']).map((id: unknown) => Number(safeSegment(String(id))));
      const artworkImageId = String(body.artworkImageId || 'img_demo');
      const uploadedImageIds = Array.isArray(body.uploadedImageIds) ? body.uploadedImageIds.map(String) : [];

      if (!token) {
        const createdId = `pf_draft_${Math.floor(Math.random() * 899999 + 100000)}`;
        return {
          status: 200,
          body: {
            product: {
              id: createdId,
              title: product.listing?.title || 'Custom Phone Case',
              description: product.listing?.description || '',
              blueprint_id: Number(blueprintId),
              print_provider_id: Number(providerId),
              variants: variantIds.map((id: number) => ({ id, cost: 1050, is_enabled: true })),
            },
            uploadedImageIds,
            shopId: String(shopId || 'demo_shop_01'),
            demoMode: true,
            message: 'Product draft created in local Demo Mode. Enter a Printify API token to publish to your live Printify account.',
          },
        };
      }

      const catalogVariants = await cachedCatalog(
        `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json?show-out-of-stock=1`,
        token
      );
      const selectedVariants = catalogRows(catalogVariants).filter((item) => variantIds.includes(Number(item.id)));
      const printAreaGroups = new Map<string, number[]>();

      selectedVariants.forEach((variant) => {
        const placeholders = Array.isArray(variant.placeholders) ? variant.placeholders : [];
        const placeholder = placeholders.find((item: any) => item.position === 'front') || placeholders[0];
        const position = placeholder?.position || 'front';
        printAreaGroups.set(position, [...(printAreaGroups.get(position) || []), Number(variant.id)]);
      });

      const created = await printifyFetch(`/shops/${encodeURIComponent(String(shopId))}/products.json`, token, {
        method: 'POST',
        body: JSON.stringify({
          title: product.listing.title,
          description: product.listing.description,
          blueprint_id: Number(blueprintId),
          print_provider_id: Number(providerId),
          tags: (product.listing.tags || []).map((tag: string) => tag.trim()).filter(Boolean),
          variants: variantIds.map((id: number) => ({
            id,
            price: Math.round(Number(product.pricing?.sellingPrice ?? product.product?.price ?? 24.99) * 100),
            is_enabled: true,
          })),
          print_areas: [...printAreaGroups.entries()].map(([position, ids]) => ({
            variant_ids: ids,
            placeholders: [{ position, images: [{ id: artworkImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
          })),
        }),
      });

      return { status: 200, body: { product: created, uploadedImageIds, shopId: String(shopId) } };
    }

    return { status: 405, body: { error: 'Method not allowed.' } };
  } catch (error: any) {
    return {
      status: error?.status || 500,
      body: {
        error: error?.message || 'Printify request failed.',
        details: error?.details,
        retryAfterSeconds: error?.retryAfterSeconds,
      },
    };
  }
}
