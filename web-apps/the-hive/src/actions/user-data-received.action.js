export const USER_DATA_RECEIVED = 'USER_DATA_RECEIVED';

export const userDataReceived = (userData) => {
  return {
    type: USER_DATA_RECEIVED,
    ...userData
  };
};
