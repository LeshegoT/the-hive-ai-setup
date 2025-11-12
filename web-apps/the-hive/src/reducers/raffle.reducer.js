import {
  RAFFLE_RECEIVED,
  RAFFLE_STATE_UPDATED,
  RAFFLE_PARTICIPANT_RECEIVED,
  RAFFLE_PARTICIPANTS_RECEIVED,
  RAFFLE_WINNER_RECEIVED,
  RAFFLE_ENTRY_PRICE_RECEIVED,
} from '../actions/raffle.action';

const INITIAL_STATE = {
  allRaffles: [] ,
  raffleState: undefined,
  raffle: undefined, 
  participants: [],
  winner: undefined,
  price: undefined,
};

export const raffle = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case RAFFLE_WINNER_RECEIVED:
      return {
        ...state,
        winner: action.winner,
      };
    case RAFFLE_RECEIVED:
      return {
        ...state,
        raffle: action.raffle,
      };
    case RAFFLE_STATE_UPDATED:
      return {
        ...state,
        raffleState: action.raffleState,
      };
    case RAFFLE_PARTICIPANT_RECEIVED:
      return {
        ...state,
        allRaffles: action.allRaffles,
      };
    case RAFFLE_PARTICIPANTS_RECEIVED:
        return {
          ...state,
          participants: action.participants,
        };
    case RAFFLE_ENTRY_PRICE_RECEIVED:
        return {
          ...state,
          price: action.price,
        };
    default:
      return state;
  }
};
