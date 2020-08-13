module.exports = (client, shard) => {
  client.logger.info(`Shard ${shard}/${client.options.maxShards} ready.`);
};
