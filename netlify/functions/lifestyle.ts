import {
  generateLifestyleMockup,
  LifestyleMockupError,
  LifestyleMockupRequest,
} from '../../src/server/lifestyleMockup';

export const handler = async (event: any) => {
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  let input: LifestyleMockupRequest;
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf-8')
      : event.body || '{}';
    input = JSON.parse(rawBody) as LifestyleMockupRequest;
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body must be valid JSON.' }),
    };
  }

  try {
    const imageUrl = await generateLifestyleMockup(input);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (error) {
    if (error instanceof LifestyleMockupError) {
      return {
        statusCode: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate lifestyle scene.' }),
    };
  }
};

export default handler;