export const POINTS_RECEIVED = 'POINTS_RECEIVED';

export const pointsReceived = (points) => {
  return {
    type: POINTS_RECEIVED,
    points,
  };
};

export const POINT_TYPES_RECEIVED = 'POINT_TYPES_RECEIVED';

export const pointTypesReceived = (types) => {
  return {
    type: POINT_TYPES_RECEIVED,
    types,
  };
};
