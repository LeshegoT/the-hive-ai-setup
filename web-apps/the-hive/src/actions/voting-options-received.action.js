export const VOTING_OPTIONS_RECEIVED = 'VOTING_OPTIONS_RECEIVED';

export const votingOptionsReceived = (votingOptions) => {
    return {
        type: VOTING_OPTIONS_RECEIVED,
        votingOptions
    };
};
