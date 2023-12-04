import { ZeroAddress } from "ethers";
import { Nft } from "./db";
import { TransferLog } from "./scan";

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io";

export function getNftsFromLogs(logs: TransferLog[], address: string) {
  const nfts = new Map<string, Nft>();
  logs.forEach((log) => {
    const nft = nfts.get(log.tokenId);
    if (!nft) {
      nfts.set(log.tokenId, {
        tokenId: log.tokenId,
        tokenAddress: address,
        owner: log.to,
        uri: log.uri,
      });
    } else {
      nft.owner = log.to;
    }
  });

  return nfts;
}

export function getUriLink(rawUri: string) {
  let uri = rawUri;

  if (uri.startsWith("ipfs://")) {
    uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  uri = uri.replace("https://ipfs.io", IPFS_GATEWAY);

  return uri;
}
