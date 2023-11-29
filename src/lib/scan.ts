import axios from "axios";
import { erc1155Iface, erc721Iface, getErc1155Contract, getErc721Contract } from "./contract";
import { logger } from "./logger";
import { getUriLink } from "./helper";
import { ContractInterface } from "./db";

export type TransferLog = {
  blockNumber: number;
  from: string;
  to: string;
  tokenId: string;
  uri?: string;
  quantity?: number;
};

export async function getMetadata(uri: string) {
  const { data } = await axios.get(getUriLink(uri));
  return data;
}

async function getErc721TransferLogs(contractAddress: string, onlyMinted: boolean, fromBlock: number, toBlock?: number): Promise<TransferLog[]> {
  const params = {
    module: 'logs',
    action: 'getLogs',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock?.toString() || 'latest',
    address: contractAddress,
    topic0: erc721Iface.getEvent('Transfer').topicHash,
    apikey: process.env.API_KEY,
    sort: 'asc',
  };

  if (onlyMinted) {
    params['topic1'] = "0x0000000000000000000000000000000000000000000000000000000000000000"; // only get new minted nft
  }

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

  const logs: TransferLog[] = await Promise.all(data.result.map(async (log) => {
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
      quantity: 1,
    };
  }));

  return logs;
}

async function getErc1155TransferLogs(contractAddress: string, onlyMinted: boolean, fromBlock: number, toBlock?: number): Promise<TransferLog[]> {
  const params = {
    module: 'logs',
    action: 'getLogs',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock?.toString() || 'latest',
    address: contractAddress,
    topic0: erc1155Iface.getEvent('TransferSingle').topicHash,
    apikey: process.env.API_KEY,
    sort: 'asc',
  };

  if (onlyMinted) {
    params['topic1'] = "0x0000000000000000000000000000000000000000000000000000000000000000"; // only get new minted nft
  }

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

  const contract = getErc1155Contract(contractAddress);

  const logs: TransferLog[] = await Promise.all(data.result.map(async (log) => {
    const decoded = erc1155Iface.decodeEventLog('TransferSingle', log.data, log.topics);

    const uri = await contract.uri(decoded.id).catch((err) => {
      logger.error(err);
      return undefined;
    });

    return {
      blockNumber: +log.blockNumber,
      from: decoded.from,
      to: decoded.to,
      tokenId: decoded.id.toString(),
      uri,
      quantity: +decoded.value.toString(),
    };
  }));

  return logs;
}


export async function getAllTransferLogs(
  contractAddress: string,
  onlyMinted: boolean,
  fromBlock = 0,
  contractInterface: ContractInterface
): Promise<TransferLog[]> {
  let startBlock = fromBlock;
  let endBlock = process.env.SNAPSHOT_AT ? +process.env.SNAPSHOT_AT : undefined;

  const logs = [];

  while (true) {
    const newLogs = await (contractInterface === ContractInterface.ERC721
      ? getErc721TransferLogs(contractAddress, onlyMinted, startBlock, endBlock)
      : getErc1155TransferLogs(contractAddress, onlyMinted, startBlock, endBlock));

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
