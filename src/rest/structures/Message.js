const Guild = require('./Guild');
const Member = require('./Member');
const User = require('./User');
const Channel = require('./Channel');

module.exports = class Message {

  constructor(state, data) {
    this.state = state;
    this.id = data.id;
    this.channel = data.channel;
    this.guild = data.guild;
    this.content = data.content;
    this.type = data.type;
    this.member = data.member;
    this.author = data.author;
  }

  static async setup(state, data) {
    const channel = await state.channels.get(data.channel_id);
    if (!channel) return null;

    let guild;
    let author;
    let member;
    if (channel.guildID) {
      guild = await state.guilds.get(channel.guildID);
      guild = new Guild(guild);

      author = new User(data.author);
      if (data.member) {
        data.member.user = author;
        member = new Member(data.member);
      }
    } else {
      author = new User(data.author);
    }

    return new Message(state, {
      id: data.id, guild,
      channel: new Channel(channel, guild),
      member,
      author,
      content: data.content,
      type: data.type
    });
  }

};
