import { expect } from '@open-wc/testing';
import { selectRaffleState, selectRaffleWinner, selectActiveRaffle } from '../../../src/selectors/raffle.selectors';
import { RAFFLE_RECEIVED } from '../../../actions/raffle.action';

describe('Selector - raffles', () => {
  it('should return raffle state', () => {
    let state = {
      raffleState: RAFFLE_RECEIVED
    };

    let raffleState = selectRaffleState(state);

    expect(raffleState).to.deep.equal(state.raffleState);
  });

  it('should return raffle winner', () => {
    let state = {
      winner: {
        winner: 1 ,
        participants: ["testingUser1", "testingUser2"],
        total: 100
      },
    };

    let winner = selectRaffleWinner(state);

    expect(winner).to.deep.equal(state.winner);
  });


  it('should return active raffle', () => {
    let state = {
      raffle : {
        raffleId: 1 , 
        description: "Tester Raffle",
        createdBy: "Hive",
        spinDate: "2022-09-20T11:10:00.000Z"
      }
    };

    let raffle = selectActiveRaffle(state);

    expect(raffle).to.deep.equal(state.raffle);
  });
});
