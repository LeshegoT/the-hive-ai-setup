export const REFERENCE_DATA_RECEIVED = 'REFERENCE_DATA_RECEIVED';

export const referenceDataReceived = (referenceData) => {
  return {
    type: REFERENCE_DATA_RECEIVED,
    referenceData
  };
};
