import type { ChartDocument, ChartSetlist } from '../../core/types/contracts';

import {
  applyBatchMetadataOperation,
  applyPerChartMetadataUpdate
} from './chart-library.js';

export type ChartEntryMenuTarget = {
  chartId: string;
  anchor: HTMLElement;
};

type ChartEntryActionsState = {
  documents: ChartDocument[];
  setlists: ChartSetlist[];
};

export type ChartEntryActionsControllerOptions = {
  getState: () => ChartEntryActionsState;
  persistState: (state: ChartEntryActionsState, statusMessage: string) => Promise<void> | void;
  persistSetlists: (setlists: ChartSetlist[], statusMessage: string) => Promise<void> | void;
  removeChartReferences?: (chartIds: string[]) => void;
};

function createTextElement(tagName: string, className: string, textContent: string): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = textContent;
  return element;
}

function createMenuButton(label: string, className = 'home-chart-entry-menu-item'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('role', 'menuitem');
  button.textContent = label;
  return button;
}

export function createChartEntryMenuButton(
  chartDocument: ChartDocument,
  onMenu: (target: ChartEntryMenuTarget) => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'home-chart-entry-kebab';
  button.setAttribute('aria-label', `Open actions for ${chartDocument.metadata.title || 'chart'}`);
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  button.addEventListener('mousedown', (event) => event.stopPropagation());
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onMenu({ chartId: chartDocument.metadata.id, anchor: button });
  });
  return button;
}

