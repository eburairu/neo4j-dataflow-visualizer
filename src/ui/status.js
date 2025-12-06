/**
 * Append a timestamped log message to the status panel.
 * @param {string} message
 * @param {HTMLElement} [statusEl]
 */
export function logStatus(message, statusEl = document.getElementById('status')) {
  if (!statusEl) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.textContent = `[${time}] ${message}`;
  statusEl.appendChild(entry);
  statusEl.scrollTop = statusEl.scrollHeight;
}
