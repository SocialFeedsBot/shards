const Channel = require('../rest/structures/Channel');

module.exports = async (worker, message, input) => {
  if (input.match(/<#(\d{17,21})>/)) input = input.match(/<#(\d{17,21})>/)[1];

  const channels = (await worker.state.channels.getAll()).filter(c => c.guildID === message.guild.id).map(channel => new Channel(channel));
  const found = channels
    .filter(ch => ch.type === 0)
    .filter(ch => input === ch.id ||
        input.toLowerCase() === ch.name.toLowerCase() ||
        ch.name.toLowerCase().startsWith(input.toLowerCase()) ||
        ch.name.toLowerCase().endsWith(input.toLowerCase()) ||
        ch.name.toLowerCase().includes(input.toLowerCase())
    );

  if (found.length) return found[0];
  else throw new Error('No channel found.');
};

