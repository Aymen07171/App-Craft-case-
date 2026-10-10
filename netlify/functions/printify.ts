import { handlePrintifyRequest } from '../../src/server/printify';

export const handler = async (event: any) => {
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  let body: any;
  if (method !== 'GET' && event.body) {
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body must be valid JSON.' }),
      };
    }
  }

  const headers = event.headers || {};
  const authHeader =
    headers['x-printify-token'] ||
    headers['X-Printify-Token'] ||
    (headers['authorization'] || headers['Authorization'] || '').replace(/^Bearer\s+/i, '');

  const url = new URL(
    event.rawUrl || `https://${headers.host || 'localhost'}${event.path || '/api/printify'}`
  );

  if (event.rawQuery) {
    const rq = new URLSearchParams(event.rawQuery);
    rq.forEach((v, k) => {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    });
  }
  if (event.queryStringParameters && typeof event.queryStringParameters === 'object') {
    Object.entries(event.queryStringParameters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && !url.searchParams.has(k)) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const token =
    authHeader ||
    body?.token ||
    body?.apiToken ||
    url.searchParams.get('token') ||
    url.searchParams.get('apiToken') ||
    process.env.PRINTIFY_API_TOKEN;

  const result = await handlePrintifyRequest(method, url, body, token);
  return {
    statusCode: result.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  };
};

export default handler;
