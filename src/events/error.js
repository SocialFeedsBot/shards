module.exports = (client, error, id) => {
  client.logger.extension('Eris').error(error.stack);
};
