# Load NFTs data from evm blockchain to mongodb

## Install

Requires:

- [pnpm](https://pnpm.io/installation)
- [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [mongodb](https://docs.mongodb.com/manual/installation/)
- [redis](https://redis.io/topics/quickstart)

```bash
# 1. install dependencies
pnpm i

# 2. update .env file

# 3. build
pnpm build

# 4. run
pm2 start ecosystem.config.js
```
