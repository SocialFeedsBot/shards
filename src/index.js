/* Constants */
const config = require('../config');
const Eris = require('eris');
const GatewayClient = require('gateway-client');
const fs = require('fs');
const path = require('path');
require('eris-additions')(Eris, { enabled: ['Channel.awaitMessages', 'User.tag', 'Member.tag', 'Member.highestRole', 'Guild.me'] });

// Modules
const APIModule = require('./modules/API');
const CommandModule = require('./modules/Commands');
const PrometheusModule = require('./modules/Prometheus');

const Logger = require('./logger');
const logger = new Logger('Main', [config.token, config.gateway.secret || undefined]);

class SocialFeeds extends Eris.Client {

  constructor(gateway, clusterID, shardStart, shardEnd, shardCount) {
    super(config.token, {
      defaultImageFormat: 'png',
      defaultImageSize: 1024,
      intents: ['guilds', 'guildMessages', 'directMessages'],
      firstShardID: shardStart,
      lastShardID: shardEnd,
      maxShards: shardCount,
      restMode: true,
      messageLimit: 0,
      getAllUsers: false
    });

    this.gatewayClient = gateway;
    this.clusterID = clusterID;
    this.config = config;
    this.logger = logger;
    this.logger.extension('Gateway').debug(`Assigned cluster ${clusterID}, shards ${shardStart}-${shardEnd}/${shardCount}.`);

    this.api = new APIModule(config.api);
    this.commands = new CommandModule(this);
    this.prometheus = new PrometheusModule(this, config.prometheus);

    gateway
      .on('debug', (msg) => logger.extension('Gateway').debug(msg))
      .on('requestSharedGuilds', packet => gateway.sendSharedGuilds(packet, packet.data.guilds.filter(id => this.guilds.get(id))))
      .on('request', async (id, data) => {
        try {
          console.log(data.input);
          let res = await eval(data.input);
          gateway.resolve(id, res);
        } catch(err) {
          gateway.resolve(id, err.stack);
        }
        return undefined;
      });
  }

  async init() {
    // await this.database.connect();
    fs.readdirSync(path.resolve('src/events')).forEach((event) => {
      this.on(event.replace('.js', ''), (...args) => require(`./events/${event}`)(this, ...args));
    });

    this.commands.load();

    const gw = await this.getBotGateway();
    this.logger.debug(`Recommended shards: ${gw.shards} | Total sessions: ${gw.session_start_limit.total} | Remaining: ${gw.session_start_limit.remaining}`);

    this.connect();
  }

}

process.on('unhandledRejection', (e) => {
  logger.error('Unhandled rejection:', e.stack);
}).on('uncaughtException', (e) => {
  logger.error('Unhandled exception:', e.stack);
});

const worker = new GatewayClient(config.gateway.use, 'cluster', config.gateway.address, config.gateway.secret);

worker
  .on('error', (err) => logger.extension('Gateway').error(err))
  .on('connect', (ms) => logger.extension('Gateway').info(`Connected in ${ms}ms`))
  .on('restart', () => process.exit(1))
  .once('ready', ({ id, shard_start, shard_end, shard_count }) => {
    new SocialFeeds(worker, id, shard_start, shard_end, shard_count).init();
  });

worker.connect();
