export const EASTER_EGG_RECEIVED = 'EASTER_EGG_RECEIVED';

export const easterEggReceived = (guid, display) => {
    return {
      type: EASTER_EGG_RECEIVED,
      guid,
      display
    };
}