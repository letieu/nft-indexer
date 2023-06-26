import { logger } from "../../lib/logger";
import { MetadataData, MintData, QueueNames, queueOptions } from "../../lib/queue";
import { CONFIG_COLLECTION, NFT_COLLECTION, getCollectionConfigs, getMongoClient, markIndexRunning } from "../../lib/db";
import Queue from 'bee-queue';
import { getAddress } from "ethers";

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);

/*
 * Add jobs for all collections to index new nft minted
*/
export async function checkAllCollection() {
  logger.info('Checking all collections');
  const configs = await getCollectionConfigs();
  logger.info(`Found ${configs.length} configs`);

  for await (const config of configs) {
    const job = mintQueue.createJob({
      contractAddress: config.address,
      fromBlock: config.indexPoint + 1,
    });

    job
      .timeout(1000 * 60) // 1 minute
      .retries(2)

    await job.save();
    await markIndexRunning(config.address);

    logger.info(`Created job for ${config.address} from block ${config.indexPoint + 1}, ID: ${job.id}`);
  }
}

export async function checkCollection(address: string) {
  logger.info(`Checking collection ${address}`);
  const client = await getMongoClient();

  const config = await client.collection(CONFIG_COLLECTION).findOne({
    address: getAddress(address),
  });

  const job = mintQueue.createJob({
    contractAddress: address,
    fromBlock: (config?.indexPoint || 0) + 1,
  });

  await job.save();
  await markIndexRunning(address);

  logger.info(`Created job for ${address} from block 0, ID: ${job.id}`);
}

export async function listCollection() {
  const client = await getMongoClient();

  const configs = await client.collection(CONFIG_COLLECTION).find().sort({
    indexPoint: -1,
  }).toArray();

  const nftDetails = await client.collection(NFT_COLLECTION).aggregate([
    {
      $group: {
        _id: '$tokenAddress', // Use '_id' instead of 'tokenAddress' as the accumulator object
        total: {
          $sum: 1,
        },
        totalUri: {
          $sum: {
            $cond: {
              if: {
                $eq: [{ $type: '$uri' }, 'string'],
              },
              then: 1,
              else: 0,
            },
          },
        },
        totalMetadata: {
          $sum: {
            $cond: {
              if: {
                $eq: [{ $type: '$metadata' }, 'object'],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
    },
  ]).toArray();

  const nftDetailsMap = nftDetails.reduce((acc, cur) => {
    acc[cur._id] = cur;
    return acc;
  }, {});

  return configs.map((config) => {
    return {
      address: config.address,
      indexPoint: config.indexPoint,
      total: nftDetailsMap[config.address]?.total || 0,
      totalUri: nftDetailsMap[config.address]?.totalUri || 0,
      totalMetadata: nftDetailsMap[config.address]?.totalMetadata || 0,
      live: config.live,
      running: config.running,
    };
  });
}

export async function updateMetadataAll(address: string, force = false) {
  logger.info(`Updating metadata for collection ${address}`);
  const client = await getMongoClient();

  const filter = {
    tokenAddress: address,
  }

  if (!force) {
    filter['metadata'] = {
      $exists: false,
    }
  }

  const nfts = await client.collection(NFT_COLLECTION).find(filter).toArray();

  logger.info(`Found ${nfts.length} NFTs`);

  for await (const nft of nfts) {
    const job = metadataQueue.createJob({
      tokenAddress: address,
      tokenId: nft.tokenId,
      uri: nft.uri,
    });

    await job.save();
  }

  logger.info(`Created ${nfts.length} jobs`);
}

export async function updateMetadataOne(address: string, tokenId: string) {
  const client = await getMongoClient();

  const nft = await client.collection(NFT_COLLECTION).findOne({
    tokenAddress: getAddress(address),
    tokenId,
  });

  if (!nft) {
    throw new Error('NFT not found');
  }

  const job = metadataQueue.createJob({
    tokenAddress: address,
    tokenId: nft.tokenId,
    uri: nft.uri,
  });

  await job.save();
  logger.info(`Created job for ${address} ${tokenId}, ID: ${job.id}`);
}

export async function importCollections(collections: { address: string, indexPoint: number, live: boolean }[]) {
  const client = await getMongoClient();

  // insert configs if address not exists
  const configs = await client.collection(CONFIG_COLLECTION).find().toArray();

  const newConfigs = collections.filter((collection) => {
    return !configs.find((config) => config.address === collection.address);
  });

  if (newConfigs.length > 0) {
    await client.collection(CONFIG_COLLECTION).insertMany(newConfigs);
  }

  logger.info(`Inserted ${newConfigs.length} configs`);
}

