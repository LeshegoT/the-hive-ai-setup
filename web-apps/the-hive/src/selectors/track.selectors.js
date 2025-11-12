import { createSelector } from 'reselect';
import { selectCourses, selectAllPrescribedCourses } from './course.selectors';

export const selectAllTracks = (state) => state.tracks.all;

const mapCourses = (track, courses) => {
  if (!courses || !courses.length) return [];

  let mappedCourses =  track.courseIds.map(id => courses.find((course) => !!course && course.courseId === id)).filter(tc => !!tc);
  return mappedCourses;
}

export const selectTracks = createSelector(
  selectAllTracks,
  selectCourses,
  selectAllPrescribedCourses,
  (tracks, courses, prescribedCourses) =>{
    const isPrescribed = (course) =>{
      if(!prescribedCourses) return false;
      return (!!prescribedCourses.find( c => c.courseId === course.courseId));
    } 
    const hasPrescribedCourse = (track) => {
      if( !track || !track.courses ) return false;
      return (!!(track.courses.filter( c => isPrescribed(c)).length));
    } 

    return tracks.map((track) => ({
      ...track,
      courses: mapCourses(track, courses) 
    })).sort((a, b) =>{
      if (hasPrescribedCourse(a) && !hasPrescribedCourse(b)) {
        return -1;
      }
      if (!hasPrescribedCourse(a) && hasPrescribedCourse(b)) {
        return 1;
      }
      return 0;
    });
  }
);