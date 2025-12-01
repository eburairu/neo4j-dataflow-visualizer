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

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(staticPath));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IDMC CDI dependency graph service running' });
});

app.use('/api', graphRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
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
