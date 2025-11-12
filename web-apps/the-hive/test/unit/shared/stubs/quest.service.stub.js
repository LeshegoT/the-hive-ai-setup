import sinon from 'sinon';
import quest_service from '../../../../src/services/quest.service';

export const fetch_hero_quests_stub = sinon.stub(quest_service, 'getHeroQuests');
export const markQuestComplete = sinon.stub(quest_service, 'markQuestComplete');
export const markQuestAbandoned = sinon.stub(quest_service, 'markQuestAbandoned');
export const markQuestPaused = sinon.stub(quest_service, 'markQuestPaused');