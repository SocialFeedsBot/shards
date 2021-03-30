const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      hidden: true
    });
  }

  async run({ reply, client }) {
    reply(`\`\`\`\n${client.logger.getHistory()}\n\`\`\``);
  }

};
