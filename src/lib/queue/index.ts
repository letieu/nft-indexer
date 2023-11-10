import 'dotenv/config';
import { AnyBulkWriteOperation } from 'mongodb';

export const queueOptions = {
  removeOnSuccess: true,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
  },
}

export type MintData = {
  contractAddress: string;
  fromBlock: number;
  onlyMinted: boolean;
}

export type MetadataData = {
  tokenAddress: string;
  tokenId: string;
  uri: string;
}

export type NftSaveData = AnyBulkWriteOperation[];

export enum QueueNames {
  MINT = 'mint',
  METADATA = 'metadata',
  NFT_SAVE = 'nft-save',
}
