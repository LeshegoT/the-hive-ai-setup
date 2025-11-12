import { expect } from '@open-wc/testing';
import {
  selectAllSections,
  selectUserSections,
  selectSections,
  selectSectionMarkdown
} from '../../../src/selectors/sections.selector';

describe('Selector - Section', () => {
  it('should return all sections from state', () => {
    let state = {
      sections: {
        all: [{ sectionId: 1 }, { sectionId: 2 }, { sectionId: 3 }]
      }
    };

    let sections = selectAllSections(state);

    expect(sections).to.equal(state.sections.all);
  });

  it('should return user sections from state', () => {
    let state = {
      sections: {
        user: [{ sectionId: 1 }, { sectionId: 2 }, { sectionId: 3 }]
      }
    };

    let sections = selectUserSections(state);

    expect(sections).to.equal(state.sections.user);
  });

  it('should return sections with user section and questions', () => {
    let sections = [{ sectionId: 1 }, { sectionId: 2 }, { sectionId: 3 }];
    let userSections = [{ sectionId: 1 }, { sectionId: 2 }];
    let questions = [
      { questionId: 1, sectionId: 1 },
      { questionId: 2, sectionId: 1 },
      { questionId: 3, sectionId: 3 }
    ];

    let expected_sections = [
      {
        sectionId: 1,
        userSectionId: { sectionId: 1 },
        questions: [
          { questionId: 1, sectionId: 1 },
          { questionId: 2, sectionId: 1 }
        ]
      },
      { sectionId: 2, userSectionId: { sectionId: 2 }, questions: [] },
      {
        sectionId: 3,
        userSectionId: undefined,
        questions: [{ questionId: 3, sectionId: 3 }]
      }
    ];

    let actual_sections = selectSections.resultFunc(sections, userSections, questions);

    expect(actual_sections).to.deep.equal(expected_sections);
  });

  it('should return section markdown from state', () => {
    let state = {
      sections: {
        markdown: 'section markdown'
      }
    };

    let markdown = selectSectionMarkdown(state);

    expect(markdown).to.equal(state.sections.markdown);
  });
});
