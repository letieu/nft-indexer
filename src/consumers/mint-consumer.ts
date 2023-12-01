import { logger } from "../lib/logger";
import { MintData, NftSaveData, QueueNames, queueOptions } from "../lib/queue";
import Queue from 'bee-queue';
import { TransferLog, getAllTransferLogs } from "../lib/scan";
import { ContractInterface, markIndexRunning, updateIndexPoint } from "../lib/db";
import { getCurrentBlock } from "../lib/contract";
import { getAddress } from "ethers";

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);
const saveNftQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);

/* works:
  - load all transfer logs from fromBlock to currentBlock
  - update nfts
  - update index point
  - create job for update nft metadata
*/
mintQueue.process(async (job, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  let { contractAddress, fromBlock, onlyMinted, contractInterface } = job.data;
  await markIndexRunning(contractAddress);
  contractAddress = getAddress(contractAddress);

  logger.info(`Indexing collection ${contractAddress} from block ${fromBlock}`);

  const logs = await getAllTransferLogs(contractAddress, onlyMinted, fromBlock, contractInterface)
  logger.info(`Found ${logs.length} logs`);

  if (logs.length > 0) {
    await createSaveNftJobs(logs, contractAddress, saveNftQueue, contractInterface);
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

async function createSaveNftJobs(transferLogs: TransferLog[], contractAddress: string, saveNftQueue: Queue<NftSaveData>, contractInterface: ContractInterface) {
  const batchSize = 100; // Set the desired batch size
  let processedCount = 0;

  while (processedCount < transferLogs.length) {
    const itemsToUpdate: TransferLog[] = [];

    for (let i = 0; i < batchSize && processedCount < transferLogs.length; i++) {
      const log = transferLogs[processedCount];
      itemsToUpdate.push(log);
      processedCount++;
    }

    await saveNftQueue.createJob({
      contractAddress,
      transferLogs: itemsToUpdate,
      contractInterface: contractInterface,
    })
      .retries(2)
      .save();

    logger.info(`Created job for save ${itemsToUpdate.length} nfts`);
  }

  logger.info(`Created ${processedCount} jobs for save nfts`);
}

logger.info(`Waiting for jobs in ${QueueNames.MINT}`);
