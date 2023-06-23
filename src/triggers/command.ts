import { logger } from "../lib/logger";
import { QueueNames } from "../lib/queue";
import { checkAllCollection, checkCollection, listCollection } from "./functions/collection";
import { destroyQueue, getQueueReport } from "./functions/queue-manage";
import { program } from 'commander';

async function runTask(task: () => Promise<void>) {
  try {
    await task();
    logger.info('Done');
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

const collectionCommand = program.command('collection');
collectionCommand
  .command('list')
  .description('List collections')
  .action(async () => {
    const collections = await listCollection();
    console.table(collections);
  });

collectionCommand
  .command('check [address]')
  .description('Check collection for new NFTs minted')
  .action((address: string) => {
    runTask(() => checkCollection(address));
  });

collectionCommand
  .command('check-all')
  .description('Check all collections for new NFTs minted')
  .action(() => {
    runTask(checkAllCollection);
  });

const queueCommand = program.command('queue');
queueCommand
  .command('list')
  .description('List queues')
  .action(async () => {
    const res = await getQueueReport();
    console.table(res);
  });

queueCommand
  .command('destroy <name>')
  .description('Destroy queue')
  .action(async (name: string) => {
    if (!Object.values(QueueNames).includes(name as QueueNames)) {
      throw new Error(`Invalid queue name: ${name}`);
    }
    const res = await destroyQueue(name as QueueNames);
    console.log(res);
  });

program.parse(process.argv);
