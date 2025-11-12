export const USER_LEVEL_UPS_RECEIVED = 'USER_LEVEL_UPS_RECEIVED';

export const userLevelUpsReceived = (userLevelUps) => {
    return {
        type: USER_LEVEL_UPS_RECEIVED,
        userLevelUps
    };
}