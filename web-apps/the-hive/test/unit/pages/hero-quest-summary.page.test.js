import { html, fixture, expect } from '@open-wc/testing';
import { fetch_heroes_stub } from '../shared/stubs/hero.service.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

import '../../../src/pages/hero-quest-summary.page';

describe('Page - Hero Quest Summary',() => {

    after(() => {
        fetch_heroes_stub.reset();
        auth_service_stubs.getUserPrincipleName.reset();
    });

    auth_service_stubs.uses_select_hero('test@bbd.co.za');

    it('should initialize correctly', async () => {
        let el = await fixture(
            html`<e-hero-quest-summary></e-hero-quest-summary>`
        );

        expect(el).to.be.ok;
        expect(fetch_heroes_stub.called).to.be.ok;
    });

    it('should render existing quests if they exist', async () =>{
        let startDate = '2019-01-01 02:00';
        let endDate = '2020-01-01 02:00';
        let lastActive = '2020-01-01 02:00';

        let state = {
          heroes: {
            all: [
              {
                questId: 1,
                specialisationId: 1,
                questTypeId: 1,
                startDate,
                endDate,
                lastActive,
                status: 'in-progress',
              },
              {
                questId: 2,
                specialisationId: 2,
                questTypeId: 2,
                startDate,
                endDate,
                lastActive,
                status: 'paused',
              },
              {
                questId: 3,
                specialisationId: 3,
                questTypeId: 3,
                startDate,
                endDate,
                lastActive,
                status: 'in-progress',
              },
            ],
            existingQuest: {
              questId: 4,
              specialisationId: 3,
              questTypeId: 3,
              startDate,
              endDate,
              lastActive,
              status: 'in-progress',
            },
          },

          referenceData: {
            specialisations: [{ specialisationId: 1 }, { specialisationId: 2 }, { specialisationId: 3 }],
            questTypes: [{ questTypeId: 1 }, { questTypeId: 2 }, { questTypeId: 3 }],
          },

          notifications: { all: [{ questId: 2, resolved: false }] },
        };

        let el = await fixture(
            html`
            <e-hero-quest-summary></e-hero-quest-summary>
            `
        );

        el.stateChanged(state);

        expect(el).to.be.ok;
        expect(el.existingQuest).to.be.ok;
        expect(el.existingQuest.questId).to.equal(4);
        expect(el.renderExistingQuestError()).to.not.equal(html``);
    });

    it('should render guide requests if they exist',async () => {
        let startDate = '2019-01-01 02:00';
        let endDate = '2020-01-01 02:00';
        let lastActive = '2020-01-01 02:00';

        let state = {
          heroes: {
            all: [
              {
                questId: 1,
                specialisationId: 1,
                questTypeId: 1,
                startDate,
                endDate,
                lastActive,
                status: 'in-progress',
              },
              {
                questId: 2,
                specialisationId: 2,
                questTypeId: 2,
                startDate,
                endDate,
                lastActive,
                status: 'paused',
              },
              {
                questId: 3,
                specialisationId: 3,
                questTypeId: 3,
                startDate,
                endDate,
                lastActive,
                status: 'in-progress',
              },
            ],
            existingQuest: {
              questId: 4,
              specialisationId: 3,
              questTypeId: 3,
              startDate,
              endDate,
              lastActive,
              status: 'in-progress',
            },
            guideRequests: [{ guideRequestId: 1, requestStatusType: 'PENDING', guideUserPrincipleName: 'test@bbd.co.za' }],
          },

          referenceData: {
            specialisations: [{ specialisationId: 1 }, { specialisationId: 2 }, { specialisationId: 3 }],
            questTypes: [{ questTypeId: 1 }, { questTypeId: 2 }, { questTypeId: 3 }],
          },

          notifications: { all: [{ questId: 2, resolved: false }] },
        };

        let el = await fixture(
          html`
            <e-hero-quest-summary></e-hero-quest-summary>
          `
        );

        el.stateChanged(state);

        expect(el).to.be.ok;
        expect(el.guideRequests).to.be.ok;
        expect(el.renderGuideRequests()).to.not.equal(html``);
    });
});