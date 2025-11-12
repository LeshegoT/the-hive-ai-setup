export const LEVEL_UP_USERS_RECEIVED = 'LEVEL_UP_USERS_RECEIVED';

export const levelUpUsersReceived = (levelUpUsers) => {
    return {
        type: LEVEL_UP_USERS_RECEIVED,
        levelUpUsers
    };
}