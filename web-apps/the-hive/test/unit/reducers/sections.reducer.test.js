import { expect } from '@open-wc/testing';
import { sections } from '../../../src/reducers/sections.reducer';
import { initialise_reducer_test, test_reducer_action } from '../shared/reducer';
import { USER_DATA_RECEIVED } from '../../../src/actions/user-data-received.action';
import { SECTIONS_RECEIVED } from '../../../src/actions/sections-received.action';
import { SECTION_MARKDOWN_RECEIVED } from '../../../src/actions/section-markdown-received.action';
import { SECTION_COMPLETED } from '../../../src/actions/section-completed.action';


describe('Reducer - Sections', () => {
  let initial_state = {
    all: [],
    user: [],
    markdown: null
  };

  let test_reducer_state = initialise_reducer_test(sections, initial_state);

  it('should initialise correctly.', () => {
    let state = sections(undefined, {});

    expect(state).to.deep.equal(initial_state);
  });

  it(`should update the state on a USER_DATA_RECEIVED action.`, () => {
    let action = {
      type: USER_DATA_RECEIVED,
      sections: [{sectionId: 1}]
    };

    let delta = {
        user: action.sections
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SECTIONS_RECEIVED action.`, () => {
    let action = {
      type: SECTIONS_RECEIVED,
      sections: [{sectionId: 1}]
    };

    let delta = {
        all: action.sections
    };

    test_reducer_state(action, delta);
  });

  it(`should update the state on a SECTION_COMPLETED action.`, () => {
    let action = {
      type: SECTION_COMPLETED,
      sectionId: 1
    };

    let delta = {
        user: [{sectionId: 1}]
    };

    test_reducer_state(action, delta);
  });

  test_reducer_action(sections, initial_state, SECTION_MARKDOWN_RECEIVED, { markdown: 'markdown' });
});
