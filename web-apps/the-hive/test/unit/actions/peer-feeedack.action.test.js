import {
  FEEDBACK_RECEIVED,
  feedbackReceived
} from '../../../src/actions/peer-feedback.action';

import { expect } from '@open-wc/testing';

describe('Action - FEEDBACK_RECEIVED', () => {
  it('returns an new feedback action', async () => {
    let messages = [
        {
            messages: [
                {
                    code:"feedback",
                    createdByUserPrincipleName:"upn@bbd.co.za",
                    creationDate:"2022-01-16T14:38:14.893Z",
                    heroUserPrincipleName:"upn@bbd.co.za",
                    messageId:4822,
                    published:false,
                    reply:null,
                    text:"redux us acting up :("
                }
            ],
        }
];

    const action = feedbackReceived(messages);

    expect(action.type).to.equal(FEEDBACK_RECEIVED);
    expect(action).to.deep.equal({
      type: FEEDBACK_RECEIVED,
      messages
    });
  });
});
