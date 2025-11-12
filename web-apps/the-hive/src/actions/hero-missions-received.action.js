export const HERO_MISSIONS_RECEIVED = 'HERO_MISSIONS_RECEIVED';

export const heroMissionsReceived = (missions) => {
    return {
        type: HERO_MISSIONS_RECEIVED,
        missions
    };
}