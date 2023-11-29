import { ContractInterface, NFT_COLLECTION, getMongoClient } from "../lib/db";
import { logger } from "../lib/logger";
import { MetadataData, NftSaveData, QueueNames, queueOptions } from "../lib/queue";
import Queue, { Job } from 'bee-queue';
import { TransferLog } from "../lib/scan";
import { Collection, Document } from "mongodb";
import { getErc721NftsFromLogs } from "../lib/helper";

const nftSaveQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);

nftSaveQueue.process(async (job: Job<NftSaveData>, done) => {
  logger.info(` ==================== Processing job ${job.id} ====================`);
  const client = await getMongoClient();
  const collection = client.collection(NFT_COLLECTION);

  let { transferLogs, contractAddress, contractInterface } = job.data;

  if (contractInterface === ContractInterface.ERC721) {
    await saveErc721(transferLogs, contractAddress, collection);
  }

  if (contractInterface === ContractInterface.ERC1155) {
    // TODO: implement
  }

  await createMetadataJobs(contractAddress, transferLogs);

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

async function createMetadataJobs(contractAddress: string, transferLogs: TransferLog[]) {
  await Promise.all(transferLogs.map((log) => {
    return metadataQueue.createJob({
      tokenAddress: contractAddress,
      tokenId: log.tokenId,
      uri: log.uri,
    })
      .timeout(1000 * 60) // 1 minute
      .retries(2)
      .save();
  }));
}

async function saveErc721(transferLogs: TransferLog[], contractAddress: string, collection: Collection<Document>) {
  const nfts = getErc721NftsFromLogs(transferLogs, contractAddress);
  const writeOps = Array.from(nfts.values()).map((nft) => {
    return {
      updateOne: {
        filter: {
          tokenId: nft.tokenId,
          tokenAddress: contractAddress,
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
}
