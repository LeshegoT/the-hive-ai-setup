export const NOTIFICATIONS_RECEIVED = 'NOTIFICATIONS_RECEIVED';

export const notificationsReceived = (notifications) => {
    return {
        type: NOTIFICATIONS_RECEIVED,
        notifications
    };
}