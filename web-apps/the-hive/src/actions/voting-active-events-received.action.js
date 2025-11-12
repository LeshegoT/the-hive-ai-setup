export const VOTING_ACTIVE_EVENTS_RECEIVED = 'VOTING_ACTIVE_EVENTS_RECEIVED';

export const votingActiveEventsReceived = (votingActiveEvents) => {
    return {
        type: VOTING_ACTIVE_EVENTS_RECEIVED,
        votingActiveEvents
    };
};
