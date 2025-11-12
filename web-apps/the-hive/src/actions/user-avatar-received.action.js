export const USER_AVATAR_RECEIVED = 'USER_AVATAR_RECEIVED';

export const userAvatarReceived = (avatar, parts) => {
    return {
        type: USER_AVATAR_RECEIVED,
        avatar,
        parts
    };
}