import { getCollectionConfigs, markIndexRunning } from "../lib/db";
import { logger } from "../lib/logger";
import Queue from 'bee-queue';
import { MintData, QueueNames, queueOptions } from "../lib/queue";

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);

export async function startIndexMint() {
  const configs = await getCollectionConfigs();
  logger.info(`Found ${configs.length} configs`);

  for await (const config of configs) {
    const job = mintQueue.createJob({
      contractAddress: config.address,
      fromBlock: config.indexPoint + 1,
    });

    await job.save();
    await markIndexRunning(config.address);

    logger.info(`Created job for ${config.address} from block ${config.indexPoint + 1}, ID: job.id`);
  }
}

// run one time
// TODO: Run every 5 minutes, or use pm2 to run as a service
startIndexMint()
  .then(() => {
    logger.info('Finished starting index mint');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
