export const PARTS_RECEIVED = 'PARTS_RECEIVED';

export const partsReceived = (parts) => {
    return {
        type: PARTS_RECEIVED,
        parts
    };
}