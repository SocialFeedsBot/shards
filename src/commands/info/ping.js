const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Basic ping command.'
    });
  }

  async run(context) {
    const before = Date.now();
    const msg = await context.rest.createMessage(context.channel.id, 'Ping!');
    const roundtrip = Date.now() - before;

    await context.rest.editMessage(context.channel.id, msg.id, `Pong! **${roundtrip}ms**.`);
  }

};
