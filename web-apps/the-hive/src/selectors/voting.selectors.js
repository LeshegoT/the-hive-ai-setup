import { selectVotingEventId } from './route-data.selectors';

export const selectVotingOptions = (state) => state.votingOptions.all;
export const selectUserVotes = (state) => state.userVotes.user;
export const selectVotingEvent = (state) => state.votingEvent.details;
export const selectActiveVotingEvents = (state) => state.votingActiveEvents.all;
