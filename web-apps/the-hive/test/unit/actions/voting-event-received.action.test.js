import { VOTING_EVENT_RECEIVED, votingEventReceived} 
from '../../../src/actions/voting-event-received.action';

import { expect } from '@open-wc/testing';

describe('Action - VOTING_EVENT_RECEIVED', () => {
    it('should return a new action', () => {
        let event = {name:'some event'}

        let action = votingEventReceived(event);

        expect(action.type).to.equal(VOTING_EVENT_RECEIVED);
        expect(action).to.deep.equal({
          type: VOTING_EVENT_RECEIVED,
          event
        });
    }); 
});