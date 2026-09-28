import { handlePrintifyRequest } from '../../src/server/printify';

export default async (request: Request) => {
  let body;
  if (request.method !== 'GET') {
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  }
  const result = await handlePrintifyRequest(request.method, new URL(request.url), body);
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/printify', method: ['GET', 'POST'] };
