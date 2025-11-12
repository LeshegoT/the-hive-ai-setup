const { logger } = require('./logger');
import type { Request, Response, RequestHandler} from 'express';
import type { NextFunction }from "express-serve-static-core";

/**
 * Wrap an express handler in error-handling functionality.
 *
 * The returned handler will will catch and log errors before passing them on to `next`
 *
 * @param fn The epxress handler to be wrapped with the handle-error fucntionality
 * @returns an experss handler that will catch and log errors before passing them on to `next`
 * @deprecated use the strongly typed `handleErrors` instead
 */
export const handle_errors = (fn: RequestHandler): RequestHandler =>
  (req: Request, res:Response, next:NextFunction ) => {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error(error);
      next(error);
  });
};

/**
 * Wrap an express handler in error-handling functionality.
 *
 * The returned handler will will catch and log errors before passing them on to `next`
 *
 * @param fn The epxress handler to be wrapped with the handle-error fucntionality
 * @returns an experss handler that will catch and log errors before passing them on to `next`
 */
export const handleErrors = <ReqP, ReqBodyT, ResBodyT, QueryT, LocalsT>(fn: RequestHandler<ReqP,ResBodyT,ReqBodyT,QueryT,LocalsT>): RequestHandler<ReqP,ResBodyT,ReqBodyT,QueryT,LocalsT> =>
  (req: Request<ReqP, ResBodyT, ReqBodyT, QueryT, LocalsT>, res: Response<ResBodyT, LocalsT>, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error(error);
    next(error);
  });
};
