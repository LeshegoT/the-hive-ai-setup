import { expect } from '@open-wc/testing';
import {
  selectActiveParts,
  selectAllClaimParts,
  selectAllParts,
  selectAvailableParts,
  selectAvatarBody,
  selectClaimParts,
  selectCurrentAvatarBody,
  selectCurrentUserParts,
  selectNumberOfPartsAvailable,
  selectUserParts,
  selectAllLevelParts
} from '../../../src/selectors/avatar.selectors';

describe('Selector - Avatar', () => {
  it('should return active parts', () => {
    let userParts = {
      accessory: [{ partId: 1, partType: 'accessory', active: true }],
      left: [{ partId: 2, partType: 'left', active: true }],
      pattern: [{ partId: 3, partType: 'pattern', active: true }],
      right: [{ partId: 4, partType: 'right', active: true }]
    };

    let actual = selectActiveParts.resultFunc(userParts);

    expect(actual).to.deep.equal({
      accessory: userParts.accessory[0],
      left: userParts.left[0],
      pattern: userParts.pattern[0],
      right: userParts.right[0]
    });
  });

  it('should return all parts', () => {
    let state = {
      avatar: {
        all: []
      }
    };

    let actual = selectAllParts(state);

    expect(actual).to.deep.equal(state.avatar.all);
  });

  it('should select all parts for', () => {
    let allParts = [
      { partId: 1, levelId: 1 },
      { partId: 2, levelId: 2 }
    ];
    let avatarBody = { levelId: 2 };

    let actual = selectAllLevelParts.resultFunc(allParts, avatarBody);

    expect(actual).to.deep.equal([{ partId: 2, levelId: 2 }]);
  });

  it('should return current avatar body', () => {
    let state = {
      avatar: {
        body: []
      }
    };

    let actual = selectCurrentAvatarBody(state);

    expect(actual).to.deep.equal(state.avatar.body);
  });

  it('should return current user parts', () => {
    let state = {
      avatar: {
        parts: []
      }
    };

    let actual = selectCurrentUserParts(state);

    expect(actual).to.deep.equal(state.avatar.parts);
  });

  it('should select avatar body', () => {
    let currentBody = null;
    let levels = null;

    let actual = selectAvatarBody.resultFunc(currentBody, levels);

    currentBody = { levelId: 1 };
    levels = [{ levelId: 1 }];

    actual = selectAvatarBody.resultFunc(currentBody, levels);

    expect(actual).to.deep.equal({ ...currentBody, level: levels[0] });
  });

  it('should select user parts', () => {
    let allParts = [
      { partId: 1, levelId: 1 },
      { partId: 2, levelId: 2 }
    ];
    let userParts = [{ partId: 2, partType: 'accessory', levelId: 2 }];
    let avatarBody = { levelId: 2 };

    let actual = selectUserParts.resultFunc(allParts, userParts, avatarBody);

    expect(actual).to.deep.equal({
      accessory: userParts,
      left: [],
      pattern: [],
      right: []
    });
  });

  it('should select number of parts available', () => {
    let state = {
      avatar: {
        numberOfPartsAvailable: 10
      }
    };

    let actual = selectNumberOfPartsAvailable(state);

    expect(actual).to.deep.equal(10);
  });

  it('should select all claim parts', () => {
    let state = {
      avatar: {
        claimParts: [{ partId: 1 }]
      }
    };

    let actual = selectAllClaimParts(state);

    expect(actual).to.deep.equal(state.avatar.claimParts);
  });

  it('should select claimParts', () => {
    let claimParts = [{ partId: 1 }];
    let allParts = [{ partId: 1 }];

    let actual = selectClaimParts.resultFunc(claimParts, allParts);

    expect(actual).to.deep.equal([{ partId: 1 }]);
  });

  it('should select available parts', () => {
    let allParts = [{ partId: 1 }, { partId: 2, partType: 'accessory' }];
    let userParts = [{ partId: 1 }];
    let claimParts = [{ partId: 2, partType: 'accessory' }];
    let partsObject = { accessory: [], left: [], pattern: [], right: [] };

    let actual = selectAvailableParts.resultFunc(allParts, userParts, claimParts);

    expect(actual).to.deep.equal({
      ...partsObject,
      accessory: [{ ...claimParts[0], selectable: claimParts[0] }]
    });
  });
});
