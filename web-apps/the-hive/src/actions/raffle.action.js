export const RAFFLE_STATE_UPDATED = 'RAFFLE_STATE_UPDATED';
export const RAFFLE_RECEIVED = 'RAFFLE_RECEIVED';
export const RAFFLE_PARTICIPANT_RECEIVED = 'RAFFLE_PARTICIPATED_RECEIVED';
export const RAFFLE_PARTICIPANTS_RECEIVED = 'RAFFLE_PARTICIPANTS_RECEIVED';
export const RAFFLE_WINNER_RECEIVED = 'RAFFLE_WINNER_RECEIVED';
export const RAFFLE_ENTRY_PRICE_RECEIVED = 'RAFFLE_ENTRY_PRICE_RECEIVED';

export const raffleStateUpdated = (raffleState) => {
  return {
    type: RAFFLE_STATE_UPDATED,
    raffleState,
  };
};


export const raffleWinnerReceived = (winner) => {
  return {
    type: RAFFLE_WINNER_RECEIVED,
    winner,
  };
};

export const raffleReceived = (raffle) => {
  return {
    type: RAFFLE_RECEIVED,
    raffle,
  };
};

export const rafflesParticipantReceived = (allRaffles) => {
  return {
    type: RAFFLE_PARTICIPANT_RECEIVED,
    allRaffles,
  };
};

export const raffleParticipantsReceived = (participants) => {
  return {
    type: RAFFLE_PARTICIPANTS_RECEIVED,
    participants,
  };
};

export const raffleEntryPriceReceived = (price) => {
  return {
    type: RAFFLE_ENTRY_PRICE_RECEIVED,
    price,
  };
};