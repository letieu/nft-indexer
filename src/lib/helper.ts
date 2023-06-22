import { Nft } from "./db";
import { TransferLog } from "./scan";

export function getNftsFromLogs(logs: TransferLog[], address: string) {
  const nfts = new Map<string, Nft>();
  logs.forEach((log) => {
    nfts.set(log.tokenId, {
      tokenId: log.tokenId,
      tokenAddress: address,
      creator: log.to,
      uri: log.uri,
    });
  });
  return nfts;
}

