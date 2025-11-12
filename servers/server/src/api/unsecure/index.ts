import { Router } from 'express';
import { leaderboardRouter } from './leaderboard';
import { eventSubscriptionRouter } from './eventSubscriptions';

export const unsecureRouter = Router();
unsecureRouter.use(leaderboardRouter);
unsecureRouter.use(eventSubscriptionRouter);
