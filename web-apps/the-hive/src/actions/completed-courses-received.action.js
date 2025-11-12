export const USER_COMPLETED_COURSES_RECEIVED = 'USER_COMPLETED_COURSES_RECEIVED';

export const completedCoursesReceived = (courses) => {
  return {
    type: USER_COMPLETED_COURSES_RECEIVED,
    courses,
  };
};
