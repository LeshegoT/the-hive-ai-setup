export const AVATAR_PARTS_CHANGED = 'AVATAR_PARTS_CHANGED';

export const avatarPartsChanged = (parts) => {
    return {
        type: AVATAR_PARTS_CHANGED,
        parts
    };
}