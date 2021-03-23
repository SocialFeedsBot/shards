module.exports = (client, id) => {
  client.logger.warn(`Shard ${id} resumed.`);
  client.prometheus.increment('shardResume');
};
