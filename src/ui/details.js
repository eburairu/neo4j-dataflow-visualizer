const nodePanel = document.getElementById('node-details-panel');
const nodeIdEl = document.getElementById('node-id');
const nodeLabelEl = document.getElementById('node-label');
const nodePropsEl = document.getElementById('node-properties');

const relationshipPopover = document.getElementById('relationship-popover');
const relationshipTypeEl = document.getElementById('relationship-type');
const relationshipDirectionEl = document.getElementById('relationship-direction');
const relationshipFromEl = document.getElementById('relationship-from');
const relationshipToEl = document.getElementById('relationship-to');
const relationshipPropsEl = document.getElementById('relationship-properties');

function formatProperties(properties) {
  if (!properties || typeof properties !== 'object') {
    return '-';
  }

  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return '-';
  }

  return entries
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

function formatRelationshipData(edgeData) {
  if (!edgeData) {
    return {
      type: '-',
      direction: '-',
      from: '-',
      to: '-',
      properties: '-',
    };
  }

  return {
    type: edgeData.type || edgeData.label || edgeData.caption || 'Relationship',
    direction: edgeData.direction || `${edgeData.from ?? '?'} → ${edgeData.to ?? '?'}`,
    from: edgeData.from ?? '-',
    to: edgeData.to ?? '-',
    properties: formatProperties(edgeData.properties),
  };
}

export function showNodeDetails(nodeData) {
  if (!nodePanel) return;
  const labelText = (nodeData.labels && nodeData.labels.length)
    ? nodeData.labels.join(', ')
    : nodeData.label || '-';

  nodeIdEl.textContent = nodeData.id ?? '-';
  nodeLabelEl.textContent = labelText;
  nodePropsEl.textContent = formatProperties(nodeData.properties);

  nodePanel.hidden = false;
  hideRelationshipPopover();
}

export function clearNodeDetails() {
  if (!nodePanel) return;
  nodeIdEl.textContent = '-';
  nodeLabelEl.textContent = '-';
  nodePropsEl.textContent = '-';
  nodePanel.hidden = true;
}

export function hideRelationshipPopover() {
  if (relationshipPopover) {
    relationshipPopover.hidden = true;
  }
}

export function showRelationshipPopover(edgeData, pointerDom) {
  if (!relationshipPopover || !edgeData) return;

  const formatted = formatRelationshipData(edgeData);
  relationshipTypeEl.textContent = formatted.type;
  relationshipDirectionEl.textContent = formatted.direction;
  relationshipFromEl.textContent = formatted.from;
  relationshipToEl.textContent = formatted.to;
  relationshipPropsEl.textContent = formatted.properties;

  if (pointerDom) {
    relationshipPopover.style.left = `${pointerDom.x}px`;
    relationshipPopover.style.top = `${pointerDom.y}px`;
  }

  relationshipPopover.hidden = false;
}
