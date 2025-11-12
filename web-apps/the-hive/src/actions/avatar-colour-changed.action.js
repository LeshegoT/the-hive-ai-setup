export const AVATAR_COLOUR_CHANGED = 'AVATAR_COLOUR_CHANGED';

export const avatarColourChanged = (red, green, blue) => {
  return {
    type: AVATAR_COLOUR_CHANGED,
    red,
    green,
    blue
  };
};
