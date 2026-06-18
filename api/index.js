// Vercel Serverless Function entry point
// Vercel auto-detects any file in /api/ and deploys it as a serverless function
const app = require('../backend-bizcore/server.js');

module.exports = app;
