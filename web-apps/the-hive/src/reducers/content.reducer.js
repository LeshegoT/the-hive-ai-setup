import { CONTENT_RECEIVED, CONTENT_ADDED } from '../actions/content-received.action';

const INITIAL_STATE = {
  contentSearchOptions: [],
};

export const content = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case CONTENT_RECEIVED:
          return {
            ...state,
            contentSearchOptions: action.content
          };
        case CONTENT_ADDED:
          let existingUrls = state.contentSearchOptions.map((content) => content.url)
          let contentSearchOptions = state.contentSearchOptions
          if(!existingUrls.includes(action.content.url)){
            contentSearchOptions.push(action.content);
          }
          return {
              ...state,
              contentSearchOptions
          };
        default:
            return state;
    }
};