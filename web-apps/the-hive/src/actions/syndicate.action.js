export const SYNDICATE_FORMATION_DETAILS_RECEIVED = 'SYNDICATE_FORMATION_DETAILS_RECEIVED';
export const SYNDICATE_FORMATIONS_RECEIVED = 'SYNDICATE_FORMATIONS_RECEIVED';

export const syndicateFormationDetailsReceived = (formationDetails) => {
    return {
        type: SYNDICATE_FORMATION_DETAILS_RECEIVED,
        formationDetails
    };
}

export const syndicateFormationsReceived = (formations) => {
    return {
        type: SYNDICATE_FORMATIONS_RECEIVED,
        formations
    };
}
