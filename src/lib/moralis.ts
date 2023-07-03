import axios from "axios";

export async function getContractNFTs(
  address: string,
  cursor?: string
) {
  const chainId = process.env.CHAIN_ID;
  const apiKey = process.env.MORALIS_API_KEY;
  const response = await axios.get(
    `https://deep-index.moralis.io/api/v2/nft/${address}?chain=${chainId}&format=decimal&disable_total=false&media_items=false&cursor=${cursor}`,
    {
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  return response.data;
}
