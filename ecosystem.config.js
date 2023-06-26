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
      // cron job to run every 5 minutes for command collection check-all
      name: 'mint-trigger',
      script: 'dist/triggers/command.js',
      args: 'collection check-all',
      instances: 1,
      cron_restart: '*/5 * * * *',
      auto_restart: false
    },
    {
      name: 'http-server',
      script: 'dist/triggers/http.js',
      instances: 1
    }
  ]
}
