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

4. Start the consumer to handle the job. There are two consumers available:
   - To load newly minted NFTs and save them to MongoDB, run:
     ```bash
     ts-node src/consumers/mint-consumer.ts
     ```
   - To load NFT metadata and save it to MongoDB, run:
     ```bash
     ts-node src/consumers/metadata-consumer.ts
     ```
   You can run multiple instances of the consumer for better performance.

5. To trigger the fetching process, you have two options:

   - Using the command line:
     - To create jobs for a specific collection by its address, run:
       ```bash
       ts-node src/triggers/command.ts collection check <collection_address>
       ```
     - To create jobs for all collections specified in the `configs` table, run:
       ```bash
       ts-node src/triggers/command.ts collection check-all
       ```

   - Using the HTTP server:
     - Start the HTTP server by running the following command, and access the API at http://localhost:3000/docs:
       ```bash
       ts-node src/triggers/http.ts
       ```

   Run `ts-node src/triggers/command.ts --help` to see more detailed information on available commands.

After fetching the data, it will be saved in the `nfts` collection in your MongoDB database. You can use either the command line or the API to trigger the fetching process, check configurations, and monitor the queue status.

## TODO:
- [ ] Add support for retrieving NFT ownership data

## Diagram

![image](https://github.com/letieu/nft-indexer/assets/53562817/ea45ef07-f8f7-40c0-846d-26ec502c10f3)
