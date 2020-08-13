module.exports = (client, error, id) => {
  client.logger.error(`Shard ${id} disconnected (${error || 'No error'})`);
};
