import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';

import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate,
  createEmptyChartSetlist,
  getChartSourceRefs,
  normalizeChartTextKey
} from './chart-library.js';

const SHOW_METADATA_TAG_CONTROLS = false;

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
  if (target.kind === 'batch') return `${documents.length} matching chart${documents.length === 1 ? '' : 's'}`;
  return documents[0]?.metadata?.title || 'Untitled chart';
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

type TagAssignment = {
  tag: string;
  count: number;
};

type SetlistAssignment = {
  setlist: ChartSetlist;
  count: number;
};

type MetadataSummaryField = {
  label: string;
  getValue: (document: ChartDocument) => unknown;
};

const METADATA_SUMMARY_FIELDS: MetadataSummaryField[] = [
  { label: 'Composer', getValue: (document) => document.metadata?.composer },
  { label: 'Artist', getValue: (document) => document.metadata?.artist },
  { label: 'Author', getValue: (document) => document.metadata?.author },
  { label: 'Style', getValue: (document) => document.metadata?.styleReference || document.metadata?.style },
  { label: 'Key', getValue: (document) => document.metadata?.displayKey || document.metadata?.sourceKey },
  { label: 'Time', getValue: (document) => document.metadata?.primaryTimeSignature },
  { label: 'Tempo', getValue: (document) => document.metadata?.tempo || document.metadata?.defaultTempo },
  { label: 'Origin', getValue: (document) => document.metadata?.origin },
  { label: 'Sources', getValue: (document) => getChartSourceRefs(document).map((ref) => ref.name).filter(Boolean).join(', ') }
];

function sortTags(tags: string[]): string[] {
  return tags.sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(formatMetadataValue).filter(Boolean).join(', ');
  return '';
}

function getMetadataSummaryRows(documents: ChartDocument[]): Array<{ label: string; value: string }> {
  return METADATA_SUMMARY_FIELDS.map((field) => {
    const values = documents
      .map((document) => formatMetadataValue(field.getValue(document)))
      .filter(Boolean);
    const distinctValues = [...new Set(values)];
    if (distinctValues.length === 0) return null;
    return {
      label: field.label,
      value: distinctValues.length === 1 ? distinctValues[0] : `${distinctValues.length} values`
    };
  }).filter((row): row is { label: string; value: string } => Boolean(row));
}

function getLibraryTags(documents: ChartDocument[]): string[] {
  return getSharedTags(documents);
}

function getTagAssignments(targetDocuments: ChartDocument[], libraryDocuments: ChartDocument[]): TagAssignment[] {
  const tagsByKey = new Map<string, TagAssignment>();
  for (const tag of getLibraryTags(libraryDocuments)) {
    const normalized = normalizeChartTextKey(tag);
    if (normalized) tagsByKey.set(normalized, { tag, count: 0 });
  }
  for (const document of targetDocuments) {
    const documentTagKeys = new Set<string>();
    for (const tag of document.metadata?.userTags || []) {
      const normalized = normalizeChartTextKey(tag);
      if (!normalized) continue;
      documentTagKeys.add(normalized);
      if (!tagsByKey.has(normalized)) tagsByKey.set(normalized, { tag, count: 0 });
    }
    documentTagKeys.forEach((normalized) => {
      const assignment = tagsByKey.get(normalized);
      if (assignment) assignment.count += 1;
    });
  }
  return [...tagsByKey.values()].sort((left, right) => left.tag.localeCompare(right.tag, 'en', { sensitivity: 'base' }));
}

