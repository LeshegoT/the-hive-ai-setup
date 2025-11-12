import { TAGS_RECEIVED, TAGS_ADDED } from '../actions/tags-received.action';

const INITIAL_STATE = {
  tagSearchOptions: [],
};

export const tags = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case TAGS_RECEIVED:
            return {
                ...state,
                tagSearchOptions: action.tags
            };
        case TAGS_ADDED:
          let existingNames = state.tagSearchOptions.map((tag) => tag.tagName);
          let newTags = Array.isArray(action.tags) ? action.tags : [];
          let tagSearchOptions = state.tagSearchOptions.concat(newTags.filter((tag) => !existingNames.includes(tag.tagName)));
          return {
              ...state,
              tagSearchOptions
          };
        
        default:
            return state;
    }
};