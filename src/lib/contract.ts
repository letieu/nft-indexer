import { ZeroAddress, ethers } from "ethers";
import erc721Abi from "../abis/erc721.json";
import erc1155 from "../abis/erc1155.json";
import erc165 from "../abis/erc165.json";
import { ContractInterface } from "./db";

export const erc721Iface = new ethers.Interface(erc721Abi);
export const erc1155Iface = new ethers.Interface(erc1155);
export const erc165Iface = new ethers.Interface(erc165);

const ERC721_INTERFACE_ID = ethers.zeroPadValue('0x80ac58cd', 4);
const ERC1155_INTERFACE_ID = ethers.zeroPadValue('0xd9b67a26', 4);

export function getErc721Contract(contractAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    contractAddress,
    erc721Iface,
    provider
  );
  return contract;
}

export function getErc1155Contract(contractAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    contractAddress,
    erc1155Iface,
    provider
  );
  return contract;
}

export async function getCurrentBlock() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
}

export function getErc165Contract(contractAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    contractAddress,
    erc165Iface,
    provider
  );
  return contract;
}

export async function isErc721Contract(address: string) {
  const contract = getErc165Contract(address);
  const isSupported = await contract
    .supportsInterface(ERC721_INTERFACE_ID)
    .catch((e) => {
      return false;
    });

  if (isSupported) {
    return true;
  }

  // try to call balanceOf on a zero address, if it fails, it's not an erc721
  try {
    await contract.balanceOf(ethers.ZeroAddress);
    return true;
  } catch (e) {
    return false;
  }
}

export async function isErc1155Contract(address: string) {
  const contract = getErc165Contract(address);
  const isSupported = await contract
    .supportsInterface(ERC1155_INTERFACE_ID)
    .catch((e) => {
      return false;
    });
  if (isSupported) {
    return true;
  }

  // try to get the balance of a zero address, if it fails, it's not an erc1155
  try {
    await contract.balanceOf(ethers.ZeroAddress, 1);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getContractInterface(
  address: string,
): Promise<ContractInterface | null> {
  const isErc721 = await isErc721Contract(address);
  if (isErc721) {
    return ContractInterface.ERC721;
  }

  const isErc1155 = await isErc1155Contract(address);
  if (isErc1155) {
    return ContractInterface.ERC1155;
  }

  return null;
}
