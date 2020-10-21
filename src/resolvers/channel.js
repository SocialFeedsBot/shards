module.exports = async (client, message, input) => {
  if (input.match(/<#(\d{17,21})>/)) input = input.match(/<#(\d{17,21})>/)[1];

  const found = message.channel.guild.channels
    .filter(ch => ch.type === 0)
    .filter(ch => input === ch.id ||
        input.toLowerCase() === ch.name.toLowerCase() ||
        ch.name.toLowerCase().startsWith(input.toLowerCase()) ||
        ch.name.toLowerCase().endsWith(input.toLowerCase()) ||
        ch.name.toLowerCase().includes(input.toLowerCase())
    );

  if (found.length) return found[0];
  else return null;
};

