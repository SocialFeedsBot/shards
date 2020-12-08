module.exports = (client) => {
  // Update the status.
  client.editStatus({ name: `${client.config.prefix}help | discord.gg/pKtCuVv` });
  client.logger.info('All shards ready.');
  client.gatewayClient.sendReady();
};
