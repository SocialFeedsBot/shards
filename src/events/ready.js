module.exports = (client) => {
  // Update the status.
  client.editStatus({ name: `${client.config.prefix}help` });

  client.logger.info('All shards ready.');
};
