const fetch = require('node-fetch');

const batch = async (endpoint, message = {}) => {
  const body = JSON.stringify(message);
  const server = process.env.SERVER_URL || `http://localhost:3001`;

  const response = await fetch(`${server}/batch/${endpoint}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) throw Error(await response.text());
};

module.exports = { batch };
