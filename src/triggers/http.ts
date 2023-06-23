import Koa from 'koa';
import parser from 'koa-bodyparser';
import cors from '@koa/cors';
import Router from 'koa-router';
import { checkAllCollection, checkCollection, listCollection } from "./functions/collection";
import { destroyQueue, getQueueReport } from "./functions/queue-manage";
import { QueueNames } from '../lib/queue';

const app = new Koa();
const port = 3000;

const router = new Router();

// === Collection management ===
router.get('/collections', async (ctx) => {
  const collections = await listCollection();
  ctx.body = collections;
});

router.post('/collections/all', async (ctx) => {
  await checkAllCollection();
  ctx.body = {
    message: 'Created jobs for all collections',
  };
});

router.post('/collections/:address', async (ctx) => {
  const { address } = ctx.params;
  await checkCollection(address);
  ctx.body = {
    message: `Created job for ${address}`,
  };
});

// === Queue management ===
router.get('/queues', async (ctx) => {
  const res = await getQueueReport();
  ctx.body = res;
});

router.delete('/queues/:name', async (ctx) => {
  const { name } = ctx.params;
  if (!Object.values(QueueNames).includes(name as QueueNames)) {
    throw new Error(`Invalid queue name: ${name}`);
  }
  const res = await destroyQueue(name as QueueNames);
  ctx.body = res;
});

app
  .use(parser())
  .use(router.routes())
  .use(cors())
  .listen(port, () => {
    console.log(`🚀 Server listening http://127.0.0.1:${port}/ 🚀`);
  });
