#!/usr/bin/env node
const neo4j = require('neo4j-driver');
const config = require('../src/config');
const { sampleSnapshots } = require('../src/data/sampleGraph');

function assertConfig() {
  if (!config.neo4jUri || !config.neo4jUser || !config.neo4jPassword) {
    throw new Error('NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD must be set to seed the database.');
  }
}

function sanitizeRelType(type) {
  return (type || '')
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toUpperCase();
}

function extractNodeProps(node, snapshot) {
  const { label, ...props } = node;
  return { ...props, snapshot_at: snapshot };
}

function extractRelProps(edge, snapshot) {
  const props = edge.properties || {};
  return { ...props, snapshot_at: snapshot };
}

async function seedSnapshot(session, snapshot, snapshotData) {
  console.log(`\nSeeding snapshot ${snapshot}...`);

  for (const node of snapshotData.nodes) {
    const props = extractNodeProps(node, snapshot);
    const label = node.label || 'Entity';
    const nodeQuery = `
      MERGE (n:${label} {id: $id, snapshot_at: $snapshot})
      SET n += $props
    `;
    await session.executeWrite((tx) => tx.run(nodeQuery, { id: node.id, snapshot, props }));
  }

  for (const edge of snapshotData.edges) {
    const relType = sanitizeRelType(edge.type);
    const props = extractRelProps(edge, snapshot);
    const edgeQuery = `
      MATCH (from {id: $from, snapshot_at: $snapshot})
      MATCH (to {id: $to, snapshot_at: $snapshot})
      MERGE (from)-[r:${relType} {id: $id, snapshot_at: $snapshot}]->(to)
      SET r += $props
    `;
    await session.executeWrite((tx) =>
      tx.run(edgeQuery, { id: edge.id, from: edge.from, to: edge.to, snapshot, props })
    );
  }

  console.log(`Snapshot ${snapshot} seeded: ${snapshotData.nodes.length} nodes, ${snapshotData.edges.length} relationships.`);
}

async function main() {
  assertConfig();
  const driver = neo4j.driver(
    config.neo4jUri,
    neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
    { disableLosslessIntegers: true }
  );

  const session = driver.session();
  try {
    for (const [snapshot, snapshotData] of Object.entries(sampleSnapshots)) {
      await seedSnapshot(session, snapshot, snapshotData);
    }
    console.log('\nSeeding completed. You can now query Neo4j from the Web UI.');
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
});
