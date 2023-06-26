import { readFile } from "fs/promises";
import { logger } from "../lib/logger";
import { QueueNames } from "../lib/queue";
import createApiKey from "./functions/auth";
import { checkAllCollection, checkCollection, listCollection, updateMetadataAll, updateMetadataOne, importCollections } from "./functions/collection";
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

// ==================== COLLECTION ====================
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

collectionCommand
  .command('update-metadata [address] [id]')
  .option('-f, --force', 'Force update metadata')
  .description('Update metadata for collection')
  .action((address: string, id: string, options: { force: boolean }) => {
    if (id) {
      runTask(() => updateMetadataOne(address, id));
    } else {
      runTask(() => updateMetadataAll(address, options.force));
    }
  });

collectionCommand
  .command('import <file>')
  .description('Import collections from json file')
  .action(async (file: string) => {
    const jsonFile = await readFile(file, 'utf-8');
    const collections = JSON.parse(jsonFile);

    runTask(() => importCollections(collections));
  });

// ==================== QUEUE ====================
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

// ==================== AUTH ====================
const authCommand = program.command('auth');
authCommand
  .command('create <key-id>')
  .description('Create new API key')
  .action(async (keyId: string) => {
    const res = await createApiKey(keyId);
    console.log(res.token);
  });

program.parse(process.argv);
