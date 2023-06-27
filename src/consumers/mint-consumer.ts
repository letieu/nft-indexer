import { logger } from "../lib/logger";
import { MetadataData, MintData, QueueNames, queueOptions } from "../lib/queue";
import Queue from 'bee-queue';
import { getAllTransferLogs } from "../lib/scan";
import { getNftsFromLogs } from "../lib/helper";
import { CONFIG_COLLECTION, getMongoClient, updateIndexPoint, updateNfts } from "../lib/db";
import { getCurrentBlock } from "../lib/contract";

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);

/* works:
  - load all transfer logs from fromBlock to currentBlock
  - update nfts
  - update index point
  - create job for update nft metadata
*/
mintQueue.process(async (job, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  const { contractAddress, fromBlock, onlyMinted } = job.data;
  const currentBlock = await getCurrentBlock();

  logger.info(`Indexing collection ${contractAddress} from block ${fromBlock} to ${currentBlock}`);

  const logs = await getAllTransferLogs(contractAddress, onlyMinted, fromBlock);
  logger.info(`Found ${logs.length} logs`);

  if (logs.length > 0) {
    const nfts = getNftsFromLogs(logs, contractAddress);
    await updateNfts(nfts);

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
  }

  await updateIndexPoint(contractAddress, currentBlock);
  done()

  logger.info(`Finished indexing collection ${contractAddress} from block ${fromBlock}`);
  logger.info(`==================== Finished processing job ${job.id} ====================`);
});

logger.info(`Waiting for jobs in ${QueueNames.MINT}`);

