const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  last_month_points,
  all_points_for_hero,
  points_types,
} = require('../queries/point.queries');
const { parseLocalDate } = require('../shared/format');

router.get(
  '/lastMonthPoints',
  handle_errors(async (req, res) => {
    const { upn } = res.locals;
    const response = await last_month_points(upn);
    res.json(response);
  })
);

router.get(
  '/points',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const points = await all_points_for_hero(upn);

    if (points.length) {
      const pointsForUser = todaysPointsInformation(points);
      return res.json(pointsForUser);
    }

    const response = {
      allPoints: 0,
      todaysPoints: 0,
      totalPoints: 0,
      highScore: 0,
    };

    return res.json(response);
  })
);

router.get(
  '/pointTypes',
  handle_errors(async (req, res) => {
    const types = await points_types();
    res.json(types);
  })
);

const todaysPointsInformation = (allPoints) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysPoints = allPoints
    .filter((p) => parseLocalDate(p.createdDate) > today)
    .map((p) => parseInt(p.points))
    .reduce(function (a, b) {
      return a + b;
    }, 0);

  const totalPoints = allPoints
    .map((p) => parseInt(p.points))
    .reduce(function (a, b) {
      return a + b;
    }, 0);

  const highScore = calculateHighScore(allPoints);

  return {
    allPoints,
    todaysPoints,
    totalPoints,
    highScore,
  };
};

const calculateHighScore = (pointsData) => {
  const pointsNormal = setDatesToMidnight(pointsData);

  let startDate = pointsNormal[0].createdDate;
  let highScore = 0;

  let sum = 0;

  for (let i = 0; i < pointsNormal.length; i++) {
    if (pointsNormal[i].createdDate !== startDate) {
      startDate = pointsNormal[i].createdDate;

      if (sum > highScore) {
        highScore = sum;
      }

      sum = 0;
    }

    if (pointsNormal[i].createdDate === startDate) {
      sum += parseInt(pointsNormal[i].points);
    }
  }

  if (sum > highScore) {
    highScore = sum;
  }

  return highScore;
};

const setDatesToMidnight = (pointsData) => {
  pointsData.forEach((p) => {
    const date = parseLocalDate(p.createdDate);
    p.createdDate = date.setHours(0, 0, 0, 0);
  });
  return pointsData;
};

module.exports = router;
