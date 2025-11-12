export const MISSIONS_RECEIVED = 'MISSIONS_RECEIVED';

export const missionsReceived = (missions) => {
    return {
        type: MISSIONS_RECEIVED,
        missions
    };
}