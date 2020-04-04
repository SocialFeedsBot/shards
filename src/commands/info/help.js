const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Views a list of commands or extended help on a particular command.',
      args: [{ type: 'text', label: 'command', optional: true }]
    });
  }

  async run(context) {
    if (context.args[0]) {
      const command = context.worker.commands.get(context.args[0].toLowerCase()) || context.worker.commands.find((c) => c.aliases.indexOf(context.args[0].toLowerCase()) !== -1);
      if (!command || command.hidden) {
        context.rest.createMessage(context.channel.id, `:grey_exclamation: **Unable to find command** with that name or alias. Run the help command for commands.`);
        return;
      }

      context.rest.createMessage(context.channel.id, {
        embed: {
          title: `Command Information for ${command.name}`,
          description: command.description || 'None',
          fields: [
            { name: 'Usage', value: `${command.name} ${command.usage}` },
            { name: 'Requirements', value: 'N/A' },
            { name: 'Aliases', value: command.aliases.length ? command.aliases.join(', ') : 'None' }
          ]
        }
      });
    } else {
      const categories = {};
      const fields = [];

      context.worker.commands.forEach((command) => {
        if (command.category !== 'admin') {
          if (!categories[command.category]) categories[command.category] = [];
          categories[command.category].push(command.name);
        }
      });

      for (const category in categories) {
        categories[category].sort();
        fields.push({
          name: category.charAt(0).toUpperCase() + category.substring(1),
          value: `\`${categories[category].join('`  `')}\``
        });
      }

      context.rest.createMessage(context.channel.id, { embed: {
        title: `DiscordFeeds Commands`,
        fields: fields
      } });

    }
  }

};

