export const USER_ANSWER_ERROR_UPDATED = 'USER_ANSWER_ERROR_UPDATED';

export const userAnswerErrorUpdated = (hasError) => {
    return {
        type: USER_ANSWER_ERROR_UPDATED,
        hasError
    };
}