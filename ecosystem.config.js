module.exports = {
  apps: [
    {
      name: 'metadata-consumer',
      script: 'dist/consumers/metadata-consumer.js',
      instances: 4,
      exec_mode: 'cluster'
    },
    {
      name: 'mint-consumer',
      script: 'dist/consumers/mint-consumer.js',
      instances: 1
    },
    {
      name: 'mint-trigger',
      script: 'dist/triggers/command.js collection check-all',
      instances: 1,
      // run every 3 minutes
      restart_delay: 180000
    }
  ]
}
