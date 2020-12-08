module.exports = {
  apps: [{
    name: 'worker',
    script: './oldsrc/index.js',
    instances: 2,
    min_uptime: 1000,
    restart_delay: 2500
  }]
};
