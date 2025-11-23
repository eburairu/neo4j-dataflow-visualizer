const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 4000,
  neo4jUri: process.env.NEO4J_URI || '',
  neo4jUser: process.env.NEO4J_USER || '',
  neo4jPassword: process.env.NEO4J_PASSWORD || '',
  sampleSnapshot: process.env.SNAPSHOT_AT || '2024-02-01T00:00:00Z',
};

module.exports = config;
