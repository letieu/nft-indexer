import { MongoClient } from "mongodb";
import { TransferLog } from "./scan";
import { getAddress } from "ethers";
import { logger } from "./logger";

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
  const collection = client.collection(NFT_COLLECTION);
  const batchSize = 100; // Set the desired batch size
  const nftsIterator = nfts.entries();
  let processedCount = 0;

  const bulkOps = [];
  const tokenIds = [];
  const tokenAddresses = [];

  while (processedCount < nfts.size) {
    const batchNFTs = [];
    const batchTokenIds = [];
    const batchTokenAddresses = [];

    for (let i = 0; i < batchSize && processedCount < nfts.size; i++) {
      const [key, value] = nftsIterator.next().value;
      batchNFTs.push({ key, value });
      batchTokenIds.push(value.tokenId);
      batchTokenAddresses.push(getAddress(value.tokenAddress));
      processedCount++;
    }

    const updateOptions = {
      $set: {
        updatedAt: new Date(),
      },
    };

    const bulkOps = batchNFTs.map(({ key, value }) => ({
      updateOne: {
        filter: {
          tokenId: value.tokenId,
          tokenAddress: getAddress(value.tokenAddress),
        },
        update: {
          $setOnInsert: {
            creator: value.creator,
            tokenAddress: getAddress(value.tokenAddress),
            tokenId: value.tokenId,
          },
          ...updateOptions,
          owner: value.owner,
          uri: value.uri,
          metadata: value.metadata,
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      logger.info(`Updating ${batchNFTs.length} nfts to db`);
      await collection.bulkWrite(bulkOps);
      logger.info(`Updated ${processedCount} nfts to db`);
    }
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
