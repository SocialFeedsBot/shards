module.exports = class Guild {

  constructor(data) {
    this.id = data._id;
    this.unavailable = data.unavailable;
    this.name = data.name;
    this.icon = data.icon;
    this.memberCount = data.memberCount;
    this.region = data.region;
    this.shardID = data.shardID;
    this.ownerID = data.ownerID;
  }

  get iconURL() {
    return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.png`;
  }

};
