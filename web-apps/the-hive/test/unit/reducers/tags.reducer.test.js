import { expect } from '@open-wc/testing';
import { tags } from '../../../src/reducers/tags.reducer';
import { initialise_reducer_test } from '../shared/reducer';
import { TAGS_RECEIVED, TAGS_ADDED } from '../../../src/actions/tags-received.action';


describe('Reducer - Tags', () => {
  let initial_state = {
    tagSearchOptions: []
  };

  let test_reducer_state = initialise_reducer_test(tags, initial_state);

  it('should initialise correctly.', () => {
    let state = tags(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a TAGS_RECEIVED action.`, () => {
    let action = {
      type: TAGS_RECEIVED,
      tags: [{tagName: "tag1"}, {tagName: "tag2"}]
    };

    let delta = {
      tagSearchOptions: action.tags
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a TAGS_ADDED action.`, () => {
    let initial_state = {
      tagSearchOptions: [{tagName: "tag1"}, {tagName: "tag2"}]
    };

    let action = {
      type: TAGS_ADDED,
      tags: [{tagName: "tag2"}, {tagName: "tag3"}]
    };
    
    let state = tags(initial_state, action);

    let delta = {
      tagSearchOptions: [{tagName: "tag1"}, {tagName: "tag2"}, {tagName: "tag3"}]
    };

    expect(state).to.deep.equal({
      ...delta
    });
  });
});
