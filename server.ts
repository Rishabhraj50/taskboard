import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDatabase } from './server/db/connection.ts';
import authRoutes from './server/routes/authRoutes.ts';
import boardRoutes from './server/routes/boardRoutes.ts';
import columnRoutes from './server/routes/columnRoutes.ts';
import taskRoutes from './server/routes/taskRoutes.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize Database connection (real Mongo if MONGODB_URI set, else in-memory Mongo engine)
  await connectDatabase();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Documentation endpoint
  const openApiPath = path.resolve(__dirname, 'server/docs/openapi.json');
  app.get('/api/docs', (_req, res) => {
    try {
      if (fs.existsSync(openApiPath)) {
        const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
        res.json(spec);
      } else {
        res.status(404).json({ error: 'OpenAPI spec not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to read API spec' });
    }
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/columns', columnRoutes);
  app.use('/api/tasks', taskRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Central Error Handler for API routes
  app.use('/api', errorHandler);

  // Frontend integration: Vite middleware in dev, static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TaskFlow Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TaskFlow Server] Failed to start:', err);
  process.exit(1);
});
