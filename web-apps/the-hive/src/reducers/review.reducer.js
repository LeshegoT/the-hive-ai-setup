import { 
    REVIEW_VIEW_UPDATED,
    ACTIVE_REVIEW_RECEIVED,
    REVIEW_SECTION_RECEIVED,
} from '../actions/review.action';

const INITIAL_STATE = {
  view: undefined ,
  review: undefined,
  section: undefined,
};

export const review = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case REVIEW_VIEW_UPDATED:
      return {
        ...state,
        view: action.view,
      };
    case ACTIVE_REVIEW_RECEIVED:
      return {
        ...state,
        review: action.review,
      };
    case REVIEW_SECTION_RECEIVED:
      return {
        ...state,
        section: action.section,
      };

    default:
      return state;
  }
};

