import sinon from 'sinon';
import side_quest_service from '../../../../src/services/side-quests.service';

export const getSideQuests = sinon.stub(side_quest_service, 'getSideQuests');
export const registerForSideQuest = sinon.stub(side_quest_service, 'registerForSideQuest');