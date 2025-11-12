export const selectAllParticipatedRaffles = (state) => state.raffle.allRaffles;
export const selectRaffleState = (state) => state.raffle.raffleState;
export const selectActiveRaffle = (state) => state.raffle.raffle;
export const selectRaffleParticipants = (state) => state.raffle.participants;
export const selectRaffleWinner = (state) => state.raffle.winner;
export const selectRaffleEntryPrice = (state) => state.raffle.price;
