import { getAllTransferLogs } from "./scan";

const CONTRACT_ADDRESS = "0xa506b3938377635Fa9C091E9af8748Fa1C9A2424";

type NFT = {
  tokenId: string;
  owner: string;
  transfers: number[];
};

async function main() {
  const nfts: Map<string, NFT> = new Map();
  let lastBlock = 0;

  function trigger(log) {
    lastBlock = log.blockNumber;
    if (nfts.has(log.tokenId)) {
      const nft = nfts.get(log.tokenId);
      nft.owner = log.to;
      nft.transfers.push(log.blockNumber);
    } else {
      nfts.set(log.tokenId, {
        tokenId: log.tokenId,
        owner: log.to,
        transfers: [log.blockNumber],
      });
    }
  }

  try {
    await getAllTransferLogs(CONTRACT_ADDRESS, trigger);
  } catch (e) {
    console.error(e);
    console.log("NFTs:", nfts.size);
  }

  console.log("NFTs:", nfts.size);
  console.log("Last block:", lastBlock);
}

main().catch(console.error);
