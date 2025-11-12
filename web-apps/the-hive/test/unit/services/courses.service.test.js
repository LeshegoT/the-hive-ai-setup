import { expect } from '@open-wc/testing';
import { CoursesService } from '../../../src/services/courses.service';
import sinon from 'sinon';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { COURSES_RECEIVED } from '../../../src/actions/courses-received.action';
import { USER_PRESCRIBED_COURSES_RECEIVED } from '../../../src/actions/user-prescribed-courses-received.action';

describe('Service - Courses', () => {
  let coursesService;
  let dispatch_spy;

  before(() => {
    coursesService = new CoursesService();
    coursesService._store=new StoreStub();
    dispatch_spy = sinon.spy(coursesService.store, 'dispatch');
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
    expect(coursesService.config).to.be.ok;
    expect(coursesService.store).to.be.ok;
  });

  describe('getCourses', () => {
    let courses = [];

    before(() => fetch_stub_returns_json(courses));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: COURSES_RECEIVED,
        courses
      };

      await coursesService.getCourses();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('getPrescribedTraining', () => {
    let courses = [];

    before(() => fetch_stub_returns_json(courses));

    after(() => fetch_stub.reset());

    it('should dispatch an action', async () => {
      let expected_action = {
        type: USER_PRESCRIBED_COURSES_RECEIVED,
        courses
      };

      await coursesService.getPrescribedTraining();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('completePrescribed training', () => {
    let courses = [];

    before(() => fetch_stub_returns_json(courses));

    after(() => fetch_stub.reset());

    it('should not throw an error', async () => {
      let response = await coursesService.completePrescribedTraining();

      expect(response).to.be.ok;
    });
  });
});
