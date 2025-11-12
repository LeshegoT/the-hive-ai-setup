export const USER_VOTES_RECEIVED = 'USER_VOTES_RECEIVED';

export const userVotesReceived = (userVotes) => {
    return {
        type: USER_VOTES_RECEIVED,
        userVotes
    };
};
