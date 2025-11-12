export const SECTIONS_RECEIVED = 'SECTIONS_RECEIVED';

export const sectionsReceived = (sections) => {
  return {
    type: SECTIONS_RECEIVED,
    sections
  };
};
