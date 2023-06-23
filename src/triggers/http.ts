import Koa from 'koa';
import parser from 'koa-bodyparser';
import cors from '@koa/cors';
import Router from 'koa-router';
import { checkAllCollection, checkCollection, listCollection, updateMetadataAll, updateMetadataOne } from "./functions/collection";
import { destroyQueue, getQueueReport } from "./functions/queue-manage";
import { QueueNames } from '../lib/queue';
import passport from 'koa-passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import yamljs from 'yamljs';
import { koaSwagger } from 'koa2-swagger-ui';

passport.use(new JwtStrategy({
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}, (payload, done) => {
  console.log('payload', payload);
  return done(null, payload);
}));

const spec = yamljs.load('api.yaml');

const app = new Koa();
const port = 3000;

const router = new Router();

// === Collection management ===
router.get('/collections', async (ctx, next) => {
  const collections = await listCollection();
  ctx.body = collections;
});

router.post('/collections/all', (ctx, next) => {
  return passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!user)
      return ctx.body = 'Unauthorized';

    await checkAllCollection();
    ctx.body = {
      message: 'Created job for all collections',
    };
  })(ctx, next);
});

// collectionCommand
//   .command('update-metadata [address] [id]')
//   .option('-f, --force', 'Force update metadata')
//   .description('Update metadata for collection')
//   .action((address: string, id: string, options: { force: boolean }) => {
//     if (id) {
//       runTask(() => updateMetadataOne(address, id));
//     } else {
//       runTask(() => updateMetadataAll(address, options.force));
//     }
//   });

router.post('/collections/:address', async (ctx, next) => {
  return passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!user)
      return ctx.body = 'Unauthorized';

    const { address } = ctx.params;
    await checkCollection(address);
    ctx.body = {
      message: `Created job for collection ${address}`,
    };
  })(ctx, next);
});

// ======= Metadata =======
router.post('/metadata/refresh/:address', async (ctx, next) => {
  return passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!user)
      return ctx.body = 'Unauthorized';

    const { address } = ctx.params;
    await updateMetadataAll(address, false);
    ctx.body = {
      message: `Created job for collection ${address}`,
    };
  })(ctx, next);
});

router.post('/metadata/refresh/:address/:id', async (ctx, next) => {
  return passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!user)
      return ctx.body = 'Unauthorized';

    const { address, id } = ctx.params;

    await updateMetadataOne(address, id);
    ctx.body = {
      message: `Created job for collection ${address} and id ${id}`,
    };
  })(ctx, next);
});

// === Queue management ===
router.get('/queues', async (ctx) => {
  const res = await getQueueReport();
  ctx.body = res;
});

router.delete('/queues/:name', async (ctx, next) => {
  return passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (!user)
      return ctx.body = 'Unauthorized';

    const { name } = ctx.params;
    await destroyQueue(name as QueueNames);
    ctx.body = {
      message: `Destroyed queue ${name}`,
    };
  })(ctx, next);
});

// @ts-ignore
router.get('/docs', koaSwagger({ routePrefix: false, swaggerOptions: { spec } }));

app
  .use(parser())
  .use(passport.initialize())
  .use(router.routes())
  .use(cors())
  .listen(port, () => {
    console.log(`🚀 Server listening http://127.0.0.1:${port}/ 🚀`);
  });
