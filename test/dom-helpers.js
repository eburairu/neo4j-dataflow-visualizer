export function setupBasicDom() {
  document.body.innerHTML = `
    <details id="credentials" open></details>
    <div class="search-bar" role="search">
      <input id="graph-search" type="search" />
      <button id="search-clear" type="button">Clear</button>
    </div>
    <div id="search-feedback"></div>
    <input id="uri" type="text" />
    <input id="user" type="text" />
    <input id="password" type="password" />
    <textarea id="cypher"></textarea>
    <button id="runBtn" type="button">Run & Visualize</button>
    <div id="status"></div>
    <button id="close-relationship-popover" type="button"></button>
    <button id="close-node-details" type="button"></button>
  `;

  return {
    credentialsSection: document.getElementById('credentials'),
    searchInput: document.getElementById('graph-search'),
    searchClearButton: document.getElementById('search-clear'),
    searchFeedback: document.getElementById('search-feedback'),
    uriInput: document.getElementById('uri'),
    userInput: document.getElementById('user'),
    passwordInput: document.getElementById('password'),
    cypherInput: document.getElementById('cypher'),
    runButton: document.getElementById('runBtn'),
  };
}
