import {VOTING_OPTIONS_RECEIVED, votingOptionsReceived} 
from '../../../src/actions/voting-options-received.action';

import { expect } from '@open-wc/testing';

describe('Action - VOTING_OPTIONS_RECEIVED', () => {
    it('should return a new action', async () => {
        let votingOptions = [1,2,3];

        let action = votingOptionsReceived(votingOptions);

        expect(action.type).to.equal(VOTING_OPTIONS_RECEIVED);
        expect(action).to.deep.equal({
          type: VOTING_OPTIONS_RECEIVED,
          votingOptions
        });
    });
});