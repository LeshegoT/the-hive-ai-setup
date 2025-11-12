const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const fetch = require('node-fetch');
const { getMsalAccessToken } = require('@the-hive/lib-core');

router.get(
  '/searchUser',
  handle_errors(async (req, res) => {
    const access_token = await getMsalAccessToken();
    const emails = [];
    await fetch(
      `https://graph.microsoft.com/v1.0/users/?$filter=startswith(userPrincipalName,'${req.query.searchText}')`,
      {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        for (let i = 0; i < result['value'].length; i++) {
          emails.push(result['value'][i]['userPrincipalName']);
        }
        res.json(emails);
      });
  })
);

module.exports = router;
