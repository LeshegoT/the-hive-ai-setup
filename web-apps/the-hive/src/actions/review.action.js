
export const REVIEW_VIEW_UPDATED = 'REVIEW_VIEW_UPDATED';
export const ACTIVE_REVIEW_RECEIVED = 'ACTIVE_REVIEW_RECEIVED';
export const REVIEW_SECTION_RECEIVED = 'REVIEW_SECTION_RECEIVED';

export const reviewViewUpdated = (view) => {
  return {
    type: REVIEW_VIEW_UPDATED,
    view,
  };
};



export const activeReviewReceived = (review) => {
  return {
    type: ACTIVE_REVIEW_RECEIVED,
    review,
  };
};

export const reviewSectionReceived = (section) => {
  return {
    type: REVIEW_SECTION_RECEIVED,
    section,
  };
};