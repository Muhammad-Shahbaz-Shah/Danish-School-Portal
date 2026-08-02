import server from '../server';
import serverless from 'serverless-http';

// Export a Serverless Function that Vercel will expose at /api/db/*
export default serverless(server);
