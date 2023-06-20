import axios from "axios";
import { ethers } from "ethers";
import erc721Abi from "./abis/erc721.json";
import { calculateBlockRanges } from "./helper";
import Bottleneck from "bottleneck";
import { Presets, SingleBar } from "cli-progress";

export type TransferLog = {
  blockNumber: number;
  from: string;
  to: string;
  tokenId: string;
};

// cronos
const SCAN_URL = "https://cronos-explorer.crypto.org/api";
const API_KEY = "P47G6IFFMV796BAVGUF2EA3GZNSXM2CFHU";
const nftIface = new ethers.Interface(erc721Abi);

async function getLogs(contractAddress: string, fromBlock: number, toBlock: number) {
  const params = {
    module: 'logs',
    action: 'getLogs',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    address: contractAddress,
    topic0: nftIface.getEvent('Transfer').topicHash,
    apikey: API_KEY,
  };

  // get logs from contract eve
  const { data } = await axios.get(SCAN_URL, { params });

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

async function getBlockNumbers(contractAddress: string): Promise<number[]> {
  const params = {
    module: 'account',
    action: 'txlist',
    address: contractAddress,
    startblock: '0',
    endblock: 'latest',
    apikey: API_KEY,
  };

  const { data } = await axios.get(SCAN_URL, { params });
  const blockNumbers: number[] = data.result.map((tx) => +tx.blockNumber);
  const uniqueBlockNumbers = [...new Set(blockNumbers)];
  return uniqueBlockNumbers.sort((a: number, b: number) => a - b);
}

export async function getAllTransferLogs(contractAddress: string, trigger: (log: TransferLog) => void) {
  const blockNumbers = await getBlockNumbers(contractAddress);
  const ranges = calculateBlockRanges(blockNumbers, 1000);

  const limiter = new Bottleneck({
    minTime: 400, // ~2 req/sec
  });

  const wrappedGetLogs = limiter.wrap(getLogs);

  const progressBar = new SingleBar(
    {
      format: 'Get contract logs [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}',
      clearOnComplete: true,
    },
    Presets.legacy,
  );

  progressBar.start(ranges.length, 0);

  const logs = await Promise.all(
    ranges.map(async (range) => {
      const logs = await wrappedGetLogs(contractAddress, range.fromBlock, range.toBlock);
      logs.forEach(trigger);

      progressBar.increment();
      return logs;
    })
  );

  progressBar.stop();

  return logs.flat() as TransferLog[];
}
