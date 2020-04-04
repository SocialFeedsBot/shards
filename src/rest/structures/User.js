module.exports = class User {

  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.discriminator = data.discriminator;
    this.avatar = data.avatar;
    this.bot = !!data.bot;
  }

  get avatarURL() {
    return this.avatar ?
      `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.png?size=1024` :
      `https://cdn.discordapp.com/embed/avatars/${parseInt(this.discriminator) % 5}.png`;
  }

};
