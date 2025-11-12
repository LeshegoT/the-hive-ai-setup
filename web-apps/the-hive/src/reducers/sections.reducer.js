import { SECTION_COMPLETED } from '../actions/section-completed.action';
import { SECTION_MARKDOWN_RECEIVED } from '../actions/section-markdown-received.action';
import { SECTION_UNREAD } from '../actions/section-unread.action';
import { SECTIONS_RECEIVED } from '../actions/sections-received.action';
import { USER_DATA_RECEIVED } from '../actions/user-data-received.action';

const INITIAL_STATE = {
  all: [],
  user: [],
  markdown: null
};

export const sections = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SECTIONS_RECEIVED:
      return {
        ...state,
        all: action.sections
      };
    case USER_DATA_RECEIVED:
      return {
        ...state,
        user: [...state.user, ...action.sections]
      };
    case SECTION_MARKDOWN_RECEIVED:
      return {
        ...state,
        markdown: action.markdown
      };
    case SECTION_COMPLETED:
      return {
        ...state,
        user: [...state.user, { sectionId: action.sectionId }]
      };
    case SECTION_UNREAD:
      return {
        ...state,
        user: [...state.user.filter(userSection => userSection.sectionId !== action.sectionId)]
      };
    default:
      return state;
  }
};
