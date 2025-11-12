import { createSelector } from 'reselect';
import { selectSections } from './sections.selector';
import { selectCourseCode, selectSectionCode } from './route-data.selectors';
import { courses } from '../reducers/courses.reducer';

export const selectAllCourses = (state) => state.courses.all;

export const selectAllPrescribedCourses = (state) => state.courses.prescribed;

export const selectAllCompletedCourses = (state) => state.courses.completed;

const mapSections = (course, sections) => {
  if (!sections || !sections.length) return [];

  return course.sectionIds.map((id) =>
    sections.find((section) => section.sectionId === id)
  );
};

export const selectCourses = createSelector(
  selectAllCourses,
  selectSections,
  selectAllPrescribedCourses,
  selectAllCompletedCourses,
  (courses, sections, prescribedCourses) => {
    const isPrescribed = (course) => {
      if (!prescribedCourses) return false;
      return prescribedCourses.find(c => c.courseId === course.courseId);
    };

    const prioritySorter = (a, b) => {
      if (isPrescribed(a) && !isPrescribed(b)) {
        return -1;
      }
      if (!isPrescribed(a) && isPrescribed(b)) {
        return 1;
      }
      return 0;
    };
    return courses.map((course) => ({
      ...course,
      sections: mapSections(course, sections)
    }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => prioritySorter(a, b));
  }
);



export const selectCourse = createSelector(
  selectCourseCode,
  selectCourses,
  (courseCode, courses) => courses.find((course) => course.code === courseCode)
);

export const selectSection = createSelector(
  selectCourse,
  selectSectionCode,
  (course, sectionCode) => {
    if (!course) return;

    return course.sections.find((section) => section.code === sectionCode);
  }
);

export const selectNextSection = createSelector(
  selectCourse,
  selectSection,
  (course, section) => {
    if (!course || !section) return;

    let index = course.sections.findIndex((s) => s.sectionId === section.sectionId);
    return course.sections[index + 1];
  }
);

export const selectCourseProgress = createSelector(selectCourses, (courses) =>
  courses.map((course) => {
    let { courseId, code, name, icon } = course;

    let totalSections = course.sections.length;
    let completedSections = course.sections.filter((section) => section.userSectionId)
      .length;

    let nextSection = course.sections.find((section) => !section.userSectionId);

    return {
      courseId,
      code,
      name,
      icon,
      completedSections,
      totalSections,
      nextSectionCode: nextSection && nextSection.code,
      nextSectionName: nextSection && nextSection.name
    };
  })
);

export const selectActivePrescribedCourses = createSelector(
  selectCourseProgress,
  selectAllPrescribedCourses,
  (all, prescribed) =>
    prescribed
      .filter((prescribedCourse) => prescribedCourse.dateCompleted == null)
      .map((prescribedCourse) => {
        let courseData = all.find(
          (course) => course.courseId == prescribedCourse.courseId
        );

        if (courseData) {
          let progress =
            courseData.completedSections && courseData.totalSections
              ? (100 * (courseData.completedSections / courseData.totalSections)).toFixed(0)
              : 0;

          return {
            ...prescribedCourse,
            ...courseData,
            progress
          };
        }
      })
);
