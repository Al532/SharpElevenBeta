export const CHART_MANAGE_FILTER_KEYS = ['source', 'style', 'setlist'] as const;
export const FILTER_ACTION_ALL = '__all__';
export const FILTER_STYLE_NO_STYLE = '__no_style__';
export const FILTER_SOURCE_USER_CHARTS = '__user_charts__';
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
