const neo4j = require('neo4j-driver');
const config = require('../config');

let driver;

function createDriver() {
  if (!config.neo4jUri || !config.neo4jUser || !config.neo4jPassword) {
    return null;
  }

  if (!driver) {
    driver = neo4j.driver(
      config.neo4jUri,
      neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
      { disableLosslessIntegers: true }
    );
  }
  return driver;
}

function getSession() {
  const drv = createDriver();
  return drv ? drv.session() : null;
}

module.exports = { createDriver, getSession };
