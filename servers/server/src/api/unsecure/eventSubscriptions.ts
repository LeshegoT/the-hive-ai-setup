import { handle_errors, parseIfSetElseDefault } from '@the-hive/lib-core';
import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  clear_easter_egg_issue_data,
  get_easter_egg_token,
  issue_easter_egg,
} from '../../queries/rewards.queries';
import { get_upn_from_token } from '../../queries/token.queries';

const EASTER_EGG_INTERVAL = parseIfSetElseDefault('EASTER_EGG_INTERVAL',30);
const HEARTBEAT_INTERVAL = parseIfSetElseDefault('HEARTBEAT_INTERVAL',1);

export const eventSubscriptionRouter = Router();
const clients = [];

class Client {
  _req: Request;
  _res: Response;
  _id: number;
  _upn: string;

  constructor(id: number, req: Request, res: Response, upn: string) {
    this._req = req;
    this._res = res;
    this._id = id;
    this._upn = upn;
  }

  get id() {
    return this._id;
  }

  get req() {
    return this._req;
  }

  get res() {
    return this._res;
  }

  get upn() {
    return this._upn;
  }
}

function randomInteger(min, max) {
  if (max === 1 || max<min) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sendData = (client, data) => {
  client.res.write('data: ' + JSON.stringify(data) + '\n\n');
};

function startEasterEggInterval(){
  setInterval(async () => {
    await clear_easter_egg_issue_data();
    if (clients.length > 0) {
      const clientIndex = randomInteger(0, clients.length);
      const data = await get_easter_egg_token();
      if (!!data && !!clients[clientIndex]) {
        await issue_easter_egg(data.codeId, clients[clientIndex].upn);
        console.log('Client ' + clients[clientIndex].id + ' won!');
        sendData(clients[clientIndex], {
          type: 'easter-egg',
          code: data.codeGuid,
        });
      }
    }
  }, EASTER_EGG_INTERVAL * 1000);
}

function startHeartbeatInterval(){
    setInterval(async () => {
    if (clients.length > 0) {
      const hearbeatEvent = { type: 'heartbeat' };
      for (const client of clients) {
        sendData(client, hearbeatEvent);
      }
    }
  }, HEARTBEAT_INTERVAL * 1000);
}

if (JSON.parse(process.env.EASTER_EGG_ENABLED)) {
  startEasterEggInterval();
  startHeartbeatInterval();

  eventSubscriptionRouter.get(
    '/easter-egg/:token',
    handle_errors(async (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const upn = await get_upn_from_token(req.params.token);
      const client = new Client(clients.length, req, res, upn);

      if (!clients.find((client) => client.upn === upn)) {
        clients.push(client);
      }

      // close
      res.on('close', () => {
        const clientIndex = clients.indexOf(client);
        if (clientIndex > -1) {
          clients.splice(clientIndex, 1);
          console.log('Removed client', client.id);
        }
        res.end();
      });
    })
  );
} else {
  console.info('Easter eggs are disabled');
  eventSubscriptionRouter.get(
    '/easter-egg/:token',
    handle_errors(async (req, res) => {
      res.status(404);
    })
  );
}
