import 'dotenv/config';

export const queueOptions = {
  removeOnSuccess: true,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
}

export type MintData = {
  contractAddress: string;
  fromBlock: number;
}

export enum QueueNames {
  MINT = 'mint',
  METADATA = 'metadata',
}