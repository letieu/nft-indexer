import { NFT_COLLECTION, getMongoClient } from "../lib/db";
import { logger } from "../lib/logger";
import { NftSaveData, QueueNames, queueOptions } from "../lib/queue";
import Queue, { Job } from 'bee-queue';

const nftSaveQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);

nftSaveQueue.process(async (job: Job<NftSaveData>, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  let bulkInsertData = job.data;

  const client = await getMongoClient();
  const collection = client.collection(NFT_COLLECTION);
  await collection.bulkWrite(bulkInsertData);

  done()
});

nftSaveQueue.on('succeeded', async (job, result) => {
  logger.info(`==================== succeeded processing job ${job.id} ====================`);
});

nftSaveQueue.on('failed', async (job, err) => {
  logger.info(`==================== failed processing job ${job.id} ====================`);
  logger.error(err);
});

nftSaveQueue.on('error', (err) => {
  logger.info(`==================== error processing job ====================`);
  logger.error(err);
});

logger.info(`Waiting for jobs in ${QueueNames.NFT_SAVE}`);

