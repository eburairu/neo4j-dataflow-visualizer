const DEFAULT_DRIVER_CONFIG = {
  encrypted: 'ENCRYPTION_ON',
  trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
};

/**
 * Normalize the user-supplied Aura URI without setting encryption options on
 * both the URI and driver config to avoid duplicate configuration errors.
 * @param {string} rawUri
 * @param {(message: string) => void} [logger]
 * @returns {{serverUrl: string, driverConfig: object}}
 */
export function normalizeAuraUri(rawUri, logger = () => {}) {
  if (typeof rawUri !== 'string') {
    throw new TypeError('Aura URI must be a string');
  }

  const trimmed = rawUri.trim();
  if (!trimmed) {
    throw new Error('Aura URI is required');
  }
  const driverConfig = { ...DEFAULT_DRIVER_CONFIG };

  const securePattern = /^(neo4j|bolt)\+ss?c?:\/\//i;
  if (securePattern.test(trimmed)) {
    const normalizedUri = trimmed.replace(/^(neo4j|bolt)\+ss?c?:\/\//i, '$1://');
    logger('暗号化設定をURLからdriverConfigに移動しました。');
    return { serverUrl: normalizedUri, driverConfig };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
    const hostname = parsedUrl.hostname?.toLowerCase();
    const isAuraHost = hostname.endsWith('.databases.neo4j.io');
    const protocol = parsedUrl.protocol.replace(':', '').toLowerCase();

    if (isAuraHost && (protocol === 'neo4j' || protocol === 'bolt')) {
      const upgraded = `neo4j+s://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      logger('AuraホストのURIをTLS付きのneo4j+sスキームに自動変換しました。');
      return { serverUrl: upgraded, driverConfig };
    }
  } catch (e) {
    // Fall back to additional checks for host-only values.
  }

  const auraHostOnly = /^(\w[\w.-]*\.databases\.neo4j\.io)(?::\d+)?(\/.*)?$/i;
  if (auraHostOnly.test(trimmed)) {
    logger('Auraホスト名にTLSスキームを追加しました (neo4j+s://)。');
    return { serverUrl: `neo4j+s://${trimmed}`, driverConfig };
  }

  if (!parsedUrl) {
    throw new Error('Invalid Aura URI format');
  }

  return { serverUrl: trimmed, driverConfig };
}

/**
 * Helper to build a NeoVis configuration object with a consistent layout.
 * @param {{serverUrl: string, user: string, password: string}} params
 * @returns {object}
 */
export function buildNeoVisConfig({ serverUrl, user, password }) {
  if (!serverUrl || !user || !password) {
    throw new Error('serverUrl, user, and password are required to build NeoVis config');
  }

  return {
    containerId: 'viz',
    neo4j: {
      serverUrl,
      serverUser: user,
      serverPassword: password,
      driverConfig: { ...DEFAULT_DRIVER_CONFIG },
    },
    labels: {},
    relationships: {},
    visConfig: {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'LR',
          sortMethod: 'directed',
        },
      },
      nodes: {
        shape: 'dot',
        size: 16,
      },
      edges: {
        arrows: {
          to: { enabled: true },
        },
      },
      physics: {
        enabled: false,
        hierarchicalRepulsion: {
          nodeDistance: 180,
          avoidOverlap: 1,
        },
      },
    },
  };
}
