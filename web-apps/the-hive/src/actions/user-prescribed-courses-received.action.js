export const USER_PRESCRIBED_COURSES_RECEIVED = 'USER_PRESCRIBED_COURSES_RECEIVED';

export const userPrescribedCoursesReceived = (courses) => {
  return {
    type: USER_PRESCRIBED_COURSES_RECEIVED,
    courses
  };
};
