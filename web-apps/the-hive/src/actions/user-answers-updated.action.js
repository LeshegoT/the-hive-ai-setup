export const USER_ANSWERS_UPDATED = 'USER_ANSWERS_UPDATED';

export const userAnswersUpdated = (user) => {
    return {
        type: USER_ANSWERS_UPDATED,
        user
    };
}