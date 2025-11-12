import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { StoreStub } from '../shared/stubs/store.stub';
import {   FEEDBACK_TAGS_RECEIVED,
PUBLISHED_FEEDBACK_RECEIVED,
FEEDBACK_STATE_UPDATED,
FEEDBACK_RECEIVED,
FEEDBACKS_ASSIGNED_TO_USER_RECEIVED,
USER_DISPLAY_NAME_RECEIVED,
USER_TEAM_MEMBERS_RECEIVED  } from '../../../src/actions/peer-feedback.action';
import { PeerFeedbackService } from '../../../src/services/peer-feedback.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

describe('Service - Peer Feedback', () => {
  let peerFeedbackService;
  let dispatch_spy;

  before(() => {
      peerFeedbackService = new PeerFeedbackService();
      peerFeedbackService._store = new StoreStub();
      dispatch_spy = new sinon.spy(peerFeedbackService.store, 'dispatch')
  });

  afterEach(() => dispatch_spy.resetHistory());

  it('should initialise correctly.', () => {
      expect(peerFeedbackService.config).to.be.ok;
      expect(peerFeedbackService.store).to.be.ok;
  });

  describe('getFeedbackMessages', () => {
    let messages = [];

    before(() => fetch_stub_returns_json(messages));

    after(() => fetch_stub.reset());

    it('should return feedback messages', async () => {
      let expected_action = {
          type: FEEDBACK_RECEIVED,
          messages
      };

      await peerFeedbackService.getFeedbackMessages();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('populateDisplayName', () => {
    let userDisplayName = 'upn@bbd.co.za';

    before(() => fetch_stub_returns_json(userDisplayName));

    after(() => fetch_stub.reset());

    it('should should populate displayName', async () => {
      let expected_action = {
          type: USER_DISPLAY_NAME_RECEIVED,
          userDisplayName
      };

      await peerFeedbackService.populateDisplayName(userDisplayName);

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });
  describe('peersFeedbackMessages with upn', () => {
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
    
    before(() => fetch_stub_returns_json(messages));
    
    after(() => fetch_stub.reset());
    
    it('should return the users published messages', async () => {
      let upn = 'upn@bbd.co.za';
      let expected_action = {
          type: PUBLISHED_FEEDBACK_RECEIVED,
          messages
      };

      await peerFeedbackService.peersFeedbackMessages(upn);
      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

  describe('peersFeedbackMessages without upn', () => {
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
    
    before(() => fetch_stub_returns_json(messages));
    
    after(() => fetch_stub.reset());
    
    it('should not return the users published messages', async () => {
      let upn = undefined;
      let expected_action = {
          type: PUBLISHED_FEEDBACK_RECEIVED,
          messages
      };

      await peerFeedbackService.peersFeedbackMessages(upn);
      expect(dispatch_spy.calledWith(expected_action)).to.not.be.ok;
    });
  });

  describe('populateTeamMembers', () => {
    let userTeamMembers = [];

    before(() => fetch_stub_returns_json(userTeamMembers));

    after(() => fetch_stub.reset());

    it('should populate team members', async () => {
      let expected_action = {
          type: USER_TEAM_MEMBERS_RECEIVED,
          userTeamMembers
      };

      await peerFeedbackService.populateTeamMembers();

      expect(dispatch_spy.calledWith(expected_action)).to.be.ok;
    });
  });

});