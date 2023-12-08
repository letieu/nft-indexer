# Load NFT Data from EVM Blockchain to MongoDB

This project allows you to retrieve NFT (Non-Fungible Token) data from an EVM (Ethereum Virtual Machine) blockchain and store it in a MongoDB database. Follow the instructions below to set up and use the project effectively.

## Requirements:

- [pnpm](https://pnpm.io/installation) - Package manager for installing dependencies
- [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) - Process manager for running the application
- [mongodb](https://docs.mongodb.com/manual/installation/) - NoSQL database for storing NFT data
- [redis](https://redis.io/topics/quickstart) - In-memory data structure store (optional, alternative to using `docker-compose`)

Alternatively, you can use `docker-compose` to run `mongodb` and `redis` as containers.

## Usage

Follow the steps below to use the project:

1. Install dependencies by running the following command:
   ```bash
   pnpm i
   ```

2. Update the `.env` file by making a copy of `.env.example` and modifying it with your configuration details.

3. If you choose to use `docker-compose`, start `mongodb` and `redis` containers by running the following command:
   ```bash
   docker-compose up -d
   ```

4. Start background process
	```bash
	pnpm build
	pm2 start ecosystem.config.js
	
	pm2 logs # check logs
	pm2 list # show list of process
	```
5. Trigger to load NFT data
	- use command:
	```bash
	# Load NFTs of one collection to db
	ts-node src/triggers/command.ts collection check <collection_address>

	# Import collection config to db (index_config collection) for check Transfer event on batch
	ts-node src/triggers/command.ts collection import collections.json
	ts-node src/triggers/command.ts collection check-all -f
	 
	ts-node src/triggers/command.ts -h # for more detail
	```
	- use API:
		http://localhost:3077/docs

		Create API key with command: `ts-node src/triggers/command.ts auth create key-name`
6. Check `nfts` and `index_config` collection to see loaded NFTs
	- All collection config in `index_config` with `live` = `true` will fetch new NFT Transfer event each 3 minutes ( with cronjob in `pm2` for command: `ts-node src/triggers/command.ts collection check-all` )
	
	- To check Transfer for a collection start from specific block use `-b` flag
		```bash
		ts-node src/triggers/command.ts collection check <collection_address> -b 1245
		```

   - Metadata:
		```bash
		#refresh metadata
		ts-node src/triggers/command.ts collection update-metadata <address> <id>
		```
## Using with Docker
```
# build
docker build -t nft-indexer .

# run
docker run -d --name nft-indexer -p 3077:3077 --env-file .env nft-indexer
```

Prebuilt image: `docker.io/letieu/nft-indexer`

- env:
```env
    - SCAN_URL: Blockscan API url, ex: https://api-testnet.polygonscan.com/api
    - API_KEY: Blockscan API key
    - RPC_URL: RPC url, ex: https://polygon-mumbai.blockpi.network/v1/rpc/public
    - CHAIN_ID: Chain id, ex: 0x13881
    - MONGODB_URI: MongoDB connection string, ex: mongodb://localhost:27017/corgi
    - REDIS_HOST: Redis host, ex: localhost
    - REDIS_PORT: Redis port, ex: 6379
    - REDIS_PASSWORD: Redis password
    - REDIS_TLS: Redis use TLS, true or false
    - JWT_SECRET: JWT secret, ex: secret
    - HTTP_PORT: HTTP port for API, ex: 3077
    - IPFS_GATEWAY: https://cloudflare-ipfs.com
    - MORALIS_API_KEY: Moralis API key, optional
```

## TODO:
- [ ] Add support for retrieving NFT ownership data
- [ ] Support import from moralis

## Diagram

![image](https://github.com/letieu/nft-indexer/assets/53562817/ea45ef07-f8f7-40c0-846d-26ec502c10f3)
