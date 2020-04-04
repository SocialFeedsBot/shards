const Permission = require('./Permission');

module.exports = class Role {

  constructor(data) {
    this.id = data._id;
    this.name = data.name;
    this.mentionable = data.mentionable;
    this.managed = data.managed;
    this.hoist = data.hoist;
    this.color = data.color;
    this.position = data.position;
    this.permissions = new Permission(data.permissions);
  }

};
