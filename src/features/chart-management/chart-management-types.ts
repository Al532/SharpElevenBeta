export const CHIP_FILTER_OPTION_LIMIT = 12;
export const CHART_MANAGE_FILTER_KEYS = ['origin', 'source', 'tag', 'setlist'] as const;
export const FILTER_ACTION_ALL = '__all__';
export const FILTER_ACTION_NONE = '__none__';
export const FILTER_TAG_NO_TAG = '__no_tag__';
export const FILTER_SOURCE_NO_SOURCE = '__no_source__';
export const FILTER_SETLIST_NO_SETLIST = '__no_setlist__';

export type ChartManageFilterKey = typeof CHART_MANAGE_FILTER_KEYS[number];
export type ChartManageFilterMode = 'all' | 'custom';
export type ChartManageFilterOption = {
  label: string;
  value: string;
};

export type ChartManagementMode = 'library' | 'setlists';

export type SetlistDragItem = {
  setlistId: string;
  index: number;
};

export type SetlistDropTarget = {
  setlistId: string;
  index?: number;
};
