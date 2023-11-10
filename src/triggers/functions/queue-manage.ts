import Queue from 'bee-queue';
import { MetadataData, MintData, NftSaveData, QueueNames, queueOptions } from '../../lib/queue';

const mintQueue = new Queue<MintData>(QueueNames.MINT, queueOptions);
const metadataQueue = new Queue<MetadataData>(QueueNames.METADATA, queueOptions);
const nftSaveQueue = new Queue<NftSaveData>(QueueNames.NFT_SAVE, queueOptions);

export async function getQueueReport() {
  // checkhealth
  const mintHealth = await mintQueue.checkHealth();
  const metadataHealth = await metadataQueue.checkHealth();
  const nftSaveHealth = await nftSaveQueue.checkHealth();

  return {
    mint: {
      ...mintHealth,
      queue: QueueNames.MINT,
    },
    metadata: {
      ...metadataHealth,
      queue: QueueNames.METADATA,
    },
    nftSave: {
      ...nftSaveHealth,
      queue: QueueNames.NFT_SAVE,
    },
  };
}

export async function destroyQueue(name: QueueNames) {
  const queue = new Queue(name, queueOptions);
  await queue.destroy();
  return {
    message: `Queue ${name} deleted`,
  };
}
