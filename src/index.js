/* WORKER */

const config = require('../config');
const Redis = require('ioredis');
const amqp = require('amqplib');
const State = require('state-manager');

const Rest = require('./rest/');
const CommandModule = require('./modules/Command');
const APIModule = require('./modules/API');

const Message = require('./rest/structures/Message');

const { Logger } = require('./logger/');
const logger = new Logger('Worker', { sensitive: [config.token] });

class Worker {

  constructor() {
    this.config = config;
    this.logger = logger;

    this.redis = new Redis(config.redis);
    this.state = new State(this.redis, config.databaseURL, ['guilds', 'channels', 'roles', 'users', 'members']);
    this.rest = new Rest(this.config.token, this.state);

    this.commands = new CommandModule(this);
    this.api = new APIModule(this.config.apiURL, config.jwtSecret);
    this.startedAt = Date.now();
  }

  get uptime() {
    return Date.now() - this.startedAt;
  }

  async run() {
    const connection = await amqp.connect(config.amqp);
    const channel = await connection.createChannel();

    channel.assertQueue('discordfeeds', { durable: false });
    channel.consume('discordfeeds', (msg) => this.handleEvent(JSON.parse(msg.content.toString())), { noAck: true });
  }

  async handleEvent(event) {
    switch(event.t) {
      case 'MESSAGE_CREATE': {
        if (event.d.author.bot) return;
        const message = await Message.setup(this.state, event.d);
        const user = await this.state.users.get('self');

        const prefixRegex = new RegExp(`^(<@!?${user.selfID}>|${config.prefix.replace(/[.*+?^${}()|[\]\\]/g, 'g')})( *)?`);
        const match = message.content.match(prefixRegex);
        if (!match) return;
        const prefix = match[0];

        const content = message.content = message.content.substring(prefix.length);
        let command = content.split(' ')[0];
        command = command.toLowerCase().trim();

        const found = this.commands.get(command) || this.commands.find((cmd) => cmd.aliases.indexOf(command) !== -1);
        if (!found) return;

        if (found.category === 'admin' && !this.config.owners.includes(message.author.id)) return;

        await this.commands.execute(message, found);
      }
    }
  }

}

new Worker().run();

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.stack}`);
});
