import sinon from 'sinon';
import hero_service from '../../../../src/services/hero.service';

export const fetch_heroes_stub = sinon.stub(hero_service, 'getHeroes'); 