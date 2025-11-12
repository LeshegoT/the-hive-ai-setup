import { expect } from '@open-wc/testing';
import {
  selectAllCourses,
  selectAllPrescribedCourses,
  selectCourses,
  selectCourse,
  selectSection,
  selectNextSection,
  selectCourseProgress,
  selectActivePrescribedCourses
} from '../../../src/selectors/course.selectors';

describe('Selector - Course', () => {
  it('should return all courses from state', () => {
    let state = {
      courses: {
        all: [{ courseId: 1 }, { courseId: 2 }, { courseId: 3 }]
      }
    };

    let courses = selectAllCourses(state);

    expect(courses).to.equal(state.courses.all);
  });

  it('should return all prescribed courses from state', () => {
    let state = {
      courses: {
        prescribed: [{ courseId: 1 }, { courseId: 2 }, { courseId: 3 }]
      }
    };

    let courses = selectAllPrescribedCourses(state);

    expect(courses).to.equal(state.courses.prescribed);
  });

  it('should return all courses with sections', () => {
    let courses = [
      { courseId: 1, sectionIds: [1], name: 'course name 1' },
      { courseId: 2, sectionIds: [2], name: 'course name 2' },
      { courseId: 3, sectionIds: [3], name: 'course name 3' }
    ];
    let sections = [{ sectionId: 1 }, { sectionId: 2 }, { sectionId: 3 }];

    let expected_courses = [
      {
        courseId: 1,
        name: 'course name 1',
        sectionIds: [1],
        sections: [{ sectionId: 1 }],
      },
      {
        courseId: 2,
        name: 'course name 2',
        sectionIds: [2],
        sections: [{ sectionId: 2 }],
      },
      {
        courseId: 3,
        name: 'course name 3',
        sectionIds: [3],
        sections: [{ sectionId: 3 }],
      }
    ];

    let actual_courses = selectCourses.resultFunc(
      courses,
      sections
    );

    expect(actual_courses).to.deep.equal(expected_courses);
  });

  it('should return all courses with prescribed course first', () => {

    let courses = [
      { courseId: 1, name: 'course name' },
      { courseId: 2, name: 'course name' },
      { courseId: 3, name: 'course name' }
    ];
    let prescribed = [{ courseId: 2 }]

    let expected_courses = [
      {
        courseId: 2,
        name: 'course name',
        sections: []
      },
      {
        courseId: 1,
        name: 'course name',
        sections: []
      },
      {
        courseId: 3,
        name: 'course name',
        sections: []
      }
    ];

    let actual_courses = selectCourses.resultFunc(
      courses,
      undefined,
      prescribed
    );

    console.log(actual_courses);
    expect(actual_courses).to.deep.equal(expected_courses);
  });

  it('should return all courses without sections', () => {
    let courses = [{ courseId: 1, name: 'course name'}, { courseId: 2, name: 'course name'}, { courseId: 3, name: 'course name' }];

    let expected_courses = [
      {
        courseId: 1,
        name: 'course name',
        sections: []
      },
      {
        courseId: 2,
        name: 'course name',
        sections: []
      },
      {
        courseId: 3,
        name: 'course name',
        sections: []
      }
    ];

    let actual_courses = selectCourses.resultFunc(
      courses,
      []
    );

    expect(actual_courses).to.deep.equal(expected_courses);
  });

  it('should return the correct course', () => {
    let courseCode = 'cs';
    let course = {
      courseId: 1,
      code: 'cs'
    };

    let actual_course = selectCourse.resultFunc(courseCode, [course]);

    expect(actual_course).to.deep.equal(course);
  });

  it('should return the correct section', () => {
    let sectionCode = 'overview';
    let section = { sectionId: 1, code: 'overview' };
    let course = {
      courseId: 1,
      sections: [section]
    };

    let actual_section = selectSection.resultFunc(course, sectionCode);

    expect(actual_section).to.deep.equal(section);
  });

  it('should return nothing if there is no course', () => {
    let sectionCode = 'overview';

    let actual_section = selectSection.resultFunc(undefined, sectionCode);

    expect(actual_section).to.deep.equal(undefined);
  });

  it('should return the correct next section', () => {
    let section1 = { sectionId: 1, code: 'overview' };
    let section2 = { sectionId: 2, code: 'intro' };
    let course = {
      courseId: 1,
      sections: [section1, section2]
    };

    let next_section = selectNextSection.resultFunc(course, section1);

    expect(next_section).to.deep.equal(section2);
  });

  it('should return nothing if there is no course or section', () => {
    let actual_section = selectNextSection.resultFunc(undefined, undefined);

    expect(actual_section).to.deep.equal(undefined);
  });

  it('should return the course progress', () => {
    let courses = [
      {
        courseId: 1,
        code: 'cs',
        name: 'C#',
        icon: 'cs.svg',
        sections: [
          { sectionId: 1, code: 'overview', name: 'Overview', userSectionId: 1 },
          { sectionId: 2, code: 'intro', name: 'Introduction to C#' }
        ]
      },
      {
        courseId: 2,
        code: 'java',
        name: 'Java',
        icon: 'java.svg',
        sections: [
          { sectionId: 3, code: 'overview', name: 'Overview', userSectionId: 3 },
          { sectionId: 4, code: 'intro', name: 'Introduction to Java' }
        ]
      }
    ];

    let expected_progress = [
      {
        courseId: 1,
        code: 'cs',
        name: 'C#',
        icon: 'cs.svg',
        completedSections: 1,
        totalSections: 2,
        nextSectionCode: 'intro',
        nextSectionName: 'Introduction to C#'
      },
      {
        courseId: 2,
        code: 'java',
        name: 'Java',
        icon: 'java.svg',
        completedSections: 1,
        totalSections: 2,
        nextSectionCode: 'intro',
        nextSectionName: 'Introduction to Java'
      }
    ];

    let actual_progress = selectCourseProgress.resultFunc(courses);

    expect(actual_progress).to.deep.equal(expected_progress);
  });

  it('should return active prescribed courses from state', () => {
    let course1 = { courseId: 1, dateCompleted: new Date(), progress: 100 };
    let course2 = { courseId: 2, dateCompleted: null };
    let course3 = { courseId: 3, dateCompleted: null };
    let allCourses = [course1, course2, course3];
    let prescribedCourses = [course1, course3];

    let courses = selectActivePrescribedCourses.resultFunc(allCourses, prescribedCourses);

    expect(courses).to.deep.equal([{ ...course3, progress: 0 }]);
  });
});
