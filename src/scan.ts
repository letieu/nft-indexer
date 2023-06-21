import axios from "axios";
import { ethers } from "ethers";
import erc721Abi from "./abis/erc721.json";
import { logger } from ".";

const nftIface = new ethers.Interface(erc721Abi);

export type TransferLog = {
  blockNumber: number;
  from: string;
  to: string;
  tokenId: string;
};

async function getLogs(contractAddress: string, fromBlock: number, toBlock?: number): Promise<TransferLog[]> {
  const params = {
    module: 'logs',
    action: 'getLogs',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock?.toString() || 'latest',
    address: contractAddress,
    topic0: nftIface.getEvent('Transfer').topicHash,
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

  const logs = data.result.map((log) => {
    const decoded = nftIface.decodeEventLog('Transfer', log.data, log.topics);
    return {
      blockNumber: +log.blockNumber,
      from: decoded.from,
      to: decoded.to,
      tokenId: decoded.tokenId.toString(),
    };
  });

  return logs;
}

export async function getAllTransferLogs(
  contractAddress: string,
  fromBlock = 0,
): Promise<TransferLog[]> {
  let startBlock = fromBlock;
  let endBlock = process.env.SNAPSHOT_AT ? +process.env.SNAPSHOT_AT : undefined;

  logger.info(`Getting logs from ${startBlock} to ${endBlock}`);

  const logs = [];

  while (true) {
    const newLogs = await getLogs(contractAddress, startBlock, endBlock);
    if (newLogs.length === 0) {
      break;
    }

    logs.push(...newLogs);

    const minBlock = newLogs[0].blockNumber;
    const maxBlock = newLogs[newLogs.length - 1].blockNumber;

    logger.info(`Got ${newLogs.length} logs, next block: ${startBlock}`);
    logger.info(`Min block: ${minBlock}, max block: ${maxBlock}, diff: ${maxBlock - minBlock}`);

    startBlock = newLogs[newLogs.length - 1].blockNumber + 1;
  }

  return logs;
}
