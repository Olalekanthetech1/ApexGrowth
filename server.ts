import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { dbService } from './server/services/dbService.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const app = express();

  // Basic security and parsing middleware with rawBody capture for webhook HMAC verification
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logger in dev
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
      }
      next();
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ApexGrowth Digital Full Production Server',
      timestamp: new Date().toISOString(),
    });
  });

  // Dynamic SEO sitemap.xml endpoint
  app.get('/sitemap.xml', async (req, res) => {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const baseUrl = process.env.APP_URL || process.env.PUBLIC_URL || `${protocol}://${host}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/services</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/high-converting-sales-funnels</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/paystack-stripe-checkout-integration</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/direct-response-video-ad-scripts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  });

  // Dynamic robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const baseUrl = process.env.APP_URL || process.env.PUBLIC_URL || `${protocol}://${host}`;
    const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`;
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(txt);
  });

  // Mount primary API router
  app.use('/api', apiRouter);

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Automatic schema sync on startup
  try {
    console.log('🔄 Syncing database schema with Drizzle-kit...');
    execSync('npx drizzle-kit push --config=src/db/drizzle.config.ts', { stdio: 'inherit' });
    console.log('✅ Schema synchronization completed successfully.');
  } catch (err: any) {
    console.warn('⚠️ Warning: Automatic schema sync failed, proceeding anyway:', err.message);
  }

  // Automatic admin account bootstrap
  try {
    await dbService.bootstrapInitialAdmin();
    await dbService.bootstrapPaymentMethods();
  } catch (err: any) {
    console.error('❌ Failed to run initial administrator bootstrap:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ApexGrowth Digital Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
