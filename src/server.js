const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const graphRoutes = require('./routes/graphRoutes');
const config = require('./config');

const app = express();

const distPath = path.join(__dirname, '..', 'dist');
const publicPath = path.join(__dirname, '..', 'public');
const staticPath = fs.existsSync(distPath) ? distPath : publicPath;
const hasBuiltBundle = fs.existsSync(path.join(distPath, 'index.html'));

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(staticPath));
if (staticPath !== publicPath) {
  // Serve additional public assets (e.g., favicon) alongside the built bundle
  app.use(express.static(publicPath));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IDMC CDI dependency graph service running' });
});

app.use('/api', graphRoutes);

app.get('/', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (hasBuiltBundle && fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
    return;
  }

  res.status(503).send(`<!doctype html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Neo4j Dataflow Visualizer</title>
        <style>
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 32px 24px;
            background: #0b1220;
            color: #e2e8f0;
          }
          .container {
            max-width: 720px;
            margin: 0 auto;
            background: #0f172a;
            border: 1px solid rgba(148, 163, 184, 0.25);
            border-radius: 12px;
            padding: 24px;
          }
          h1 {
            margin-top: 0;
          }
          a {
            color: #38bdf8;
          }
          code {
            background: rgba(148, 163, 184, 0.15);
            padding: 4px 6px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p style="text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin: 0 0 8px;">Notice</p>
          <h1>Frontend bundle missing</h1>
          <p>Vite でコンパイルされたフロントエンドがまだありません。以下のいずれかを実行してください。</p>
          <ul>
            <li><code>npm run dev</code> を実行し、Vite 開発サーバー (<code>http://localhost:5173</code>) にアクセスする</li>
            <li><code>npm run build</code> でビルドしてから、このサーバーを再起動する</li>
          </ul>
          <p>ビルド済みの <code>dist/</code> ディレクトリが存在すると、自動的にそちらの静的アセットが配信されます。</p>
          <p><a href="https://vitejs.dev/guide/" target="_blank" rel="noreferrer">Vite ドキュメントを見る</a></p>
        </div>
      </body>
    </html>`);
});

app.use((req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: `No route matched ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected error', details: err.message });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
