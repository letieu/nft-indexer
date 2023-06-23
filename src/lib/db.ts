import { MongoClient } from "mongodb";
import { TransferLog } from "./scan";
import { getAddress } from "ethers";
import { logger } from "./logger";

export type Nft = {
  tokenId: string;
  tokenAddress: string;
  creator: string;
  uri?: string;
  metadata?: any;
};

export const CONFIG_COLLECTION = "configs";
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
  await Promise.all(
    Array.from(nfts.values()).map(async (nft) => {
      await client.collection(NFT_COLLECTION).updateOne(
        {
          tokenId: nft.tokenId,
          tokenAddress: getAddress(nft.tokenAddress),
        },
        {
          $set: {
            creator: nft.creator,
            tokenAddress: getAddress(nft.tokenAddress),
            tokenId: nft.tokenId,
            uri: nft.uri,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
        }
      );
    })
  );
  logger.info(`Updated ${nfts.size} nfts to db`);
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
      address,
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

export async function getCollectionConfigs() {
  const client = await getMongoClient();

  const configs = await client.collection(CONFIG_COLLECTION).find({
    full: false, // don't need index full collection
    running: {
      $ne: true,
    }
  }).toArray();

  return configs;
}

export async function markIndexRunning(address: string) {
  const client = await getMongoClient();

  await client.collection(CONFIG_COLLECTION).updateOne(
    {
      address,
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
