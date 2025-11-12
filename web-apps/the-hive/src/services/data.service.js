import tracksService from './tracks.service';
import sectionService from './sections.service';
import coursesService from './courses.service';
import referenceDataService from './reference-data.service';
import partsService from './parts.service';
import questionService from './question.service';
import tokenService from './token.service';
import peerFeedbackService from './peer-feedback.service';

export const getData = () => {
  tracksService.getTracks();
  sectionService.getSections();
  coursesService.getCourses();
  tokenService.getUserToken();
  referenceDataService.getReferenceData();
  partsService.getParts();
  questionService.getQuestionsAndAnswers();
};