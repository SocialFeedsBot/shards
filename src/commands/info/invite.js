const Command = require('../../structures/Command');

module.exports = class extends Command {

  constructor(...args) {
    super(...args, {
      description: 'Invite the bot.'
    });
  }

  async run({ reply }) {
    await reply(`<https://discordapp.com/api/oauth2/authorize?client_id=640989075452723200&scope=bot>`);
  }

};
