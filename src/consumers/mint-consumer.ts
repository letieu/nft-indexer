import { logger } from "../lib/logger";
import { MetadataData, MintData, NftSaveData, QueueNames, queueOptions } from "../lib/queue";
import Queue from 'bee-queue';
import { getAllTransferLogs } from "../lib/scan";
import { getNftsFromLogs } from "../lib/helper";
import { CONFIG_COLLECTION, getMongoClient, markIndexRunning, updateIndexPoint, updateNfts } from "../lib/db";
import { getCurrentBlock } from "../lib/contract";
import { getAddress } from "ethers";

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);
const saveNftQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);

/* works:
  - load all transfer logs from fromBlock to currentBlock
  - update nfts
  - update index point
  - create job for update nft metadata
*/
mintQueue.process(async (job, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  let { contractAddress, fromBlock, onlyMinted } = job.data;
  await markIndexRunning(contractAddress);
  contractAddress = getAddress(contractAddress);

  logger.info(`Indexing collection ${contractAddress} from block ${fromBlock}`);

  const logs = await getAllTransferLogs(contractAddress, onlyMinted, fromBlock);
  logger.info(`Found ${logs.length} logs`);

  if (logs.length > 0) {
    const nfts = getNftsFromLogs(logs, contractAddress);
    await updateNfts(nfts, saveNftQueue);

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

  done()

  logger.info(`Finished indexing collection ${contractAddress} from block ${fromBlock}`);
  logger.info(`==================== Finished processing job ${job.id} ====================`);
});

mintQueue.on('succeeded', async (job, result) => {
  const { contractAddress } = job.data;

  const currentBlock = await getCurrentBlock();
  await updateIndexPoint(contractAddress, currentBlock);
});

mintQueue.on('failed', async (job, err) => {
  logger.info(`==================== failed processing job ${job.id} ====================`);
  logger.error(err);
  const { contractAddress, fromBlock } = job.data;

  await updateIndexPoint(contractAddress, fromBlock);
});

mintQueue.on('error', (err) => {
  logger.info(`==================== error processing job ====================`);
  logger.error(err);
});

logger.info(`Waiting for jobs in ${QueueNames.MINT}`);

