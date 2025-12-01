const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const graphRoutes = require('./routes/graphRoutes');
const config = require('./config');

const app = express();
const clientDir = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(clientDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IDMC CDI dependency graph service running' });
});

app.use('/api', graphRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 'NOT_FOUND', message: `No route matched ${req.path}` });
  }

  if (req.method === 'GET') {
    return res.sendFile(path.join(clientDir, 'index.html'));
  }

  return next();
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 'NOT_FOUND', message: `No route matched ${req.path}` });
  }

  return res.status(404).send('Not found');
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected error', details: err.message });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
