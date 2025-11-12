export const COURSES_RECEIVED = 'COURSES_RECEIVED';

export const coursesReceived = (courses) => {
  return {
    type: COURSES_RECEIVED,
    courses
  };
};
