import * as module from '../../../src/selectors/route-data.selectors';

import { expect } from '@open-wc/testing';

describe('Selector - Route Data', () => {
  let route_data = {
    CourseCode: 0,
    SectionCode: 1,
    StatusCode: 1,
    MissionId: 1,
    QuestId: 0,
    SideQuestId: 0,
    LevelUpId: 0,
    LevelUpActivityTypeCode: 0,
    LevelUpActivityId: 1
  };

  for (let [selector_key, route_data_index] of Object.entries(route_data))
    it(`should select ${selector_key} correctly`, () => {
      let state = { app: { routeData: ['one', 'two'] } };
      let data = module[`select${selector_key}`](state);

      expect(data).to.be.ok;
      expect(data).to.equal(state.app.routeData[route_data_index]);
    });

  it('should fail gracefully when UPN is not encoded', () => {
    let routeData = ['not a real encoded string'];

    let upn = module.selectHeroUserPrincipleName.resultFunc(routeData);

    expect(upn).to.not.be.ok;
  });

  it('should return the UPN', () => {
    let expected_upn = 'test@bbd.co.za';
    let routeData = [btoa(expected_upn)];

    let upn = module.selectHeroUserPrincipleName.resultFunc(routeData);

    expect(upn).to.equal(expected_upn);
  });

  it('should return null when not real UPN', () => {
    let routeData = [btoa('something')];
      
    let upn = module.selectHeroUserPrincipleName.resultFunc(routeData);

    expect(upn).to.not.be.ok;
  });
});
