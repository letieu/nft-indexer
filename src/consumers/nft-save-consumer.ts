import { NFT_COLLECTION, getMongoClient } from "../lib/db";
import { logger } from "../lib/logger";
import { MetadataData, NftSaveData, QueueNames, queueOptions } from "../lib/queue";
import Queue, { Job } from 'bee-queue';

const nftSaveQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);

nftSaveQueue.process(async (job: Job<NftSaveData>, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  let nfts = job.data;

  const client = await getMongoClient();
  const collection = client.collection(NFT_COLLECTION);

  const writeOps = nfts.map((nft) => {
    return {
      updateOne: {
        filter: {
          tokenId: nft.tokenId,
          tokenAddress: nft.tokenAddress,
        },
        update: {
          $set: {
            ...nft,
          },
        },
        upsert: true,
      }
    }
  });

  await collection.bulkWrite(writeOps);

  await Promise.all(Array.from(nfts.values()).map((nft) => {
    return metadataQueue.createJob({
      tokenAddress: nft.tokenAddress,
      tokenId: nft.tokenId,
      uri: nft.uri,
    })
      .timeout(1000 * 60) // 1 minute
      .retries(2)
      .save();
  }));

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

