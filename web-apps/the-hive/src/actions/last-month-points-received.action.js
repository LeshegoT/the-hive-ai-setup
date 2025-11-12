export const LAST_MONTH_POINTS_RECEIVED = 'LAST_MONTH_POINTS_RECEIVED';

export const lastMonthPointsReceived = (points) => {
    return {
        type: LAST_MONTH_POINTS_RECEIVED,
        points
    };
}