function getSetlistAssignments(chartIds: string[], setlists: ChartSetlist[]): SetlistAssignment[] {
  const targetIds = new Set(chartIds);
  return setlists
    .map((setlist) => ({
      setlist,
      count: setlist.items.filter((item) => targetIds.has(item.chartId)).length
    }))
    .sort((left, right) => left.setlist.name.localeCompare(right.setlist.name, 'en', { sensitivity: 'base' }));
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

function applySingleTargetDraft(
  state: MetadataPanelState,
  chartId: string,
  patch: Parameters<typeof applyPerChartMetadataUpdate>[0]['patch']
): MetadataPanelState {
  return applyPerChartMetadataUpdate({
    documents: state.documents,
    setlists: state.setlists,
    chartId,
    patch
  });
}

function applyBatchTargetDraft(
  state: MetadataPanelState,
  chartIds: string[],
  operation: Parameters<typeof applyBatchMetadataOperation>[0]['operation']
): MetadataPanelState {
  const result = applyBatchMetadataOperation({
    documents: state.documents,
    setlists: state.setlists,
    chartIds,
    operation
  });
  return { documents: result.documents, setlists: result.setlists };
}

function createSetlistAndAddTargetsDraft(
  state: MetadataPanelState,
  chartIds: string[],
  name: string
): MetadataPanelState {
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
  return { documents: state.documents, setlists: nextSetlists };
}

export function closeChartMetadataPanel(host: HTMLElement | null | undefined): void {
  if (!host) return;
  host.hidden = true;
  host.removeAttribute('role');
  host.removeAttribute('aria-modal');
  host.removeAttribute('aria-label');
  host.replaceChildren();
}

export function openChartMetadataPanel(options: ChartMetadataPanelOptions): void {
  let hasConfirmedPartialTagEdit = false;
  let hasConfirmedPartialSetlistEdit = false;
  let isDeleteConfirmationVisible = false;
  let draftState: MetadataPanelState = {
    documents: [...options.getState().documents],
    setlists: [...options.getState().setlists]
  };

  const render = (): void => {
    const state = draftState;
    const chartIds = getTargetChartIds(options.target, state);
    const documents = getTargetDocuments(options.target, state);
    const panel = document.createElement('section');
    panel.className = 'chart-metadata-panel-content';
    panel.setAttribute('aria-label', 'Chart metadata');

    const cancelDraft = () => {
      closeChartMetadataPanel(options.host);
      options.closePanel?.();
    };
    const validateDraft = async () => {
      await options.persistState(draftState, 'Metadata updated.');
      closeChartMetadataPanel(options.host);
      options.closePanel?.();
    };

    if (documents.length === 0) {
      panel.append(createEmptyMessage('No matching charts.'));
      options.host.replaceChildren(panel);
      options.host.hidden = false;
      options.host.setAttribute('role', 'dialog');
      options.host.setAttribute('aria-modal', 'true');
      options.host.setAttribute('aria-label', 'Chart metadata');
      return;
    }

    const header = document.createElement('div');
    header.className = 'chart-metadata-header';
    header.append(createTextElement('h2', 'chart-metadata-title', getTargetTitle(options.target, documents)));
    panel.append(header);

    const metadataRows = getMetadataSummaryRows(documents);
    if (metadataRows.length > 0) {
      const summary = document.createElement('dl');
      summary.className = 'chart-metadata-summary';
      for (const row of metadataRows) {
        summary.append(
          createTextElement('dt', '', row.label),
          createTextElement('dd', '', row.value)
        );
      }
      panel.append(summary);
    }

    // Tags are temporarily hidden from metadata, but the editing block stays here for easy reactivation.
    if (SHOW_METADATA_TAG_CONTROLS) {
      const tagSection = document.createElement('section');
      tagSection.className = 'chart-metadata-section';

      const applyTagAction = (tag: string, shouldAdd: boolean, isPartial = false) => {
        if (isPartial && options.target.kind === 'batch' && !hasConfirmedPartialTagEdit) {
          const confirmed = window.confirm('This tag is only assigned to part of the selection. This action will modify the entire selection.');
          if (!confirmed) return;
          hasConfirmedPartialTagEdit = true;
        }
        if (options.target.kind === 'single') {
          draftState = applySingleTargetDraft(draftState, chartIds[0], shouldAdd ? { addTags: [tag], createTag: tag } : { removeTags: [tag] });
        } else {
          draftState = applyBatchTargetDraft(draftState, chartIds, { kind: shouldAdd ? 'add-tag' : 'remove-tag', tag });
        }
        render();
      };

      const assignments = getTagAssignments(documents, state.documents);
      const assignedTags = assignments.filter((assignment) => assignment.count > 0);
      const availableTags = assignments.filter((assignment) => assignment.count === 0);
      const tagHeading = document.createElement('div');
      tagHeading.className = 'chart-metadata-inline-heading';
      tagHeading.append(createTextElement('h3', '', 'Tags'));
      if (assignedTags.length > 0) {
        const selectedTagRow = document.createElement('div');
        selectedTagRow.className = 'chart-metadata-chip-row';
        for (const assignment of assignedTags) {
          const isPartial = documents.length > 1 && assignment.count > 0 && assignment.count < documents.length;
          const button = createButton(assignment.tag, `chart-metadata-chip chart-metadata-tag-chip is-active${isPartial ? ' is-partial' : ''}`);
          button.setAttribute('aria-pressed', isPartial ? 'mixed' : 'true');
          button.title = isPartial ? `${assignment.count}/${documents.length} selected charts` : 'Assigned to selected charts';
          button.addEventListener('click', () => applyTagAction(assignment.tag, false, isPartial));
          selectedTagRow.append(button);
        }
        tagHeading.append(selectedTagRow);
      }
      tagSection.append(tagHeading);

      if (availableTags.length > 0) {
        const availableTagList = document.createElement('div');
        availableTagList.className = 'chart-metadata-add-row';
        availableTagList.append(createTextElement('span', 'chart-metadata-tag-group-label', 'Add tag:'));
        const availableTagRow = document.createElement('div');
        availableTagRow.className = 'chart-metadata-chip-row';
        for (const tag of sortTags(availableTags.map((assignment) => assignment.tag))) {
          const button = createButton(tag, 'chart-metadata-chip chart-metadata-tag-chip');
          button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', () => applyTagAction(tag, true));
          availableTagRow.append(button);
        }
        availableTagList.append(availableTagRow);
        tagSection.append(availableTagList);
      }

      const tagInput = document.createElement('input');
      tagInput.className = 'chart-metadata-input';
      tagInput.type = 'text';
      tagInput.placeholder = 'New tag name';
      const addTagButton = createButton('Add tag');
      addTagButton.addEventListener('click', () => {
        const tag = tagInput.value.trim();
        if (!tag) return;
        applyTagAction(tag, true);
      });
      const tagEntryRow = createActionRow(tagInput, addTagButton);
      tagEntryRow.classList.add('chart-metadata-tag-entry-row');
      tagSection.append(tagEntryRow);
      panel.append(tagSection);
    }

    const setlistSection = document.createElement('section');
    setlistSection.className = 'chart-metadata-section';

    const applySetlistAction = (setlist: ChartSetlist, shouldAdd: boolean, isPartial = false) => {
      if (isPartial && options.target.kind === 'batch' && !hasConfirmedPartialSetlistEdit) {
        const confirmed = window.confirm('This setlist is only assigned to part of the selection. This action will modify the entire selection.');
        if (!confirmed) return;
        hasConfirmedPartialSetlistEdit = true;
      }
      if (options.target.kind === 'single') {
        draftState = applySingleTargetDraft(draftState, chartIds[0], shouldAdd ? { addSetlistIds: [setlist.id] } : { removeSetlistIds: [setlist.id] });
      } else {
        draftState = applyBatchTargetDraft(draftState, chartIds, { kind: shouldAdd ? 'add-setlist' : 'remove-setlist', setlistId: setlist.id });
      }
      render();
    };

    const setlistAssignments = getSetlistAssignments(chartIds, state.setlists);
    const assignedSetlists = setlistAssignments.filter((assignment) => assignment.count > 0);
    const availableSetlists = setlistAssignments.filter((assignment) => assignment.count === 0);
    const setlistHeading = document.createElement('div');
    setlistHeading.className = 'chart-metadata-inline-heading';
    setlistHeading.append(createTextElement('h3', '', 'Setlists'));
    if (assignedSetlists.length > 0) {
      const selectedSetlistRow = document.createElement('div');
      selectedSetlistRow.className = 'chart-metadata-chip-row';
      for (const assignment of assignedSetlists) {
        const isPartial = documents.length > 1 && assignment.count > 0 && assignment.count < documents.length;
        const button = createButton(assignment.setlist.name, `chart-metadata-chip chart-metadata-tag-chip is-active${isPartial ? ' is-partial' : ''}`);
        button.setAttribute('aria-pressed', isPartial ? 'mixed' : 'true');
        button.title = isPartial ? `${assignment.count}/${documents.length} selected charts` : 'Assigned to selected charts';
        button.addEventListener('click', () => applySetlistAction(assignment.setlist, false, isPartial));
        selectedSetlistRow.append(button);
      }
      setlistHeading.append(selectedSetlistRow);
    }
    setlistSection.append(setlistHeading);

    if (availableSetlists.length > 0) {
      const availableSetlistList = document.createElement('div');
      availableSetlistList.className = 'chart-metadata-add-row';
      availableSetlistList.append(createTextElement('span', 'chart-metadata-tag-group-label', 'Add to setlist:'));
      const availableSetlistRow = document.createElement('div');
      availableSetlistRow.className = 'chart-metadata-chip-row';
      for (const assignment of availableSetlists) {
        const button = createButton(assignment.setlist.name, 'chart-metadata-chip chart-metadata-tag-chip');
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => applySetlistAction(assignment.setlist, true));
        availableSetlistRow.append(button);
      }
      availableSetlistList.append(availableSetlistRow);
      setlistSection.append(availableSetlistList);
    }

    const newSetlistInput = document.createElement('input');
    newSetlistInput.className = 'chart-metadata-input';
    newSetlistInput.type = 'text';
    newSetlistInput.placeholder = 'New setlist name';
    const createSetlistButton = createButton('Add setlist');
    createSetlistButton.addEventListener('click', () => {
      const name = newSetlistInput.value.trim();
      if (!name) return;
      draftState = createSetlistAndAddTargetsDraft(draftState, chartIds, name);
      render();
    });
    const setlistEntryRow = createActionRow(newSetlistInput, createSetlistButton);
    setlistEntryRow.classList.add('chart-metadata-setlist-entry-row');
    setlistSection.append(setlistEntryRow);
    panel.append(setlistSection);

    const footerActions = document.createElement('div');
    footerActions.className = 'chart-metadata-footer-actions';
    const deleteButton = createButton(
      isDeleteConfirmationVisible ? 'Confirm delete' : 'Delete',
      isDeleteConfirmationVisible ? 'chart-metadata-danger-confirm' : 'chart-metadata-danger-action'
    );
    deleteButton.addEventListener('click', async () => {
      if (!isDeleteConfirmationVisible) {
        isDeleteConfirmationVisible = true;
        render();
        return;
      }
      const deletedState = applyBatchTargetDraft(draftState, chartIds, { kind: 'delete' });
      await options.persistState(deletedState, `Deleted ${chartIds.length} chart${chartIds.length === 1 ? '' : 's'}.`);
      closeChartMetadataPanel(options.host);
      options.closePanel?.();
    });
    const cancelButton = createButton('Cancel', 'chart-metadata-cancel');
    cancelButton.addEventListener('click', cancelDraft);
    const validateButton = createButton('Validate', 'chart-metadata-confirm');
    validateButton.addEventListener('click', () => void validateDraft());
    footerActions.append(deleteButton, cancelButton, validateButton);
    panel.append(footerActions);

    options.host.replaceChildren(panel);
    options.host.hidden = false;
    options.host.setAttribute('role', 'dialog');
    options.host.setAttribute('aria-modal', 'true');
    options.host.setAttribute('aria-label', 'Chart metadata');
  };

  render();
}
