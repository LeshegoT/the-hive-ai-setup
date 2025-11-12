export const LEVEL_UPS_RECEIVED = 'LEVEL_UPS_RECEIVED';

export const levelUpsReceived = (levelUps) => {
    return {
        type: LEVEL_UPS_RECEIVED,
        levelUps
    };
}