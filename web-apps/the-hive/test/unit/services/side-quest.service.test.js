import { expect } from '@open-wc/testing';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';
import { StoreStub } from '../shared/stubs/store.stub';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { SideQuestService } from '../../../src/services/side-quests.service';
import { SIDE_QUESTS_RECEIVED } from '../../../src/actions/side-quests-received.action';
import { SIDE_QUEST_REGISTERED } from '../../../src/actions/side-quest-registered.action';
import sinon from 'sinon';

describe('Service - SideQuestService', () => {
    let side_Quest_Service;
    let dispatch_spy;

    before(() => {
        side_Quest_Service = new SideQuestService();
        side_Quest_Service._store=new StoreStub();
        dispatch_spy = sinon.spy(side_Quest_Service.store, 'dispatch');
    });

    afterEach(() => dispatch_spy.resetHistory());

    it('should initialise correctly.', async () => {
        expect(side_Quest_Service.config).to.be.ok;
        expect(side_Quest_Service.store).to.be.ok;
    });

    describe('getSideQuests', async () => {
        let sideQuests = [];

        before(() => fetch_stub_returns_json(sideQuests));

        after(() => fetch_stub.reset());

        it('should get side quests', async () => {
            let expected_action = {
                type: SIDE_QUESTS_RECEIVED,
                sideQuests
            };

            await side_Quest_Service.getSideQuests();

            expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
        });
    });

    describe('getSideQuests', async () => {
        let sideQuest = {};

        auth_service_stubs.uses_select_hero('test@bbd.co.za');

        before(() => fetch_stub_returns_json(sideQuest));

        after(() => fetch_stub.reset());

        it('should get side quests', async () => {
            let sideQuestId = 1;
            let expected_action = {
                type: SIDE_QUEST_REGISTERED,
                sideQuest
            };

            await side_Quest_Service.registerForSideQuest(sideQuestId);

            expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
        });
    });
});