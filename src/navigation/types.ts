export const APP_TABS = ['Today', 'Plan', 'Library', 'Progress', 'Me'] as const;
export type AppTab = (typeof APP_TABS)[number];

/** A detail flow remembers the tab it came from so Back returns to the same context. */
export type DetailNavigationState<Route extends string> = {
  tab: AppTab;
  route: Route;
  parentRoute: Route | null;
};

export const TAB_ACCESSIBILITY_LABELS: Record<AppTab, string> = {
  Today: 'Today, main section',
  Plan: 'Plan, main section',
  Library: 'Library, main section',
  Progress: 'Progress, main section',
  Me: 'Me, main section',
};
