export const TRACKS_RECEIVED = 'TRACKS_RECEIVED';

export const tracksReceived = (tracks) => {
    return {
        type: TRACKS_RECEIVED,
        tracks
    };
}