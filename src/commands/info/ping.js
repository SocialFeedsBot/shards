const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Basic ping command.'
    });
  }

  async run({ reply }) {
    const before = Date.now();
    const msg = await reply('Pong! `...ms`');
    const roundtrip = Date.now() - before;

    await msg.edit(`Pong \`${roundtrip}ms\``);
  }

};
