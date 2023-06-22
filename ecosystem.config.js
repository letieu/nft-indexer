module.exports = {
  apps: [
    {
      name: 'metadata-consumer',
      script: 'dist/tasks/start-metadata-consumer.js',
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'mint-consumer',
      script: 'dist/tasks/start-mint-consumer.js',
      instances: 1
    },
    {
      name: 'index-mint-trigger',
      script: 'dist/tasks/trigger-index-mint.js',
      instances: 1,
      restart_delay: 180000
    }
  ]
}
