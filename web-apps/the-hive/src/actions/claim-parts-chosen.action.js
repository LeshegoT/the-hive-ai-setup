export const CLAIM_PARTS_CHOSEN = 'CLAIM_PARTS_CHOSEN';

export const claimPartsChosen = (parts) => {
    return {
        type: CLAIM_PARTS_CHOSEN,
        parts
    };
}