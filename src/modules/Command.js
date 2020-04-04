const { readdirSync } = require('fs');
const Member = require('../rest/structures/Member');

module.exports = class CommandModule extends Map {

  constructor(worker) {
    super();
    this.worker = worker;

    this.load();
  }

  find(func) {
    for (const item of this.values()) {
      if (func(item)) {
        return item;
      }
    }
    return undefined;
  }

  async execute(message, command) {
    if (!await this.commandChecks(message, command)) return;

    let args;
    try {
      args = await this.resolveArguments(message, command);
    } catch (err) {
      this.worker.rest.createMessage(message.channel.id, `:grey_exclamation: **${err.message}**\nPlease try the command again using the following format: \`${command.name} ${command.usage}\``);
      return;
    }

    if (args === false) return;

    try {
      await command.run({
        message,
        args: args,
        channel: message.channel,
        guild: message.channel.guild,
        author: message.author,
        member: message.member,
        worker: this.worker,
        rest: this.worker.rest
      });
    } catch (err) {
      this.worker.rest.createMessage(message.channel.id, ':exclamation: **Something went wrong** while running this command. It has been logged, please try again later.');
      this.worker.logger.error(err);
    }
  }

  async commandChecks(message, command) {
    if (command.guildOnly && !message.guild) {
      await this.worker.rest.createMessage(message.channel.id, ':grey_exclamation: **This command can only be run in servers**, try again in another server.');
      return false;
    }

    if (command.permissions.length) {
      const permissions = await message.member.getPermission(this.worker.state, message.guild);
      const has = command.permissions.filter(perm => permissions.has(perm));
      if (has.length !== command.permissions.length) {
        const missing = command.permissions.filter(perm => !has.includes(perm));
        await this.worker.rest.createMessage(message.channel.id, `:grey_exclamation: You are missing the required permissions: **${missing.map(p => p.replace(/^.|[A-Z]/g, match => match.toUpperCase())).join(', ')}**`);
        return false;
      }
    }

    if (command.botPermissions.length) {
      let user = await this.worker.state.users.get('self');
      let member = await this.worker.state.members.get(message.guild.id, user.selfID);

      member.user = user;
      member = new Member(member);

      const permissions = await member.getPermission(this.worker.state, message.guild);
      const has = command.botPermissions.filter(perm => permissions.has(perm));
      if (has.length !== command.botPermissions.length) {
        const missing = command.botPermissions.filter(perm => !has.includes(perm));
        await this.worker.rest.createMessage(message.channel.id, `:grey_exclamation: I am missing the required permissions: **${missing.map(p => p.replace(/^.|[A-Z]/g, match => match.toUpperCase())).join(', ')}**`);
        return false;
      }
    }

    return true;
  }

  async resolveArguments(message, command) {
    let originalArgs = message.content.match(/(?:[^\s"“”]+|["“”][^"“”]*["“”])+/g);
    if (!originalArgs) return false;
    originalArgs = originalArgs.splice(1, originalArgs.length);

    let raw = [...originalArgs.splice(0, command.args.length - 1)];
    if (originalArgs.length) {
      raw = [...raw, originalArgs.join(' ')];
    }

    if (raw.length < command.args.filter(arg => !arg.optional).length) {
      if (command.category === 'admin') return false;
      throw new Error('Insufficient arguments provided.');
    }

    const args = [];
    for (let index = 0; index < command.args.length; index++) {
      const fixed = /^["“”](.*)["“”]$/.exec(raw[index]);
      if (fixed) raw[index] = fixed[1];

      const argOptions = command.args[index];

      if (index === command.args.length - 1 && raw[index]) {
        raw[index] = raw.splice(index).join(' ');
      }

      let err;
      if (argOptions && argOptions.type) {
        let resolved;
        try {
          resolved = await require(`../resolvers/${argOptions.type}`)(this.worker, message, raw[index], argOptions);
        } catch (error) {
          if (argOptions.optional) {
            args[index] = undefined;
            raw.unshift(raw[index]);
            resolved = undefined;
          } else {
            err = error;
          }
        }

        if (err) throw err;

        if (Array.isArray(resolved)) {
          resolved = resolved[0];
        }

        args[index] = resolved;
      }
    }

    return args;
  }

  load() {
    const directory = readdirSync(`${__dirname}/../commands/`);
    directory.forEach(dir => {
      const inDirectory = readdirSync(`${__dirname}/../commands/${dir}/`);
      inDirectory.forEach(async file => {
        if (file.endsWith('.js')) {
          const Cmd = require(`${__dirname}/../commands/${dir}/${file}`);
          const cmd = new Cmd(file.replace('.js', ''), dir);
          this.set(file.replace('.js', ''), cmd);
        }
      });
    });
  }

};
