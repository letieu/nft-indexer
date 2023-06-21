import { MongoClient } from "mongodb";
import { Nft, logger } from ".";
import { TransferLog } from "./scan";
import { getAddress } from "ethers";

const CONFIG_COLLECTION = "configs";
const NFT_COLLECTION = "nfts";
const TRANSFER_COLLECTION = "transfers";

export const getMongoClient = (() => {
  let client: MongoClient | null = null;

  return async () => {
    if (client) {
      return client.db(process.env.MONGO_DB);
    }

    client = await MongoClient.connect(process.env.MONGO_URL)

    return client.db(process.env.MONGO_DB);
  }
})()

export async function updateNfts(nfts: Map<string, Nft>) {
  logger.info(`Updating ${nfts.size} nfts to db`);
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
            owner: nft.owner,
            tokenAddress: getAddress(nft.tokenAddress),
            tokenId: nft.tokenId,
          },
        },
        {
          upsert: true,
        }
      );
    })
  );
}

export async function updateTransferLogs(logs: TransferLog[]) {
  logger.info(`Updating ${logs.length} transfer logs to db`);
  const client = await getMongoClient();
  await client.collection(TRANSFER_COLLECTION).insertMany(logs);
}

export async function updateIndexPoint(address: string, logs: TransferLog[]) {
  logger.info(`Updating index point for ${address}`);
  const client = await getMongoClient();
  await client.collection(CONFIG_COLLECTION).updateOne(
    {
      address,
    },
    {
      $set: {
        indexPoint: logs[logs.length - 1].blockNumber,
      },
    }
  );
}

export async function getConfigs() {
  const client = await getMongoClient();

  const configs = await client.collection(CONFIG_COLLECTION).find({
    full: false,
  }).toArray();

  return configs;
}
