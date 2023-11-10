module.exports = {
  apps: [
    {
      name: 'metadata-consumer',
      script: 'dist/consumers/metadata-consumer.js',
      instances: 3,
      exec_mode: 'cluster'
    },
    {
      name: 'mint-consumer',
      script: 'dist/consumers/mint-consumer.js',
      instances: 1
    },
    {
      name: 'nft-save-consumer',
      script: 'dist/consumers/nft-save-consumer.js',
      instances: 1
    },
    {
      name: 'mint-trigger',
      script: 'dist/triggers/command.js',
      args: 'collection check-all',
      instances: 1,
      restart_delay: 180000 // 3 minutes
    },
    {
      name: 'http-server',
      script: 'dist/triggers/http.js',
      instances: 1
    }
  ]
}
