import { createSelector } from 'reselect';
import { selectQuestions } from './question.selector';

export const selectAllSections = (state) => state.sections.all;

export const selectUserSections = (state) => state.sections.user;

export const selectSections = createSelector(
  selectAllSections,
  selectUserSections,
  selectQuestions,
  (all, user, allQuestions) =>
    all.map((section) => {
      let userSectionId = user.find(
        (userSection) => userSection.sectionId === section.sectionId
      );
      let questions = allQuestions.filter((q) => q.sectionId === section.sectionId);

      return { ...section, userSectionId, questions };
    })
);

export const selectSectionMarkdown = (state) => state.sections.markdown;
