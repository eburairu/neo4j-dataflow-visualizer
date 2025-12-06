import { describe, expect, it, vi } from 'vitest';
import { buildNeoVisConfig, normalizeAuraUri } from '../src/config/neo4j.js';

describe('normalizeAuraUri', () => {
  it('removes explicit TLS scheme and keeps driver config defaults', () => {
    const logger = vi.fn();
    const { serverUrl, driverConfig } = normalizeAuraUri('neo4j+s://demo.databases.neo4j.io', logger);

    expect(serverUrl).toBe('neo4j://demo.databases.neo4j.io');
    expect(driverConfig).toEqual({
      encrypted: 'ENCRYPTION_ON',
      trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
    });
    expect(logger).toHaveBeenCalledWith('暗号化設定をURLからdriverConfigに移動しました。');
  });

  it('upgrades Aura host URLs to neo4j+s and preserves driver config defaults', () => {
    const logger = vi.fn();
    const { serverUrl, driverConfig } = normalizeAuraUri('bolt://workspace.databases.neo4j.io', logger);

    expect(serverUrl).toBe('neo4j+s://workspace.databases.neo4j.io');
    expect(driverConfig).toEqual({
      encrypted: 'ENCRYPTION_ON',
      trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
    });
    expect(logger).toHaveBeenCalledWith('AuraホストのURIをTLS付きのneo4j+sスキームに自動変換しました。');
  });

  it('adds TLS scheme to Aura host-only values', () => {
    const logger = vi.fn();
    const { serverUrl } = normalizeAuraUri('example.databases.neo4j.io', logger);

    expect(serverUrl).toBe('neo4j+s://example.databases.neo4j.io');
    expect(logger).toHaveBeenCalledWith('Auraホスト名にTLSスキームを追加しました (neo4j+s://)。');
  });

  it('returns non-Aura URIs unchanged when valid', () => {
    const { serverUrl } = normalizeAuraUri('bolt://localhost:7687');
    expect(serverUrl).toBe('bolt://localhost:7687');
  });

  it('throws for empty or non-string values', () => {
    expect(() => normalizeAuraUri('  ')).toThrow('Aura URI is required');
    expect(() => normalizeAuraUri(123)).toThrow('Aura URI must be a string');
  });

  it('throws for invalid URIs', () => {
    expect(() => normalizeAuraUri('not-a-uri')).toThrow('Invalid Aura URI format');
  });
});

describe('buildNeoVisConfig', () => {
  it('builds NeoVis configuration with expected defaults', () => {
    const config = buildNeoVisConfig({
      serverUrl: 'neo4j+s://workspace.databases.neo4j.io',
      user: 'neo4j',
      password: 'password',
    });

    expect(config.neo4j).toEqual({
      serverUrl: 'neo4j+s://workspace.databases.neo4j.io',
      serverUser: 'neo4j',
      serverPassword: 'password',
      driverConfig: {
        encrypted: 'ENCRYPTION_ON',
        trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
      },
    });
    expect(config.containerId).toBe('viz');
    expect(config.visConfig?.layout?.hierarchical?.direction).toBe('LR');
  });

  it('throws when required credentials are missing', () => {
    expect(() => buildNeoVisConfig({ serverUrl: '', user: 'neo4j', password: 'secret' })).toThrow();
    expect(() => buildNeoVisConfig({ serverUrl: 'neo4j://localhost', user: '', password: 'secret' })).toThrow();
    expect(() => buildNeoVisConfig({ serverUrl: 'neo4j://localhost', user: 'neo4j', password: '' })).toThrow();
  });
});