export function createChartEntryActionsController(options: ChartEntryActionsControllerOptions) {
  let activeChartMenu: ChartEntryMenuTarget | null = null;
  let activeSetlistPopupChartId = '';
  let pendingDeleteChartId = '';

  const chartEntryMenu = document.createElement('div');
  chartEntryMenu.className = 'home-chart-entry-menu';
  chartEntryMenu.hidden = true;
  chartEntryMenu.setAttribute('role', 'menu');
  chartEntryMenu.setAttribute('aria-label', 'Chart actions');

  const setlistPopup = document.createElement('div');
  setlistPopup.className = 'home-setlist-popup';
  setlistPopup.hidden = true;
  setlistPopup.setAttribute('role', 'dialog');
  setlistPopup.setAttribute('aria-modal', 'true');
  setlistPopup.setAttribute('aria-label', 'Add chart to setlist');

  document.body.append(chartEntryMenu, setlistPopup);

  const closeMenu = (): void => {
    activeChartMenu?.anchor.setAttribute('aria-expanded', 'false');
    activeChartMenu = null;
    pendingDeleteChartId = '';
    chartEntryMenu.hidden = true;
    chartEntryMenu.classList.remove('is-confirming-delete');
    chartEntryMenu.setAttribute('role', 'menu');
    chartEntryMenu.setAttribute('aria-label', 'Chart actions');
    chartEntryMenu.replaceChildren();
  };

  const closeSetlistPopup = (): void => {
    activeSetlistPopupChartId = '';
    setlistPopup.hidden = true;
    setlistPopup.replaceChildren();
  };

  const closeAll = (): void => {
    closeSetlistPopup();
    closeMenu();
  };

  const updateChartSetlistAssignment = (
    chartId: string,
    patch: Parameters<typeof applyPerChartMetadataUpdate>[0]['patch'],
    statusMessage: string
  ): void => {
    const state = options.getState();
    const result = applyPerChartMetadataUpdate({
      documents: state.documents,
      setlists: state.setlists,
      chartId,
      patch
    });
    void options.persistSetlists(result.setlists, statusMessage);
    if (activeSetlistPopupChartId === chartId && patch.createSetlistName) {
      renderSetlistPopup(chartId, 'input');
    }
  };

  const deleteChart = async (chartId: string): Promise<void> => {
    const state = options.getState();
    const chartDocument = state.documents.find((document) => document.metadata?.id === chartId);
    if (!chartDocument) return;
    const result = applyBatchMetadataOperation({
      documents: state.documents,
      setlists: state.setlists,
      chartIds: [chartId],
      operation: { kind: 'delete' }
    });
    options.removeChartReferences?.([chartId]);
    await options.persistState({ documents: result.documents, setlists: result.setlists }, 'Chart deleted.');
    closeAll();
  };

  const positionMenu = (anchor: HTMLElement): void => {
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = chartEntryMenu.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      Math.max(margin, anchorRect.right - menuRect.width),
      Math.max(margin, window.innerWidth - menuRect.width - margin)
    );
    const top = Math.min(
      anchorRect.bottom + 4,
      Math.max(margin, window.innerHeight - menuRect.height - margin)
    );
    chartEntryMenu.style.left = `${left}px`;
    chartEntryMenu.style.top = `${top}px`;
  };

  function renderChartDeleteConfirmation(target: ChartEntryMenuTarget, chartDocument: ChartDocument): void {
    pendingDeleteChartId = target.chartId;
    activeChartMenu = target;
    target.anchor.setAttribute('aria-expanded', 'true');
    chartEntryMenu.classList.add('is-confirming-delete');
    chartEntryMenu.setAttribute('role', 'dialog');
    chartEntryMenu.setAttribute('aria-label', 'Confirm chart delete');

    const confirmation = document.createElement('div');
    confirmation.className = 'home-chart-entry-confirm';
    const title = createTextElement('strong', 'home-chart-entry-confirm-title', `Delete "${chartDocument.metadata.title || 'chart'}"?`);
    const message = createTextElement('p', 'home-chart-entry-confirm-message', 'Removes it from the library and all setlists.');
    const actions = document.createElement('div');
    actions.className = 'home-chart-entry-confirm-actions';
    const cancelButton = createMenuButton('Cancel');
    const confirmButton = createMenuButton('Delete', 'home-chart-entry-menu-item is-danger is-confirm-delete');
    cancelButton.addEventListener('click', closeMenu);
    confirmButton.addEventListener('click', () => {
      if (pendingDeleteChartId !== target.chartId) return;
      void deleteChart(target.chartId);
    });
    actions.append(cancelButton, confirmButton);
    confirmation.append(title, message, actions);
    chartEntryMenu.replaceChildren(confirmation);
    chartEntryMenu.hidden = false;
    positionMenu(target.anchor);
    requestAnimationFrame(() => cancelButton.focus());
  }

  function renderSetlistPopup(chartId: string, focusTarget: 'first' | 'input' | 'none' = 'none'): void {
    const state = options.getState();
    const chartDocument = state.documents.find((document) => document.metadata?.id === chartId);
    if (!chartDocument) return;

    const card = document.createElement('div');
    card.className = 'home-setlist-popup-card';
    const header = document.createElement('div');
    header.className = 'home-setlist-popup-header';
    header.append(createTextElement('strong', '', 'Add to setlist'));
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'home-metadata-close';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', closeSetlistPopup);
    header.append(closeButton);

    const title = createTextElement('p', 'home-setlist-popup-chart-title', chartDocument.metadata.title || 'Untitled chart');
    const list = document.createElement('div');
    list.className = 'home-setlist-popup-list';
    const memberships = new Set(
      state.setlists
        .filter((setlist) => setlist.items.some((item) => item.chartId === chartId))
        .map((setlist) => setlist.id)
    );
    if (state.setlists.length === 0) {
      list.append(createTextElement('p', 'home-empty', 'No setlists yet.'));
    } else {
      for (const setlist of state.setlists) {
        const isAssigned = memberships.has(setlist.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'home-setlist-popup-option';
        button.classList.toggle('is-selected', isAssigned);
        button.setAttribute('aria-pressed', String(isAssigned));
        const setlistName = createTextElement('span', 'home-setlist-popup-option-label', setlist.name);
        const checkmark = createTextElement('span', 'home-setlist-popup-check', '\u2713');
        checkmark.setAttribute('aria-hidden', 'true');
        button.addEventListener('click', () => {
          const shouldAdd = button.getAttribute('aria-pressed') !== 'true';
          button.classList.toggle('is-selected', shouldAdd);
          button.setAttribute('aria-pressed', String(shouldAdd));
          updateChartSetlistAssignment(
            chartId,
            shouldAdd ? { addSetlistIds: [setlist.id] } : { removeSetlistIds: [setlist.id] },
            shouldAdd ? 'Added chart to setlist.' : 'Removed chart from setlist.'
          );
        });
        button.append(setlistName, checkmark);
        list.append(button);
      }
    }

    const createRow = document.createElement('div');
    createRow.className = 'home-setlist-popup-create-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'home-setlist-popup-input';
    input.placeholder = 'New setlist name';
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.className = 'home-primary-action';
    createButton.textContent = 'Create';
    const submitCreate = (): void => {
      const name = input.value.trim();
      if (!name || activeSetlistPopupChartId !== chartId) return;
      updateChartSetlistAssignment(chartId, { createSetlistName: name }, `Created "${name}".`);
    };
    createButton.addEventListener('click', submitCreate);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitCreate();
      if (event.key === 'Escape') closeSetlistPopup();
    });
    createRow.append(input, createButton);
    card.append(header, title, list, createRow);
    setlistPopup.replaceChildren(card);
    setlistPopup.hidden = false;
    if (focusTarget === 'first') {
      requestAnimationFrame(() => {
        const firstSetlistButton = setlistPopup.querySelector<HTMLButtonElement>('.home-setlist-popup-option');
        (firstSetlistButton || input).focus();
      });
    } else if (focusTarget === 'input') {
      requestAnimationFrame(() => input.focus());
    }
  }

  function openSetlistPopup(chartId: string): void {
    activeSetlistPopupChartId = chartId;
    renderSetlistPopup(chartId, 'first');
  }

  const openMenu = (target: ChartEntryMenuTarget): void => {
    const state = options.getState();
    const chartDocument = state.documents.find((document) => document.metadata?.id === target.chartId);
    if (!chartDocument) return;
    const isSameMenu = activeChartMenu?.chartId === target.chartId && !chartEntryMenu.hidden;
    closeAll();
    if (isSameMenu) return;

    activeChartMenu = target;
    target.anchor.setAttribute('aria-expanded', 'true');
    const addButton = createMenuButton('Add to setlist');
    addButton.addEventListener('click', () => {
      closeMenu();
      openSetlistPopup(target.chartId);
    });
    const deleteButton = createMenuButton('Delete', 'home-chart-entry-menu-item is-danger');
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      renderChartDeleteConfirmation(target, chartDocument);
    });
    chartEntryMenu.replaceChildren(addButton, deleteButton);
    chartEntryMenu.classList.remove('is-confirming-delete');
    chartEntryMenu.setAttribute('role', 'menu');
    chartEntryMenu.setAttribute('aria-label', 'Chart actions');
    chartEntryMenu.hidden = false;
    positionMenu(target.anchor);
    requestAnimationFrame(() => addButton.focus());
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (chartEntryMenu.contains(event.target) || activeChartMenu?.anchor.contains(event.target)) return;
    closeMenu();
  });

  return {
    openMenu,
    closeMenu,
    closeSetlistPopup,
    closeAll
  };
}
