import { createSelector } from 'reselect';

export const selectAllNotifications = (state) => state.notifications.all;

export const selectNotificationActiveCount = createSelector(
  selectAllNotifications,
  (notifications) => notifications.filter((note) => !note.resolved).length
)