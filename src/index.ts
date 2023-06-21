import { TransferLog, getAllTransferLogs } from "./scan";
import 'dotenv/config';
import { getConfigs, getMongoClient, updateIndexPoint, updateNfts, updateTransferLogs } from "./db";
import { pino } from "pino";
import { ethers } from "ethers";
import erc721Abi from "./abis/erc721.json";

export const logger = pino();

export type Nft = {
  tokenId: string;
  tokenAddress: string;
  owner: string;
  uri?: string;
  metadata?: any;
};

async function check() {
  const nftIface = new ethers.Interface(erc721Abi);
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contractAddress = "0x0a0BF65248805Efa926c39Bf51B6Dd94e3d1A7AF";

  const contract = new ethers.Contract(
    contractAddress,
    nftIface,
    provider
  );

  // get random 10 nft from db
  const client = await getMongoClient();
  // random from 0 to 9000
  const randomSkip = Math.floor(Math.random() * 9000);
  const nfts = await client.collection("nft").find({}).skip(randomSkip).limit(30).toArray();

  console.log("start checking")
  await Promise.all(
    nfts.map(async (nft) => {
      try {
        const owner = await contract.ownerOf(nft.tokenId);
        if (owner !== nft.owner) {
          console.log("not equal", nft.tokenId, owner, nft.owner)
        } else {
          console.log("equal", nft.tokenId, owner, nft.owner)
        }
      } catch (e) {
        console.log("error", nft.tokenId)
      }
    }
    ));

  console.log("done")
}

function getNftsFromLogs(logs: TransferLog[], address: string) {
  const nfts = new Map<string, Nft>();
  logs.forEach((log) => {
    const nft = nfts.get(log.tokenId);
    if (nft) {
      nft.owner = log.to;
    } else {
      nfts.set(log.tokenId, {
        tokenId: log.tokenId,
        tokenAddress: address,
        owner: log.to,
      });
    }
  });
  return nfts;
}

async function indexCollection(address: string, point: number) {
  logger.info(`Indexing collection ${address} from block ${point}`);

  const logs = await getAllTransferLogs(address, point);
  if (logs.length === 0) {
    logger.info(`No new logs found for ${address} from block ${point}`);
    return;
  }

  const nfts = getNftsFromLogs(logs, address);

  await updateNfts(nfts);
  await updateIndexPoint(address, logs);

  logger.info(`Indexed ${logs.length} logs for ${address}, ${nfts.size} nfts`);
}

async function start() {
  const configs = await getConfigs();
  logger.info(`Found ${configs.length} configs`);

  for await (const config of configs) {
    await indexCollection(config.address, config.indexPoint + 1);
  }
}

start().then(() => {
  logger.info("Done");
  process.exit(0);
}).catch((err) => {
  logger.error(err);
  process.exit(1);
});
