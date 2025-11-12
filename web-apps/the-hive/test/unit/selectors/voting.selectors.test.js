import { expect } from '@open-wc/testing';
import { selectUserVotes, selectVotingEvent, selectVotingOptions } from '../../../src/selectors/voting.selectors';

describe('Selector - user votes', () => {
  it('should return user votes', () => {
    let state = {
      userVotes: {
        user: [{ votingOptionId: 1, rating: 2 }, { votingOptionId: 1, rating: 2}]
      }
    };

    let votes = selectUserVotes(state);

    expect(votes).to.deep.equal(state.userVotes.user);
  });

  it('should return voting options', () => {
    let state = {
      votingOptions: {
        all: [
          {
            votingOptionId:1,
            votingEventId:1,
            name:"Team Francois",
            description:"Team Francois is made up of Jason, Mzee, Ngoni, and Zanrich."
          }, 
          { votingOptionId:2,
            votingEventId:1,
            name:"Team Sandile",
            description:"Team Sandile is made up of Dane, Emma, and Nkosinathi."
          }
        ]
      }
    };

    let votes = selectVotingOptions(state);

    expect(votes).to.deep.equal(state.votingOptions.all);
  });
  it('should return voting event details', () => {
    let state = {
      votingEvent: {
        details:
          {
            votingEventId:1,
            eventName:"Event One",
          }
      }
    };

    let eventDetails = selectVotingEvent(state);

    expect(eventDetails).to.deep.equal(state.votingEvent.details);
  });
});
