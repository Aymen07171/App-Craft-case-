import express from 'express';
import serverless from 'serverless-http';
import designStudioApi from '../../src/server/designStudioApi';

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use('/design-api', designStudioApi);
app.use('/.netlify/functions/design-api', designStudioApi);
app.use('/api', designStudioApi);

export const handler = serverless(app);
export default handler;