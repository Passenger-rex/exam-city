import serverless from 'serverless-http';
import app from '../../server'; // Adjust based on your root server.ts

export const handler = serverless(app);
