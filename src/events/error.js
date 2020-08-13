module.exports = (client, error, id) => {
  client.logger.extension('Eris').erorr(error.stack);
};
