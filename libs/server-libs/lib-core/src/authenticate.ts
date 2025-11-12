import { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import makeJwksClient from 'jwks-rsa';

const MSAL_DISCOVERY_KEYS_ENDPOINT =
  'https://login.microsoftonline.com/cccbf502-6b91-40d6-be02-5ffa0eb711d6/discovery/keys';
const TWENTY_FOUR_HOURS_IN_MILLIS = 86400000;

const jwksClient = makeJwksClient({
  jwksUri: MSAL_DISCOVERY_KEYS_ENDPOINT,
});

export type AuthenticatedLocals = { upn: string };

export async function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    await verifyToken(token, res, next);
  } else {
    res.status(401).json({ message: 'No Authorization header in request. Add Authorization header to request.' });
  }
}

const kidToPublicKey: Record<string, string> = {};

async function getPublicKey(kid: string): Promise<string> {
  if (kidToPublicKey[kid]) {
    return kidToPublicKey[kid];
  } else {
    const signingKey = await jwksClient.getSigningKey(kid);
    kidToPublicKey[kid] = signingKey.getPublicKey();

    setTimeout(() => {
      delete kidToPublicKey[kid];
    }, TWENTY_FOUR_HOURS_IN_MILLIS);

    return kidToPublicKey[kid];
  }
}

async function verifyToken(jwtToken: string, res: Response, next: NextFunction): Promise<void> {
  const decodedToken = jwt.decode(jwtToken, { complete: true });
  if (decodedToken) {
    const key = await getPublicKey(decodedToken.header.kid);

    try {
      jwt.verify(jwtToken, key);
      res.locals['upn'] = (decodedToken.payload as JwtPayload)['preferred_username'].toLowerCase();
      next();
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(401).json({ message: `${error}` });
      }
    }
  } else {
    res.status(401).json({ message: 'Invalid bearer authorization token. Token could not be decoded.' });
  }
}
