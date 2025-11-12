import sinon from 'sinon';
import level_up_service from '../../../../src/services/level-up.service';

export const fetch_level_ups_stub = sinon.stub(level_up_service, 'getLevelUps');