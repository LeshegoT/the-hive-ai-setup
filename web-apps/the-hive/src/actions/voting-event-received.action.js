export const VOTING_EVENT_RECEIVED = 'VOTING_EVENT_RECEIVED';

export const votingEventReceived = (event) => {
    return {
        type: VOTING_EVENT_RECEIVED,
        event
    };
};
