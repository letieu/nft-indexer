import { logger } from "../../lib/logger";
import { MintData, QueueNames, queueOptions } from "../../lib/queue";
import { getCollectionConfigs, markIndexRunning } from "../../lib/db";
import Queue from 'bee-queue';

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);

/*
 * Add jobs for all collections to index new nft minted
*/
export async function checkAllCollection() {
  logger.info('Checking all collections');
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

export async function checkCollection(address: string) {
  logger.info(`Checking collection ${address}`);
  const job = mintQueue.createJob({
    contractAddress: address,
    fromBlock: 0,
  });

  await job.save();
  await markIndexRunning(address);

  logger.info(`Created job for ${address} from block 0, ID: ${job.id}`);
}
