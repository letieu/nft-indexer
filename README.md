# Load NFTs data from evm blockchain to mongodb

## Requirements:

- [pnpm](https://pnpm.io/installation)
- [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [mongodb](https://docs.mongodb.com/manual/installation/)
- [redis](https://redis.io/topics/quickstart)

Or you can use `docker-compose` to run `mongodb` and `redis`

## Usage

```bash
# 1. install dependencies
pnpm i

# 2. update .env file
cp .env.example .env

# 3.5. start mongodb and redis with docker-compose (optional)
docker-compose up -d

# 4. start consumer
ts-node src/consumers/mint-consumer.ts
ts-node src/consumers/metadata-consumer.ts

# 5. trigger
# use command line
ts-node src/triggers/command.ts collection check <collection_address> # check new nfts in collection
ts-node src/triggers/command.ts collection check-all # check all new nfts in all collections with config.full = false

# use api
# start api server
ts-node src/api/index.ts
```

- After fetching data, it will be saved to `nfts` collection in mongodb
- You can use command line or api to trigger fetching, check config, queue status. Run `ts-node src/triggers/command.ts --help` to see more details

## TODO:
- [ ] Add many configs at once to check it works
- [ ] Update getMetadata function to support more types of link
- [ ] Add api to get configs and nfts data
- [ ] Support nft ownership data

## Diagram

![image](https://github.com/letieu/nft-indexer/assets/53562817/ea45ef07-f8f7-40c0-846d-26ec502c10f3)
