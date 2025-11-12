export const CLAIM_PARTS_RECEIVED = 'CLAIM_PARTS_RECEIVED';

export const claimPartsReceived = (claimParts) => {
  return {
    type: CLAIM_PARTS_RECEIVED,
    claimParts
  };
};
