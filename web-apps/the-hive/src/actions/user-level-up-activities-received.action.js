export const USER_LEVEL_UP_ACTIVITIES_RECEIVED = 'USER_LEVEL_UP_ACTIVITIES_RECEIVED';

export const userLevelUpActivitiesReceived = (userLevelUpActivities) => {
    return {
        type: USER_LEVEL_UP_ACTIVITIES_RECEIVED,
        userLevelUpActivities
    };
}