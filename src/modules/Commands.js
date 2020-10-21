/* Database Module */
const { Collection } = require('eris');
const fs = require('fs');
const path = require('path');
const reply = require('../utils/reply');

module.exports = class CommandsModule extends Collection {

  constructor(client) {
    super();
    this.client = client;
  }

  load() {
    const categories = fs.readdirSync(path.resolve('src', 'commands'));
    categories.forEach((category) => {
      const commands = fs.readdirSync(path.resolve('src', 'commands', category));
      commands.forEach((file) => {
        const Command = require(path.resolve('src', 'commands', category, file));
        this.set(file.replace('.js', ''), new Command(file.replace('.js', ''), category));
      });
    });
  }

  async execute(message, command) {
    reply(message);
    if (!await this.commandChecks(message, command)) return;

    let args = await this.resolveArguments(message, command);
    if (args === false) return;

    try {
      await command.run({
        message: message,
        reply: message.reply,
        args: args,
        channel: message.channel,
        guild: message.channel.guild,
        author: message.author,
        member: message.member,
        client: this.client,
        resolve: (type, input) => require(`../resolvers/${type}`)(this.client, message, input)
      });
    } catch (err) {
      message.reply(`An error occurred, please try again later or report this error to our support server.\n${err.message}`, { success: false });
      this.client.logger.error(err.stack);
    }
  }

  async commandChecks(message, command) {
    if (command.guildOnly && !message.channel.guild) {
      await message.reply('**This command is only available in servers**, please try again in a server.', { success: false });
      return false;
    }

    if (command.permissions.length) {
      const permissions = command.permissions.filter(perm => message.channel.permissionsOf(message.author.id).has(perm));
      if (permissions.length !== command.permissions.length) {
        const missing = command.permissions.filter(perm => !permissions.includes(perm));
        await message.reply(`You are missing the required permissions: **${missing.map(p => p.replace(/^.|[A-Z]/g, match => match.toUpperCase())).join(', ')}**`, { success: false });
        return false;
      }
    }

    if (command.botPermissions.length) {
      const permissions = command.botPermissions.filter(perm => message.channel.permissionsOf(this.client.user.id).has(perm));
      if (permissions.length !== command.botPermissions.length) {
        const missing = command.botPermissions.filter(perm => !permissions.includes(perm));
        await message.reply(`I am missing the required permissions: **${missing.map(p => p.replace(/^.|[A-Z]/g, match => match.toUpperCase())).join(', ')}**`, { success: false });
        return false;
      }
    }

    return true;
  }

  async resolveArguments(message, command) {
    let messageArgs;

    if (message.content.length >= 1) messageArgs = message.content.split(' ').splice(1);
    else messageArgs = [];

    if (messageArgs.length < command.args.filter(arg => !arg.optional).length) {
      message.reply(`**Insufficient arguments provided for the ${command.name} command.**\nTry again using the command as shown: \`${command.name} ${command.usage}\` or use \`help ${command.name}\` for more help.`);
      return false;
    }

    const args = {};
    let a = 0;

    for (let arg of command.args) {
      if (arg.optional) args[arg.label || arg.type] = arg.default;

      let rawArg = messageArgs[a];
      if (!rawArg) continue;

      const quoted = rawArg.startsWith('"');

      if (command.args.indexOf(arg) === command.args.length - 1) rawArg = messageArgs.slice(a).join(' ');
      if (quoted) {
        const nextQuotedArg = messageArgs.findIndex((searchArg, i) => searchArg.endsWith('"') && i >= a);

        if(nextQuotedArg > -1) {
          rawArg = messageArgs.slice(a, nextQuotedArg + 1).join(' ').replace(/"/g, '');
          a = nextQuotedArg;
        }
      }

      let resolvedArg = await require(`../resolvers/${arg.type}`)(this.client, message, rawArg, arg);
      if (resolvedArg === undefined || resolvedArg === null) {
        if (arg.optional && rawArg === '') {
          resolvedArg = arg.default;
        } else {
          message.reply.withEmbed()
            .setTitle(`Invalid argument provided for **${arg.label || arg.type}**`)
            .setDescription(`${command.description}\n\n**Usage:** \`${command.name} ${command.usage}\``)
            .setColour('red')
            .send();
        }
        return false;
      }

      args[arg.label || arg.type] = resolvedArg;

      a++;
    }

    return args;
  }

};
