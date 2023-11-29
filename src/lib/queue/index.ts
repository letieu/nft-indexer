import 'dotenv/config';
import { ContractInterface, Nft } from '../db';
import { TransferLog } from '../scan';

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
  contractInterface: ContractInterface;
}

export type MetadataData = {
  tokenAddress: string;
  tokenId: string;
  uri: string;
}

export type NftSaveData = {
  contractAddress: string;
  transferLogs: TransferLog[];
  contractInterface: ContractInterface;
};

export enum QueueNames {
  MINT = 'mint',
  METADATA = 'metadata',
  NFT_SAVE = 'nft-save',
}
