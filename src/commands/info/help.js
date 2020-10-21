const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Views a list of commands or extended help on a particular command.\n\n`command` is the name of the command you want help on.',
      args: [{ type: 'text', label: 'command', optional: true }]
    });
  }

  async run({ client, reply, args }) {
    if (args.command) {
      const command = client.commands.get(args.command.toLowerCase()) || client.commands.find((c) => c.aliases.indexOf(args.command.toLowerCase()) !== -1);
      if (!command || command.hidden || command.category === 'admin') {
        await reply('That command does not exist.', { success: false });
        return;
      }

      reply.withEmbed()
        .setColour('orange')
        .setTitle(`Command info for ${command.name}`)
        .setDescription(command.description || 'None')
        .addField('Usage', `${command.name} ${command.usage}`)
        .addField('Requirements', command.permissions.length ? command.permissions.join(', ') : 'None')
        .addField('Aliases', command.aliases.length ? command.aliases.join(', ') : 'None')
        .send();
    } else {
      const categories = {};
      const embed = reply.withEmbed()
        .setColour('orange')
        .setTitle('Commands');

      client.commands.forEach((command) => {
        if (command.category !== 'admin') {
          if (!categories[command.category]) categories[command.category] = [];
          categories[command.category].push(command.name);
        }
      });

      for (const category in categories) {
        categories[category].sort();
        embed.addField(category.charAt(0).toUpperCase() + category.substring(1), `\`${categories[category].join('`  `')}\``);
      }

      embed.send();
    }
  }

};

