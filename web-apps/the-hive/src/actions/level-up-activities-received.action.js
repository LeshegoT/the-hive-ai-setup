export const LEVEL_UP_ACTIVITIES_RECEIVED = 'LEVEL_UP_ACTIVITIES_RECEIVED';

export const levelUpActivitiesReceived = (levelUpActivities) => {
    return {
        type: LEVEL_UP_ACTIVITIES_RECEIVED,
        levelUpActivities
    };
}