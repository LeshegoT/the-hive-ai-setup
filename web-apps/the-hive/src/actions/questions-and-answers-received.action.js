export const QUESTIONS_AND_ANSWERS_RECEIVED = 'QUESTIONS_AND_ANSWERS_RECEIVED';

export const questionsAndAnswersReceived = (data) => {
    return {
        type: QUESTIONS_AND_ANSWERS_RECEIVED,
        ...data
    };
}