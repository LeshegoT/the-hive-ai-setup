import { html, fixture, expect } from '@open-wc/testing';

import '../../../src/components/mission-name.component';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

describe('Component - Mission Name', () => {
  let base_mission = {
    missionId: 1,
    type: {
      icon: 'something.svg',
      code: 'video'
    }
  };
  let hero = 'test@bbd.co.za';

  auth_service_stubs.uses_select_hero(hero);

  it('should initialise properly', async () => {
    let el = await fixture(
      html`
        <e-mission-name .mission="${base_mission}"></e-mission-name>
      `
    );
    el.stateChanged({ app: {} });

    expect(el).to.be.ok;
    expect(el.mission).to.deep.equal(base_mission);
    expect(el).shadowDom.to.equal(`
      <a href="/hero/${btoa(hero)}/mission/${base_mission.missionId}">
        <e-hex-name></e-hex-name>
      </a>
    `);
  });

  it('should show deleted mission correctly', async () => {
    let mission = {
      ...base_mission,
      deleted: true
    };
    let el = await fixture(
      html`
        <e-mission-name .mission="${mission}"></e-mission-name>
      `
    );

    expect(el).to.be.ok;
    expect(el.mission).to.deep.equal(mission);
    expect(el).shadowDom.to.equal(`
      <div>
        <e-hex-name></e-hex-name>
      </div>
    `);
  });

  it('should show completed mission correctly', async () => {
    let mission = {
      ...base_mission,
      dateCompleted: new Date()
    };
    let el = await fixture(
      html`
        <e-mission-name .mission="${mission}"></e-mission-name>
      `
    );
    el.hero = hero;

    expect(el).to.be.ok;
    expect(el.mission).to.deep.equal(mission);
    expect(el).shadowDom.to.equal(`
      <a href="/hero/${btoa(hero)}/mission/${mission.missionId}">
        <e-hex-name></e-hex-name>
      </a>
    `);
  });

  describe('course missions', () => {
    it('should show course mission correctly when not started', async () => {
      let mission = {
        ...base_mission,
        type: {
          code: 'course'
        },
        course: {
          completedSections: 0,
          totalSections: 0,
          code: 'cs',
          icon: 'something.svg'
        }
      };
      let el = await fixture(
        html`
          <e-mission-name .mission="${mission}"></e-mission-name>
        `
      );

      expect(el).to.be.ok;
      expect(el.mission).to.deep.equal(mission);
      expect(el).shadowDom.to.equal(`
        <a href="/course/${mission.course.code}">
            <e-hex-name></e-hex-name>
        </a>
      `);
    });

    it('should show course mission correctly when not complete', async () => {
      let mission = {
        ...base_mission,
        type: {
          code: 'course'
        },
        course: {
          completedSections: 1,
          totalSections: 3,
          code: 'cs',
          nextSectionCode: 'oo',
          icon: 'something.svg'
        }
      };
      let el = await fixture(
        html`
          <e-mission-name .mission="${mission}"></e-mission-name>
        `
      );

      expect(el).to.be.ok;
      expect(el.mission).to.deep.equal(mission);
      expect(el).shadowDom.to.equal(`
        <a href="/course/${mission.course.code}/section/${mission.course.nextSectionCode}">
            <e-hex-name></e-hex-name>
        </a>
      `);
    });

    it('should show course mission correctly when complete', async () => {
      let mission = {
        ...base_mission,
        type: {
          code: 'course'
        },
        course: {
          completedSections: 3,
          totalSections: 3,
          code: 'cs',
          icon: 'something.svg'
        }
      };
      let el = await fixture(
        html`
          <e-mission-name .mission="${mission}"></e-mission-name>
        `
      );

      expect(el).to.be.ok;
      expect(el.mission).to.deep.equal(mission);
      expect(el).shadowDom.to.equal(`
        <a href="/course/${mission.course.code}">
            <e-hex-name></e-hex-name>
        </a>
    `);
    });
  });
});
