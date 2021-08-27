const config = require('./config.json');
const Logger = require('./logger/');
const GatewayClient = require('./gateway/');
const Eris = require('eris');

const logger = new Logger('Shards');
const client = new Eris.Client(config.token);

process.on('unhandledRejection', (e) => {
  logger.error('Unhandled rejection:', e.stack);
}).on('uncaughtException', (e) => {
  logger.error('Unhandled exception:', e.stack);
});

const worker = new GatewayClient(config.gateway.use, 'shards', config.gateway.address,
  config.gateway.secret);

worker
  .on('error', (err) => logger.extension('Gateway').error(err))
  .on('connect', (ms) => logger.extension('Gateway').info(`Connected in ${ms}ms`))
  .once('ready', () => {
    client.connect();
  })
  .on('debug', (msg) => logger.extension('Gateway').debug(msg))
  .on('requestSharedGuilds', packet => worker.sendSharedGuilds(packet, packet.data.filter(id => client.guilds.get(id))))
  .on('getGuild', ({ guildID }, cb) => cb(client.guilds.get(guildID) ? client.guilds.get(guildID).toJSON() : null));

worker.getExtraStats = () => ({
  guilds: client.guilds.size,
  users: client.users.size,
  shards: client.shards.map(s => ({
    id: s.id,
    status: s.status,
    guilds: client.guilds.filter(g => g.shard.id === s.id).length,
    latency: s.latency
  }))
});

client.on('ready', () => {
  logger.info('Ready');
  worker.sendReady();
}).on('shardReady', (id) => logger.extension(`S${id}`).info('Ready'))
  .on('shardResume', (id) => logger.extension(`S${id}`).warn('Resumed'))
  .on('shardDisconnect', (err, id) => logger.extension(`S${id}`).error(`Disconnected: ${err || 'no error'}`));

worker.connect();
