import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import authRoutes from './routes/auth.routes.js';
import pathRoutes from './routes/path.routes.js';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 5055);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use((req, _res, next) => {
  req.requestId = randomUUID();
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/paths', pathRoutes);
app.use('/api', notFoundMiddleware);

const startServer = async () => {
  if (isProduction) {
    const distPath = path.join(clientDir, 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  } else {
    const vite = await createViteServer({
      root: clientDir,
      configFile: path.join(clientDir, 'vite.config.js'),
      server: {
        middlewareMode: true,
        host: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use(errorMiddleware);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Pathway server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Could not start server:', error);
  process.exit(1);
});