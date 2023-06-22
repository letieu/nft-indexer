import { logger } from "../lib/logger";
import { MetadataData, QueueNames, queueOptions } from "../lib/queue";
import Queue from 'bee-queue';
import { getMetadata } from "../lib/scan";
import { NFT_COLLECTION, getMongoClient } from "../lib/db";
import { getAddress } from "ethers";

const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);

/* works:
  - load metadata from uri link
  - update nft.metadata
*/
metadataQueue.process(async (job, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);

  const { tokenAddress, tokenId, uri } = job.data;
  logger.info(`tokenAddress: ${tokenAddress}, tokenId: ${tokenId}, uri: ${uri}`);
  const db = await getMongoClient();

  const metadata = await getMetadata(uri);

  await db.collection(NFT_COLLECTION).updateOne(
    {
      tokenId,
      tokenAddress: getAddress(tokenAddress),
    },
    {
      $set: {
        metadata,
      },
    }
  );
});

metadataQueue.on('succeeded', (job, result) => {
  logger.info(`==================== succeeded processing job ${job.id} ====================`);
});

metadataQueue.on('failed', (job, err) => {
  logger.info(`==================== failed processing job ${job.id} ====================`);
  logger.error(err);
});

metadataQueue.on('retrying', (job, error) => {
  logger.info(`==================== retrying processing job ${job.id} ====================`);
  logger.error(error);
});

logger.info(`Waiting for jobs in ${QueueNames.METADATA}`);

