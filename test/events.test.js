import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupBasicDom } from './dom-helpers.js';

const mockNormalizeAuraUri = vi.fn(() => ({ serverUrl: 'neo4j+s://example', driverConfig: { encrypted: 'ENCRYPTION_OFF' } }));
const mockBuildNeoVisConfig = vi.fn((params) => ({ neo4j: {}, params }));
const mockPrepareRelationshipData = vi.fn();
const mockBindNodeSelection = vi.fn();
const mockCaptureOriginalData = vi.fn(() => ({ nodes: ['n1'], edges: ['e1'] }));
const mockRestoreGraph = vi.fn();
const mockApplySearchFilter = vi.fn();
const mockUpdateSearchFeedback = vi.fn();
const mockLogStatus = vi.fn();
const mockShowNodeDetails = vi.fn();
const mockClearNodeDetails = vi.fn();
const mockShowRelationshipPopover = vi.fn();
const mockHideRelationshipPopover = vi.fn();

vi.mock('../src/config/neo4j.js', () => ({
  normalizeAuraUri: mockNormalizeAuraUri,
  buildNeoVisConfig: mockBuildNeoVisConfig,
}));

vi.mock('../src/graph/visualization.js', () => ({
  prepareRelationshipData: mockPrepareRelationshipData,
  bindNodeSelection: mockBindNodeSelection,
  captureOriginalData: mockCaptureOriginalData,
  restoreGraph: mockRestoreGraph,
  applySearchFilter: mockApplySearchFilter,
  updateSearchFeedback: mockUpdateSearchFeedback,
}));

vi.mock('../src/ui/status.js', () => ({
  logStatus: mockLogStatus,
}));

vi.mock('../src/ui/details.js', () => ({
  showNodeDetails: mockShowNodeDetails,
  clearNodeDetails: mockClearNodeDetails,
  showRelationshipPopover: mockShowRelationshipPopover,
  hideRelationshipPopover: mockHideRelationshipPopover,
}));

async function importEvents() {
  return import('../src/ui/events.js');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  window.alert = vi.fn();
  window.NeoVis = undefined;
});

describe('run button validation and lifecycle', () => {
  it('shows alert when required inputs are missing', async () => {
    const { runButton } = setupBasicDom();
    const { run } = await importEvents();

    await run();

    expect(window.alert).toHaveBeenCalledWith('Please fill in AuraDB URI, Username, Password, and Cypher.');
    expect(mockLogStatus).not.toHaveBeenCalled();
    expect(runButton.disabled).toBe(false);
  });

  it('creates NeoVis instance, renders, and re-enables button', async () => {
    const { credentialsSection, uriInput, userInput, passwordInput, cypherInput, runButton, searchFeedback } = setupBasicDom();
    uriInput.value = 'neo4j+s://example.databases.neo4j.io';
    userInput.value = 'neo4j';
    passwordInput.value = 'password';
    cypherInput.value = 'MATCH (n) RETURN n';

    class NeoVisMock {
      static instances = [];

      constructor(config) {
        this.config = config;
        this.clearNetwork = vi.fn();
        this.renderWithCypher = vi.fn().mockResolvedValue(undefined);
        this._network = { unselectAll: vi.fn() };
        NeoVisMock.instances.push(this);
      }
    }

    window.NeoVis = NeoVisMock;

    const { run } = await importEvents();
    await run();
    await run();

    expect(NeoVisMock.instances).toHaveLength(2);
    expect(NeoVisMock.instances[0].clearNetwork).toHaveBeenCalledTimes(1);
    expect(NeoVisMock.instances[1].renderWithCypher).toHaveBeenCalledWith('MATCH (n) RETURN n');
    expect(mockNormalizeAuraUri).toHaveBeenCalledWith('neo4j+s://example.databases.neo4j.io', mockLogStatus);
    expect(mockBuildNeoVisConfig).toHaveBeenCalledWith({ serverUrl: 'neo4j+s://example', user: 'neo4j', password: 'password' });
    expect(mockPrepareRelationshipData).toHaveBeenCalledTimes(2);
    expect(mockBindNodeSelection).toHaveBeenCalledTimes(2);
    expect(mockCaptureOriginalData).toHaveBeenCalledTimes(2);
    expect(mockUpdateSearchFeedback).toHaveBeenCalledWith(searchFeedback, '検索未実行', 'info');
    expect(runButton.disabled).toBe(false);
    expect(runButton.textContent).toBe('Run & Visualize');
    expect(credentialsSection.open).toBe(false);
  });

  it('logs and alerts on render failure', async () => {
    const { uriInput, userInput, passwordInput, cypherInput, runButton } = setupBasicDom();
    uriInput.value = 'neo4j+s://example.databases.neo4j.io';
    userInput.value = 'neo4j';
    passwordInput.value = 'password';
    cypherInput.value = 'MATCH (n) RETURN n';

    class FailingNeoVis {
      constructor() {
        this.renderWithCypher = vi.fn().mockRejectedValue(new Error('boom'));
        this.clearNetwork = vi.fn();
      }
    }

    window.NeoVis = FailingNeoVis;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { run } = await importEvents();
    await run();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockLogStatus).toHaveBeenCalledWith('エラー: boom');
    expect(window.alert).toHaveBeenCalledWith('Failed to run visualization: boom');
    expect(runButton.disabled).toBe(false);
    expect(runButton.textContent).toBe('Run & Visualize');

    consoleErrorSpy.mockRestore();
  });
});

describe('search interactions', () => {
  it('invokes applySearchFilter with query and wiring', async () => {
    const { searchInput, searchFeedback } = setupBasicDom();
    const { run } = await importEvents();
    expect(run).toBeTypeOf('function');

    searchInput.value = 'alice';
    searchInput.dispatchEvent(new Event('input'));

    expect(mockApplySearchFilter).toHaveBeenCalledTimes(1);
    const call = mockApplySearchFilter.mock.calls[0][0];
    expect(call.query).toBe('alice');

    call.updateSearchFeedback('message', 'tone');
    expect(mockUpdateSearchFeedback).toHaveBeenCalledWith(searchFeedback, 'message', 'tone');
  });

  it('invokes restoreGraph when clear button is pressed', async () => {
    const { searchClearButton, searchFeedback } = setupBasicDom();
    await importEvents();

    searchClearButton.click();

    expect(mockRestoreGraph).toHaveBeenCalledTimes(1);
    const call = mockRestoreGraph.mock.calls[0][0];

    call.updateSearchFeedback('reset', 'info');
    expect(mockUpdateSearchFeedback).toHaveBeenCalledWith(searchFeedback, 'reset', 'info');
  });
});
