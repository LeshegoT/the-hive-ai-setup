import * as msal from '@azure/msal-node';
import { cacheUntilExpiry } from './cache';
import { isLocal } from './environment-utils';
import { logger } from './logger';

type TokenInfo = {
    token: string,
    expiry: Date
}

/**
 * Initialize and instance of MSAL to allow for interaction with Microsoft auth.
 *
 *
 * This function should not be exported, since it should only be called internally
 * to this module.
 */
function initMSAL() : msal.ConfidentialClientApplication {

  const {
    CLIENT_ID,
    GRAPH_API_SECRET,
    AUTHORITY_BASE,
    TENANT_ID
  } = process.env;


  const msalConfig: msal.Configuration = {
    auth: {
      clientId: CLIENT_ID,
      authority: `${AUTHORITY_BASE}${TENANT_ID}`,
      clientSecret: GRAPH_API_SECRET,
    }
  };

  if (isLocal()) {
    //set up some debug options for local env
    msalConfig.system = {
      loggerOptions: {
        loggerCallback(_loglevel, message) {
            logger.info(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Info,
      }
    };
  }

  const msalInstance = new msal.ConfidentialClientApplication(msalConfig);
  logger.info("MSAL initialised");
  return msalInstance;
}


/**
 * An instance of MSAL client application to re-use inside of this module
 */
const msalInstance : msal.ConfidentialClientApplication = initMSAL();

/**
 * Details about the credentials and scopes included in MSAL token requests
 */
const clientCredentialRequest = {
  scopes: ["https://graph.microsoft.com/.default"],
};

/**
 * Get a new token using the MSAL application instance
 */
async function retrieveFreshToken() : Promise<TokenInfo> {
  logger.info(`Acquiring new token`);
  const tokenResponse: msal.AuthenticationResult = await msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
  logger.info(`Token response was %s`, JSON.stringify(tokenResponse));
  return { token: tokenResponse.accessToken, expiry: tokenResponse.expiresOn };
}

/**
 * Get an MSAL token string for use with other APIs (for example graph-api client)
 *
 * This function will return a cached (but still valid token) to avoid having
 * to retrieve a fresh token for each use.
 */
export async function getMsalAccessToken(): Promise<string> {
  const tokenCache = await cacheUntilExpiry('msalToken',retrieveFreshToken);
  return tokenCache.token;
}
