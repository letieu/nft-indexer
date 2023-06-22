import { logger } from "../lib/logger";
import { checkAllCollection, checkCollection } from "./functions";
import { program } from 'commander';

async function runTask(task) {
  try {
    await task();
    logger.info('Done');
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

program
  .command('check-all-collection')
  .description('Check all collection')
  .action(() => {
    runTask(checkAllCollection);
  });

program
  .command('check-collection <address>')
  .description('Check collection')
  .action((address) => {
    runTask(() => checkCollection(address));
  });


program.parse(process.argv);
