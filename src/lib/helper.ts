import { ZeroAddress } from "ethers";
import { ContractInterface, Nft } from "./db";
import { TransferLog } from "./scan";

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io";

export function getErc721NftsFromLogs(logs: TransferLog[], address: string): Map<string, Nft> {
  const nfts = new Map<string, Nft>();
  logs.forEach((log) => {
    const nft = nfts.get(log.tokenId);
    if (!nft) {
      nfts.set(log.tokenId, {
        tokenId: log.tokenId,
        tokenAddress: address,
        owner: log.to,
        uri: log.uri,
        quantity: 1,
        contractInterface: ContractInterface.ERC721,
      });
    } else {
      nft.owner = log.to;
    }
  });

  return nfts;
}

export function getErc1155NftsFromLogs(logs: TransferLog[], address: string): Map<string, Nft> {
  const nfts = new Map<string, Nft>();

  logs.forEach((log) => {
    let nft = nfts.get(log.tokenId);

    if (!nft) {
      nft = {
        tokenId: log.tokenId,
        tokenAddress: address,
        owners: [],
        uri: log.uri,
        contractInterface: ContractInterface.ERC1155,
      };
      nft.owners.push({
        address: log.to,
        quantity: log.quantity || 1,
      });
      if (log.from !== ZeroAddress) {
        nft.owners.push({
          address: log.from,
          quantity: -log.quantity! || -1,
        });
      }
      nfts.set(log.tokenId, nft);
    } else {
      const receiver = nft.owners!.find((owner) => owner.address === log.to);
      if (receiver) {
        receiver.quantity = receiver.quantity + log.quantity!;
      } else {
        nft.owners!.push({
          address: log.to,
          quantity: log.quantity || 1,
        });
      }

      if (log.from !== ZeroAddress) {
        const sender = nft.owners!.find((owner) => owner.address === log.from);
        if (sender) {
          sender.quantity = sender.quantity - log.quantity!;
        } else {
          nft.owners!.push({
            address: log.from,
            quantity: -log.quantity! || -1,
          });
        }
      }
    }
  });

  nfts.forEach((nft) => {
    if (nft.owners) {
      nft.quantity = nft.owners.reduce((acc, owner) => acc + owner.quantity, 0);
    }
  });

  return nfts;
}

export function getUriLink(rawUri: string) {
  let uri = rawUri;

  if (uri.startsWith("ipfs://")) { // ipfs://Qmxkasdf
    uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/"); // https://ipfs.io/ipfs/Qmxkasdf
  }

  uri = uri.replace("https://ipfs.io", IPFS_GATEWAY);

  return uri;
}
