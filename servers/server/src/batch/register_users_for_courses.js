const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');

const { unregistered_user, register_user } = require('../queries/course.queries');

module.exports = router.post(
  '/register-user-for-courses',
  handle_errors(async (req, res) => {
    while (true) {
      const user = await unregistered_user();

      if (!user) break;
      const { userPrincipleName, courseId } = user;
      await register_user(userPrincipleName, courseId);
    }

    res.send('Successful');
  })
);
