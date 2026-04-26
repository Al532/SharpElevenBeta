import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';

import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate,
  createEmptyChartSetlist,
  getChartSetlistMembership,
  normalizeChartTextKey
} from './chart-library.js';

type MetadataPanelTarget =
  | {
      kind: 'single';
      chartId: string;
    }
  | {
      kind: 'batch';
      title: string;
      getChartIds: () => string[];
    };

type MetadataPanelState = {
  documents: ChartDocument[];
  setlists: ChartSetlist[];
};

export type ChartMetadataPanelOptions = {
  host: HTMLElement;
  target: MetadataPanelTarget;
  getState: () => MetadataPanelState;
  persistState: (state: MetadataPanelState, statusMessage: string) => Promise<void> | void;
  closePanel?: () => void;
};

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function createButton(label: string, className = 'chart-metadata-action'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function getTargetChartIds(target: MetadataPanelTarget, state: MetadataPanelState): string[] {
  if (target.kind === 'single') return [target.chartId].filter(Boolean);
  const validIds = new Set(state.documents.map((document) => String(document.metadata?.id || '')));
  return target.getChartIds().filter((chartId) => validIds.has(chartId));
}

function getTargetDocuments(target: MetadataPanelTarget, state: MetadataPanelState): ChartDocument[] {
  const chartIds = new Set(getTargetChartIds(target, state));
  return state.documents.filter((document) => chartIds.has(String(document.metadata?.id || '')));
}

function getTargetTitle(target: MetadataPanelTarget, documents: ChartDocument[]): string {
  if (target.kind === 'batch') return target.title;
  return documents[0]?.metadata?.title || 'Untitled chart';
}

function getTargetSubtitle(target: MetadataPanelTarget, documents: ChartDocument[]): string {
  if (target.kind === 'batch') return `${documents.length} matching chart${documents.length === 1 ? '' : 's'}`;
  const chartDocument = documents[0];
  return [chartDocument?.metadata?.composer, chartDocument?.metadata?.styleReference || chartDocument?.metadata?.style]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' - ');
}

function getSharedTags(documents: ChartDocument[]): string[] {
  const tagsByKey = new Map<string, string>();
  for (const document of documents) {
    for (const tag of document.metadata?.userTags || []) {
      const normalized = normalizeChartTextKey(tag);
      if (normalized) tagsByKey.set(normalized, tag);
    }
  }
  return [...tagsByKey.values()].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
}

function getTargetSetlists(chartIds: string[], setlists: ChartSetlist[]): ChartSetlist[] {
  const targetIds = new Set(chartIds);
  return setlists
    .filter((setlist) => setlist.items.some((item) => targetIds.has(item.chartId)))
    .sort((left, right) => left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }));
}

