import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { dbService } from './server/services/dbService.js';
import { backgroundScoutWorker } from './server/services/scout/backgroundWorker.js';
import { telegramPollingService } from './server/services/scout/telegramPollingService.js';

const PORT = 3000;

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

  // Health check endpoints for Cloud Run and container probes
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'ApexGrowth Digital Full Production Server',
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/api/health', healthHandler);
  app.get('/healthz', healthHandler);
  app.get('/health', healthHandler);

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

  // Serve static assets in public folder
  app.use(express.static(path.resolve('public')));

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

  // Start HTTP listener immediately so dev server is responsive right away
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ApexGrowth Digital Server active on http://0.0.0.0:${PORT}`);

    // Asynchronous database bootstrap and schema synchronization
    (async () => {
      try {
        if (process.env.DATABASE_URL || (process.env.SQL_HOST && process.env.SQL_DB_NAME)) {
          console.log('🔄 Checking database initialization...');
        }
        await dbService.bootstrapInitialAdmin();
        await dbService.bootstrapPaymentMethods();
        console.log('✅ Admin and payment initialization completed.');

        // Start 24/7 Autonomous Opportunity Scout worker
        backgroundScoutWorker.start();

        // Start Real-Time Telegram Polling Service for immediate two-way responsiveness
        telegramPollingService.start();
      } catch (err: any) {
        console.warn('⚠️ Non-fatal database bootstrap notice:', err?.message || err);
      }
    })();
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
