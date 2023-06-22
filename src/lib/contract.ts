import { ethers } from "ethers";
import erc721Abi from "../abis/erc721.json";

export const erc721Iface = new ethers.Interface(erc721Abi);

export function getErc721Contract(contractAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    contractAddress,
    erc721Iface,
    provider
  );
  return contract;
}

export async function getCurrentBlock() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
}
