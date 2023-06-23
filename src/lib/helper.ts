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

export function getUriLink(rawUri: string) {
  let uri = rawUri;

  if (uri.startsWith("ipfs://")) {
    uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  return uri;
}
