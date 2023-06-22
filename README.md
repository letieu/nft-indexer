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

# 3. build
pnpm build

# 3.5. start mongodb and redis with docker-compose (optional)
docker-compose up -d

# 4. run
pm2 start ecosystem.config.js

# 5. check logs
pm2 logs
```

- Update `configs` collection in mongodb to add new NFT contract address for fetching data
- After fetching data, it will be saved to `nfts` collection in mongodb
