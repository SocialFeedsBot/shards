/* REST Module */

const Ratelimiter = require('./Ratelimiter');
const RequestHandler = require('./RequestHandler');

const { Message } = require('../rest/structures/');

const Endpoints = require('./Endpoints');
const Constants = require('./Constants');

module.exports = class Rest {

  constructor(token, state) {
    this.token = `Bot ${token}`;

    this.state = state;
    this.ratelimiter = new Ratelimiter();
    this.requestHandler = new RequestHandler(this.ratelimiter, this.token);
  }

  async createMessage(channelID, data) {
    if (typeof data !== 'string' && !data.content && !data.embed && !data.file) {
      throw new Error('Missing content or embed');
    }
    if (typeof data === 'string') {
      return this.requestHandler.request(Endpoints.CHANNEL_MESSAGES(channelID), 'post', 'json', { content: data }).then((msg) => Message.setup(this.state, msg));
    } else if (data.file) {
      return this.requestHandler.request(Endpoints.CHANNEL_MESSAGES(channelID), 'post', 'multipart', data).then((msg) => Message.setup(this.state, msg));
    } else {
      return this.requestHandler.request(Endpoints.CHANNEL_MESSAGES(channelID), 'post', 'json', data).then((msg) => Message.setup(this.state, msg));
    }
  }

  async editMessage(channelID, messageID, data) {
    if (typeof data !== 'string' && !data.content && !data.embed) {
      throw new Error('Missing content or embed');
    }
    if (typeof data === 'string') {
      return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE(channelID, messageID), 'patch', 'json', { content: data });
    } else {
      return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE(channelID, messageID), 'patch', 'json', data);
    }
  }

  async deleteMessage(channelID, messageID) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE(channelID, messageID), 'delete', 'json');
  }

  async bulkDeleteMessages(channelID, messages) {
    if (messages.length < Constants.BULK_DELETE_MESSAGES_MIN || messages.length > Constants.BULK_DELETE_MESSAGES_MAX) {
      throw new Error(`Amount of messages to be deleted has to be between ${Constants.BULK_DELETE_MESSAGES_MIN} and ${Constants.BULK_DELETE_MESSAGES_MAX}`);
    }
    // (Current date - (discord epoch + 2 weeks)) * weird constant that everybody seems to use
    const oldestSnowflake = (Date.now() - 1421280000000) * 4194304;
    const forbiddenMessage = messages.find((m) => m < oldestSnowflake);
    if (forbiddenMessage) {
      throw new Error(`The message ${forbiddenMessage} is older than 2 weeks and may not be deleted using the bulk delete endpoint`);
    }
    return this.requestHandler.request(Endpoints.CHANNEL_BULK_DELETE(channelID), 'post', 'json', { messages });
  }

  async createReaction(channelID, messageID, emoji) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, emoji, '@me'), 'put', 'json');
  }

  async deleteReactionSelf(channelID, messageID, emoji) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, emoji, '@me'), 'delete', 'json');
  }

  async deleteReaction(channelID, messageID, emoji, userID) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, emoji, userID), 'delete', 'json');
  }

  async getReactions(channelID, messageID, emoji) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE_REACTION(channelID, messageID, emoji), 'get', 'json');
  }

  async deleteAllReactions(channelID, messageID) {
    return this.requestHandler.request(Endpoints.CHANNEL_MESSAGE_REACTIONS(channelID, messageID), 'delete', 'json');
  }

  async editChannelPermission(channelID, permissionID, data) {
    return this.requestHandler.request(Endpoints.CHANNEL_PERMISSION(channelID, permissionID), 'put', 'json', data);
  }

  async deleteChannelPermission(channelID, permissionID) {
    return this.requestHandler.request(Endpoints.CHANNEL_PERMISSION(channelID, permissionID), 'delete', 'json');
  }

  async getChannelInvites(channelID) {
    return this.requestHandler.request(Endpoints.CHANNEL_INVITES(channelID), 'get', 'json');
  }

  async createChannelInvite(channelID, data = {}) {
    return this.requestHandler.request(Endpoints.CHANNEL_INVITES(channelID), 'post', 'json', data);
  }

  async getWebhook(id, token) {
    return this.requestHandler.request(Endpoints.WEBHOOK_TOKEN(id, token), 'get', 'json');
  }

  async getChannelWebhooks(channelID) {
    return this.requestHandler.request(Endpoints.CHANNEL_WEBHOOKS(channelID), 'get', 'json');
  }

  async createChannelWebhook(channelID, data) {
    return this.requestHandler.request(Endpoints.CHANNEL_WEBHOOKS(channelID), 'post', 'json', data);
  }

};
