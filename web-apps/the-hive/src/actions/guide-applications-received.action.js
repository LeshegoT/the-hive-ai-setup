export const GUIDE_APPLICATIONS_RECEIVED = 'GUIDE_APPLICATIONS_RECEIVED';

export const guideApplicationsReceived = (guideApplications) => {
  return {
    type: GUIDE_APPLICATIONS_RECEIVED,
    guideApplications,
  };
};
