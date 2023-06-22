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

  logger.info(`==================== Finished processing job ${job.id} ====================`);
});

logger.info(`Waiting for jobs in ${QueueNames.MINT}`);

