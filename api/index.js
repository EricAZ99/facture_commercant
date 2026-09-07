/**
 * Vercel Serverless Function — wraps the mock-server Express app.
 * Vercel injecte (req, res) directement dans le handler Express.
 */
const app = require('../mock-server/server.js')

module.exports = app
