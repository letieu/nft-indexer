import axios from "axios";
import { erc721Iface, getErc721Contract } from "./contract";
import { logger } from "./logger";

export type TransferLog = {
  blockNumber: number;
  from: string;
  to: string;
  tokenId: string;
  uri?: string; };

export async function getMetadata(uri: string) {
  const { data } = await axios.get(uri);
  return data;
}

async function getLogs(contractAddress: string, fromBlock: number, toBlock?: number): Promise<TransferLog[]> {
  const params = {
    module: 'logs',
    action: 'getLogs',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock?.toString() || 'latest',
    address: contractAddress,
    topic0: erc721Iface.getEvent('Transfer').topicHash,
    topic1: "0x0000000000000000000000000000000000000000000000000000000000000000", // only get new minted nft
    apikey: process.env.API_KEY,
    sort: 'asc',
  };

  const { data } = await axios.get(process.env.SCAN_URL, { params }).catch((err) => {
    logger.error(err);
    throw err;
  });

  if (+data.status === 0) {
    if (['No records found', 'No logs found'].includes(data?.message)) {
      return [];
    } else {
      throw new Error(data?.result);
    }
  }

  const contract = getErc721Contract(contractAddress);

  const logs = await Promise.all(data.result.map(async (log) => {
    const decoded = erc721Iface.decodeEventLog('Transfer', log.data, log.topics);

    const uri = await contract.tokenURI(decoded.tokenId).catch((err) => {
      logger.error(err);
      return undefined;
    });

    return {
      blockNumber: +log.blockNumber,
      from: decoded.from,
      to: decoded.to,
      tokenId: decoded.tokenId.toString(),
      uri,
    };
  }));

  return logs;
}

export async function getAllTransferLogs(
  contractAddress: string,
  fromBlock = 0,
): Promise<TransferLog[]> {
  let startBlock = fromBlock;
  let endBlock = process.env.SNAPSHOT_AT ? +process.env.SNAPSHOT_AT : undefined;

  const logs = [];

  while (true) {
    const newLogs = await getLogs(contractAddress, startBlock, endBlock);
    if (newLogs.length === 0) {
      break;
    }

    logs.push(...newLogs);

    const minBlock = newLogs[0].blockNumber;
    const maxBlock = newLogs[newLogs.length - 1].blockNumber;

    logger.info(`Min block: ${minBlock}, max block: ${maxBlock}, diff: ${maxBlock - minBlock}, total: ${logs.length}`);

    startBlock = newLogs[newLogs.length - 1].blockNumber + 1;
  }

  return logs;
}
