export const ANNOUNCEMENT_RECEIVED = 'ANNOUNCEMENT_RECEIVED';

export const announcementReceived = (announcement) => {
  return {
    type: ANNOUNCEMENT_RECEIVED,
    announcement,
  };
};
