module.exports = (client, error, id) => {
  client.logger.error(`Shard ${id} disconnected (${error || 'No error'})`);
  client.datadog.increment('shard-disconnect');
};
