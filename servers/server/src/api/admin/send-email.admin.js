const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { send } = require('../../shared/email');

router.post(
  '/email',
  handle_errors(async (req, res) => {
    const loggedInUser = res.locals.upn;
    const {
      from,
      to,
      subject,
      context,
      message,
      url,
      callToAction,
      image,
      includeATCTeam,
    } = req.body;
    const emailOptions = { callToAction, image, includeATCTeam };

    if (from === loggedInUser) {
      const sent = await send(
        from,
        to,
        subject,
        context,
        message,
        url,
        emailOptions
      );
      if (sent) {
        res.status(200).send({ message: 'email sent' });
      } else {
        res
          .status(400)
          .send({
            message: 'email not sent',
            reason: 'recipient empty or not allowed to send to recipient',
          });
      }
    } else {
      res
        .status(403)
        .send({ message: 'cannot send message on behalf of anopther user' });
    }
  })
);

module.exports = router;
