const gremlin = require('gremlin');
const {parseIfSetElseDefault} = require('@the-hive/lib-core');

/**
* @type gremlin.driver.Client
*/
let client = undefined;
if(parseIfSetElseDefault('SKILLS_ENABLED', false)){
  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
    `/dbs/${process.env.GREMLIN_DATABASE}/colls/${process.env.GREMLIN_COLLECTION}`,
    process.env.GREMLIN_KEY
  );
  client = new gremlin.driver.Client(process.env.GREMLIN_ENDPOINT, {
    authenticator,
    traversalsource: 'g',
    rejectUnauthorized: true,
    mimeType: 'application/vnd.gremlin-v2.0+json',
  });

  client.open();
} else {
  // Skills is not enabled so don't connect to the DB
}
module.exports = { client };
