module.exports = (client, id) => {
  client.logger.warn(`Shard ${id} resumed.`);
  client.datadog.increment('shard-resume');
};
