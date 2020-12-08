const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      args: [{ type: 'text', label: 'target', optional: false }, { type: 'int', label: 'id', optional: true }], hidden: true
    });
  }

  async run({ reply, client, args: { target, id } }) {
    await reply(`Restarting services with type **${target}**`);
    client.gatewayClient.restart({ name: target, id: id === 'all' ? 'all' : ([id] || 'all') });
  }

};
