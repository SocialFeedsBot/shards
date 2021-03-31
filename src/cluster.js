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
const logger = new Logger(`C${Number(process.env.clusterID)}`, [config.token, config.gateway.secret || undefined]);

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
    this.logger.extension(`C${Number(process.env.clusterID)}/Gateway`).debug(`Assigned cluster ${clusterID}, shards ${shardStart}-${shardEnd}/${shardCount}.`);

    this.api = new APIModule(config.api);
    this.commands = new CommandModule(this);
    this.prometheus = new PrometheusModule(this, config.prometheus);

    gateway.getExtraStats = () => ({
      guilds: this.guilds.size,
      users: this.users.size,
      clusterID: Number(process.env.clusterID),
      shards: this.shards.map(s => ({
        id: s.id,
        status: s.status,
        guilds: this.guilds.filter(g => g.shard.id === s.id).length,
        latency: s.latency
      }))
    });

    gateway.on('debug', (msg) => logger.extension('Gateway').debug(msg))
      .on('requestSharedGuilds', packet => gateway.sendSharedGuilds(packet, packet.data.filter(id => this.guilds.get(id))))
      .on('getGuild', ({ guildID }, cb) => cb(this.guilds.get(guildID).toJSON()))
      .on('getCommands', (_, cb) => {
        cb(this.commands.map(cmd => ({
          name: cmd.name,
          aliases: cmd.aliases,
          description: cmd.description,
          permissions: cmd.permisisons,
          args: cmd.args,
          hidden: cmd.hidden,
          botPermissions: cmd.botPermissions,
          guildOnly: cmd.guildOnly
        })));
      });
  }

  async init() {
    // await this.database.connect();
    fs.readdirSync(path.resolve('src/events')).forEach((event) => {
      this.on(event.replace('.js', ''), (...args) => require(`./events/${event}`)(this, ...args));
    });

    this.commands.load();

    this.connect();
  }

}

process.on('unhandledRejection', (e) => {
  logger.error('Unhandled rejection:', e.stack);
}).on('uncaughtException', (e) => {
  logger.error('Unhandled exception:', e.stack);
});

const worker = new GatewayClient(config.gateway.use, 'cluster', config.gateway.address,
  config.gateway.secret, Number(process.env.clusterID));

worker
  .on('error', (err) => logger.extension(`C${Number(process.env.clusterID)}/Gateway`).error(err))
  .on('connect', (ms) => logger.extension(`C${Number(process.env.clusterID)}/Gateway`).info(`Connected in ${ms}ms`))
  .once('ready', () => {
    new SocialFeeds(worker, Number(process.env.clusterID), Number(process.env.firstShardID),
      Number(process.env.lastShardID), Number(process.env.totalShards)).init();
  });

worker.connect();
