const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const graphRoutes = require('./routes/graphRoutes');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IDMC CDI dependency graph service running' });
});

app.use('/api', graphRoutes);

app.get('/', (_req, res) => {
  res.redirect(302, '/api/health');
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
