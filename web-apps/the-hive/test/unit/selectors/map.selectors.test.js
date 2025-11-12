import { expect } from '@open-wc/testing';
import { selectMapMission } from '../../../src/selectors/map.selectors';

describe('Selector - Map Mission', () => {
  it('should return undefined if state does not contain map', () => {
      expect(selectMapMission({})).to.be.undefined
  });
  it('should return undefined if state does conntain map but no mission', () => {
    expect(selectMapMission({map:{}})).to.be.undefined
  });
  it('should return the mission if the state does contain a map and mission', () => {
    let val = "A mission value"
    expect(selectMapMission({map:{mission:val}})).to.equal(val);
  });
});