function createActionRow(...elements: HTMLElement[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'chart-metadata-action-row';
  row.append(...elements);
  return row;
}

function createEmptyMessage(message: string): HTMLElement {
  return createTextElement('p', 'home-empty chart-metadata-empty', message);
}

async function applySingleTarget(
  options: ChartMetadataPanelOptions,
  chartId: string,
  patch: Parameters<typeof applyPerChartMetadataUpdate>[0]['patch'],
  statusMessage: string
): Promise<void> {
  const state = options.getState();
  const result = applyPerChartMetadataUpdate({
    documents: state.documents,
    setlists: state.setlists,
    chartId,
    patch
  });
  await options.persistState(result, statusMessage);
}

async function applyBatchTarget(
  options: ChartMetadataPanelOptions,
  chartIds: string[],
  operation: Parameters<typeof applyBatchMetadataOperation>[0]['operation'],
  statusMessage: string
): Promise<void> {
  const state = options.getState();
  const result = applyBatchMetadataOperation({
    documents: state.documents,
    setlists: state.setlists,
    chartIds,
    operation
  });
  await options.persistState({ documents: result.documents, setlists: result.setlists }, statusMessage);
}

async function createSetlistAndAddTargets(
  options: ChartMetadataPanelOptions,
  chartIds: string[],
  name: string,
  statusMessage: string
): Promise<void> {
  const state = options.getState();
  const setlist = createEmptyChartSetlist(name);
  let nextSetlists = [...state.setlists, setlist];
  for (const chartId of chartIds) {
    const result = applyPerChartMetadataUpdate({
      documents: state.documents,
      setlists: nextSetlists,
      chartId,
      patch: { addSetlistIds: [setlist.id] }
    });
    nextSetlists = result.setlists;
  }
  await options.persistState({ documents: state.documents, setlists: nextSetlists }, statusMessage);
}

export function closeChartMetadataPanel(host: HTMLElement | null | undefined): void {
  if (!host) return;
  host.hidden = true;
  host.replaceChildren();
}

export function openChartMetadataPanel(options: ChartMetadataPanelOptions): void {
  const render = (): void => {
    const state = options.getState();
    const chartIds = getTargetChartIds(options.target, state);
    const documents = getTargetDocuments(options.target, state);
    const panel = document.createElement('section');
    panel.className = 'chart-metadata-panel-content';
    panel.setAttribute('aria-label', 'Chart metadata');

    const closeButton = createButton('Close', 'chart-metadata-close');
    closeButton.addEventListener('click', () => {
      closeChartMetadataPanel(options.host);
      options.closePanel?.();
    });

    const header = document.createElement('div');
    header.className = 'chart-metadata-header';
    const title = document.createElement('div');
    title.className = 'chart-metadata-title';
    title.append(createTextElement('strong', '', getTargetTitle(options.target, documents)));
    const subtitle = getTargetSubtitle(options.target, documents);
    if (subtitle) title.append(createTextElement('span', 'home-list-meta', subtitle));
    header.append(title, closeButton);
    panel.append(header);

    if (documents.length === 0) {
      panel.append(createEmptyMessage('No matching charts.'));
      options.host.replaceChildren(panel);
      options.host.hidden = false;
      return;
    }

    const tagSection = document.createElement('section');
    tagSection.className = 'chart-metadata-section';
    tagSection.append(createTextElement('h3', '', 'Tags'));
    const tagInput = document.createElement('input');
    tagInput.className = 'chart-manage-text-input chart-metadata-input';
    tagInput.type = 'text';
    tagInput.placeholder = 'New or existing tag';
    const addTagButton = createButton('Add tag');
    addTagButton.addEventListener('click', async () => {
      const tag = tagInput.value.trim();
      if (!tag) return;
      if (options.target.kind === 'single') {
        await applySingleTarget(options, chartIds[0], { addTags: [tag], createTag: tag }, `Added tag "${tag}".`);
      } else {
        await applyBatchTarget(options, chartIds, { kind: 'add-tag', tag }, `Added tag "${tag}" to matching charts.`);
      }
      render();
    });
    tagSection.append(createActionRow(tagInput, addTagButton));
    const tags = getSharedTags(documents);
    const tagList = document.createElement('div');
    tagList.className = 'chart-metadata-chip-row';
    if (tags.length === 0) tagList.append(createEmptyMessage('No tags yet.'));
    for (const tag of tags) {
      const button = createButton(`Remove ${tag}`, 'chart-metadata-chip');
      button.addEventListener('click', async () => {
        if (options.target.kind === 'single') {
          await applySingleTarget(options, chartIds[0], { removeTags: [tag] }, `Removed tag "${tag}".`);
        } else {
          await applyBatchTarget(options, chartIds, { kind: 'remove-tag', tag }, `Removed tag "${tag}" from matching charts.`);
        }
        render();
      });
      tagList.append(button);
    }
    tagSection.append(tagList);
    panel.append(tagSection);

    const setlistSection = document.createElement('section');
    setlistSection.className = 'chart-metadata-section';
    setlistSection.append(createTextElement('h3', '', 'Setlists'));
    const setlistSelect = document.createElement('select');
    setlistSelect.className = 'chart-manage-select chart-metadata-input';
    setlistSelect.setAttribute('aria-label', 'Setlist');
    for (const setlist of state.setlists) setlistSelect.append(new Option(setlist.name, setlist.id));
    const addSetlistButton = createButton('Add to setlist');
    addSetlistButton.disabled = state.setlists.length === 0;
    addSetlistButton.addEventListener('click', async () => {
      const setlistId = setlistSelect.value;
      if (!setlistId) return;
      if (options.target.kind === 'single') {
        await applySingleTarget(options, chartIds[0], { addSetlistIds: [setlistId] }, 'Updated setlist membership.');
      } else {
        await applyBatchTarget(options, chartIds, { kind: 'add-setlist', setlistId }, 'Updated matching chart setlists.');
      }
      render();
    });
    setlistSection.append(createActionRow(setlistSelect, addSetlistButton));

    const newSetlistInput = document.createElement('input');
    newSetlistInput.className = 'chart-manage-text-input chart-metadata-input';
    newSetlistInput.type = 'text';
    newSetlistInput.placeholder = 'New setlist name';
    const createSetlistButton = createButton('Create setlist and add');
    createSetlistButton.addEventListener('click', async () => {
      const name = newSetlistInput.value.trim();
      if (!name) return;
      await createSetlistAndAddTargets(options, chartIds, name, `Created "${name}" and added matching chart${chartIds.length === 1 ? '' : 's'}.`);
      render();
    });
    setlistSection.append(createActionRow(newSetlistInput, createSetlistButton));

    const memberships = options.target.kind === 'single'
      ? getChartSetlistMembership(chartIds[0], state.setlists)
      : getTargetSetlists(chartIds, state.setlists);
    const setlistList = document.createElement('div');
    setlistList.className = 'chart-metadata-chip-row';
    if (memberships.length === 0) setlistList.append(createEmptyMessage('No setlists yet.'));
    for (const setlist of memberships) {
      const button = createButton(`Remove from ${setlist.name}`, 'chart-metadata-chip');
      button.addEventListener('click', async () => {
        if (options.target.kind === 'single') {
          await applySingleTarget(options, chartIds[0], { removeSetlistIds: [setlist.id] }, `Removed from "${setlist.name}".`);
        } else {
          await applyBatchTarget(options, chartIds, { kind: 'remove-setlist', setlistId: setlist.id }, `Removed matching charts from "${setlist.name}".`);
        }
        render();
      });
      setlistList.append(button);
    }
    setlistSection.append(setlistList);
    panel.append(setlistSection);

    options.host.replaceChildren(panel);
    options.host.hidden = false;
  };

  render();
}
