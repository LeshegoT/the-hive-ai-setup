export const HEROES_RECEIVED = 'HEROES_RECEIVED';

export const heroesReceived = (heroes) => {
    return {
        type: HEROES_RECEIVED,
        heroes
    };
}