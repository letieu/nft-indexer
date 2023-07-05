import { MongoClient } from "mongodb";
import { TransferLog } from "./scan";
import { getAddress } from "ethers";
import { logger } from "./logger";
import Bottleneck from "bottleneck";

export type Nft = {
  tokenId: string;
  tokenAddress: string;
  creator?: string;
  owner?: string;
  uri?: string;
  metadata?: any;
};

export const CONFIG_COLLECTION = "index_config";
export const NFT_COLLECTION = "nfts";
export const TRANSFER_COLLECTION = "transfers";

export const getMongoClient = (() => {
  let client: MongoClient | null = null;

  return async () => {
    if (client) {
      return client.db(process.env.MONGODB_DATABASE);
    }

    logger.info("Connecting to mongo");
    client = await MongoClient.connect(process.env.MONGODB_URI)
    logger.info("Connected to mongo");

    return client.db(process.env.MONGODB_DATABASE);
  }
})()

export async function updateNfts(nfts: Map<string, Nft>) {
  const client = await getMongoClient();

  const batchSize = 200; // Set the desired batch size
  const nftsIterator = nfts.entries();
  let processedCount = 0;

  while (processedCount < nfts.size) {
    const batchNFTs = [];
    for (let i = 0; i < batchSize && processedCount < nfts.size; i++) {
      const [key, value] = nftsIterator.next().value;
      batchNFTs.push({ key, value });
      processedCount++;
    }

    const bulk = client.collection(NFT_COLLECTION).initializeUnorderedBulkOp();

    batchNFTs.forEach(({ key, value }) => {
      bulk.find({
        tokenId: value.tokenId,
        tokenAddress: getAddress(value.tokenAddress),
      }).upsert().updateOne({
        $set: {
          creator: value.creator,
          owner: value.owner,
          tokenAddress: getAddress(value.tokenAddress),
          tokenId: value.tokenId,
          uri: value.uri,
          updatedAt: new Date(),
        },
      });
    });

    await bulk.execute();

    logger.info(`Updated ${processedCount} nfts to db`);
  }

  logger.info(`Total updated ${processedCount} nfts to db`);
}

export async function updateTransferLogs(logs: TransferLog[]) {
  logger.info(`Updating ${logs.length} transfer logs to db`);
  const client = await getMongoClient();
  await client.collection(TRANSFER_COLLECTION).insertMany(logs);
}

export async function updateIndexPoint(address: string, blockNumber: number) {
  const client = await getMongoClient();
  await client.collection(CONFIG_COLLECTION).updateOne(
    {
      address: getAddress(address),
    },
    {
      $set: {
        indexPoint: blockNumber,
        running: false,
      },
    }
  );
  logger.info(`Updated index point of ${address} to ${blockNumber}`);
}

export async function getCollectionConfigs(force = false) {
  const client = await getMongoClient();

  const filter = {
    running: {
      $ne: true,
    }
  }

  if (!force) {
    filter['live'] = true;
  }

  const configs = await client.collection(CONFIG_COLLECTION).find(filter).toArray();

  return configs;
}

export async function markIndexRunning(address: string) {
  const client = await getMongoClient();

  await client.collection(CONFIG_COLLECTION).updateOne(
    {
      address: getAddress(address),
    },
    {
      $set: {
        running: true,
        address: getAddress(address),
      },
    },
    {
      upsert: true,
    }
  );
}
