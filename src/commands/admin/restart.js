const Command = require('../../structures/Command');
const { execSync } = require('child_process');

module.exports = class extends Command {

  async run(context) {
    await context.rest.createMessage(context.channel.id, 'Reloading workers.');
    execSync('pm2 reload worker');
  }

};
