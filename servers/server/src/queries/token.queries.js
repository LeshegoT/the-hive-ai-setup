const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
// TODO: This polyfill can probably be removed once we upgrade to a new version of Node that has the Crypto and WebCrypto API built in
const { Crypto } = require('@peculiar/webcrypto');
const crypto = new Crypto();

const get_user_token = async (tx, upn) => {
  const q = `
        select Token from Profiles
        where UserPrincipleName = @UPN
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_user_token');

  if (result.recordset.length < 1) return 'No record found';

  return fixCase(result.recordset)[0].token;
};

const insert_user_token = async (tx, upn) => {
  const token = generateGUID();

  const q = `
        update Profiles set Token = @Token
        where UserPrincipleName = @UPN;

        select Token from Profiles
        where UserPrincipleName = @UPN
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('UPN', upn)
    .input('Token', token)
    .timed_query(q, 'get_user_token');
  return fixCase(result.recordset)[0].token;
};

const get_upn_from_token = async (token) => {
  const q = `
        select UserPrincipleName from Profiles
        where Token = @Token
    `;

  const connection = await db();
  const result = await connection
    .input('Token', token)
    .timed_query(q, 'get_upn_from_token');
  return fixCase(result.recordset)[0].userPrincipleName;
};

const insert_profile_record_with_token = async (tx, upn) => {
  const token = generateGUID();

  const q = `
        insert into Profiles
        (
            UserPrincipleName,
            CreatedDate,
            Token
        )
        values
        (
            LOWER(@UPN),
            getdate(),
            @Token
        );

        select Token from Profiles
        where UserPrincipleName = @UPN
    `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('UPN', upn)
    .input('Token', token)
    .timed_query(q, 'get_user_token');
  return fixCase(result.recordset)[0].token;
};

const generateGUID = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

module.exports = {
  get_user_token,
  insert_user_token,
  get_upn_from_token,
  insert_profile_record_with_token,
};
