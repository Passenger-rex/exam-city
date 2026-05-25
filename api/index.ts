import app from "../server";

// Increase max duration to 60 seconds (Hobby plan limit) for AI operations.
export const maxDuration = 60;

// Vercel serverless function entrypoint
export default app;
