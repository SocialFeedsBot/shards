const master = require('cluster');
const config = require('../config.json');
const superagent = require('superagent');

const Logger = require('./logger/');
const logger = new Logger('ClusterManager');

class ClusterManager {

  constructor() {
    this.clusters = new Map();
  }

  async run() {
    const { body: gw } = await superagent.get('https://discord.com/api/v8/gateway/bot')
      .set('Authorization', `Bot ${config.token}`);
    logger.debug(`Recommended shards: ${gw.shards} | Total sessions: ${gw.session_start_limit.total} | Remaining: ${gw.session_start_limit.remaining}`);

    const shardsPerCluster = Math.ceil(config.shards / config.clusters);

    for (let id = 0; id < config.clusters; id++) {
      const firstShardID = shardsPerCluster * id;
      let lastShardID = ((id + 1) * shardsPerCluster) - 1;
      if(lastShardID > config.shards - 1) lastShardID = config.shards - 1;

      setTimeout(() => {
        const worker = master.fork({ clusterID: id, firstShardID, lastShardID, totalShards: config.shards });
        this.clusters.set(worker.id, { worker, firstShardID, lastShardID });
        this.handleCluster({ worker, firstShardID, lastShardID });
      }, id * 1000);
    }
  }

  handleCluster({ worker, firstShardID, lastShardID }) {
    worker.on('exit', () => {
      logger.error(`Cluster ${worker.id} offline (shards ${firstShardID}-${lastShardID})`);

      this.clusters.delete(worker.id);

      let newWorker = master.fork({ clusterID: worker.id, firstShardID, lastShardID, totalShards: config.shards });
      newWorker.id = worker.id;

      this.clusters.set(newWorker.id, { worker: newWorker, firstShardID, lastShardID });
      this.handleCluster({ worker: newWorker, firstShardID, lastShardID });
    });
  }

}

if (master.isMaster) {
  new ClusterManager().run();
} else {
  require('./cluster');
}
