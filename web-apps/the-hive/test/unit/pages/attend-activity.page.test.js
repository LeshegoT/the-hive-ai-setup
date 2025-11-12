import sinon from 'sinon';
import { html, fixture, expect } from '@open-wc/testing';
import { fetch_level_ups_stub } from '../shared/stubs/level-up.service.stub';
import { convertMarkdownToHtml_stub } from '../shared/stubs/markdown.service.stub';
import { navigate_stub } from '../shared/stubs/navigation.service.stub';
import levelUpService from '../../../src/services/level-up.service';

describe('Page - Attend Activity', () => {
  before(async () => {
    await import('../../../src/pages/attend-activity.page');
  });

  after(() => {
    fetch_level_ups_stub.reset();
    navigate_stub.reset();
  });

  beforeEach(() => {
    convertMarkdownToHtml_stub.returns('markdown');
  });

  afterEach(async () => {
    convertMarkdownToHtml_stub.reset();
  });

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-attend-activity></e-attend-activity>
      `
    );
    expect(el).to.be.ok;
    expect(fetch_level_ups_stub.called).to.be.ok;
  });

  it('should load level-up and activity correctly', async () => {
    let el = await fixture(
      html`
        <e-attend-activity></e-attend-activity>
      `
    );

    el.stateChanged({
      app: { routeData: [1, 1] },
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }],
        user: []
      },
      levelUpActivities: {
        all: [
          { levelUpId: 1, levelUpActivityId: 1 },
          { levelUpId: 2, levelUpActivityId: 2 }
        ],
        user: []
      },
      referenceData: { levelUpActivityTypes: [] },
      courses: { all: [] },
      sections: { all: [], user: [] },
      levelUpUsers: { all: [] },
      questions: { all: [] }
    });

    expect(el.levelUp).to.be.ok;
    expect(el.activity).to.be.ok;
  });

  it('should navigate away if level-up id does not match', async () => {
    let el = await fixture(
      html`
        <e-attend-activity></e-attend-activity>
      `
    );

    el.stateChanged({
      app: { routeData: [1, 2] },
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }],
        user: []
      },
      levelUpActivities: {
        all: [
          { levelUpId: 1, levelUpActivityId: 1 },
          { levelUpId: 2, levelUpActivityId: 2 }
        ],
        user: []
      },
      referenceData: { levelUpActivityTypes: [] },
      courses: { all: [] },
      sections: { all: [], user: [] },
      levelUpUsers: { all: [] },
      questions: { all: [] }
    });

    expect(el.levelUp).to.be.ok;
    expect(el.activity).to.be.ok;
    expect(navigate_stub).to.have.been.called;
  });

  it('should load activity description correctly', async () => {
    let el = await fixture(
      html`
        <e-attend-activity></e-attend-activity>
      `
    );

    el.stateChanged({
      app: { routeData: [1, 1] },
      levelUps: {
        all: [{ levelUpId: 1 }, { levelUpId: 2 }],
        user: []
      },
      levelUpActivities: {
        all: [
          { levelUpId: 1, levelUpActivityId: 1, levelUpActivityTypeId: 1 },
          { levelUpId: 2, levelUpActivityId: 2, levelUpActivityTypeId: 2 }
        ],
        user: []
      },
      referenceData: {
        levelUpActivityTypes: [{ levelUpActivityTypeId: 1 }, { levelUpActivityTypeId: 2 }]
      },
      courses: { all: [] },
      sections: { all: [], user: [] },
      levelUpUsers: { all: [] },
      questions: { all: [] }
    });

    expect(el.levelUp).to.be.ok;
    expect(el.activity).to.be.ok;

    el.updated({ has: () => false });

    expect(convertMarkdownToHtml_stub.called).to.be.ok;
    expect(el.description).to.equal('markdown');
  });

  describe('attend tests', () => {
    let markActivityAsAttended_stub;

    before(() => {
      markActivityAsAttended_stub = sinon.stub(levelUpService, 'markActivityAsAttended');
    });

    after(() => {
      markActivityAsAttended_stub.reset();
    });

    it('should mark user as attended if not and time correct', async () => {
      let el = await fixture(
        html`
          <e-attend-activity></e-attend-activity>
        `
      );

      el.stateChanged({
        app: { routeData: [1, 1] },
        levelUps: {
          all: [{ levelUpId: 1 }, { levelUpId: 2 }],
          user: []
        },
        levelUpActivities: {
          all: [
            {
              levelUpId: 1,
              levelUpActivityId: 1,
              levelUpActivityTypeId: 1
            },
            { levelUpId: 2, levelUpActivityId: 2, levelUpActivityTypeId: 2 }
          ],
          user: []
        },
        referenceData: {
          levelUpActivityTypes: [
            { levelUpActivityTypeId: 1 },
            { levelUpActivityTypeId: 2 }
          ]
        },
        courses: { all: [] },
        sections: { all: [], user: [] },
        levelUpUsers: { all: [] },
        questions: { all: [] }
      });

      expect(el.levelUp).to.be.ok;
      expect(el.activity).to.be.ok;

      el.updated({ has: () => true });

      expect(markActivityAsAttended_stub).to.have.been.called;
    });
  });
});
