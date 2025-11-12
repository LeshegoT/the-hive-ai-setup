import { expect } from '@open-wc/testing';
import { content } from '../../../src/reducers/content.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { CONTENT_RECEIVED, CONTENT_ADDED } from '../../../src/actions/content-received.action';


describe('Reducer - Content', () => {
  let initial_state = {
    contentSearchOptions: []
  };

  let test_reducer_state = initialise_reducer_test(content, initial_state);

  it('should initialise correctly.', () => {
    let state = content(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a CONTENT_RECEIVED action.`, () => {
    let action = {
      type: CONTENT_RECEIVED,
      content: [{url: "url1"}, {url: "url2"}]
    };

    let delta = {
      contentSearchOptions: action.content
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a CONTENT_ADDED action.`, () => {
    let initial_state = {
      contentSearchOptions: [{url: "url1"}, {url: "url2"}]
    };

    let action = {
      type: CONTENT_ADDED,
      content: {url: "url3"}
    };
    
    let state = content(initial_state, action);

    let delta = {
      contentSearchOptions: [{url: "url1"}, {url: "url2"}, {url: "url3"}]
    };
    
    expect(state).to.deep.equal({
      ...delta
    });
  });
});
