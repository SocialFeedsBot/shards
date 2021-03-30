const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      args: [{ type: 'text', label: 'msg', optional: false }], hidden: true
    });
  }

  async run({ reply, client }) {
    reply(`\`\`\`\n${client.logger.getHistory()}\n\`\`\``);
  }

};
