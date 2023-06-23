import { logger } from "../../lib/logger";
import { MintData, QueueNames, queueOptions } from "../../lib/queue";
import { CONFIG_COLLECTION, NFT_COLLECTION, getCollectionConfigs, getMongoClient, markIndexRunning } from "../../lib/db";
import Queue from 'bee-queue';

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);

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

    await job.save();
    await markIndexRunning(config.address);

    logger.info(`Created job for ${config.address} from block ${config.indexPoint + 1}, ID: job.id`);
  }
}

export async function checkCollection(address: string) {
  logger.info(`Checking collection ${address}`);
  const client = await getMongoClient();

  const config = await client.collection(CONFIG_COLLECTION).findOne({
    address,
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
                $ne: ['$uri', null],
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
                $ne: ['$metadata', null],
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
      full: config.full,
      running: config.running,
    };
  });
}
