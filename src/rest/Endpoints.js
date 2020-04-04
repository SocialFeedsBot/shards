const { REST_API_VERSION } = require('./Constants');

module.exports = {
  BASE_URL: `/api/v${REST_API_VERSION}`,
  BASE_HOST: 'https://discordapp.com',
  CDN_URL: 'https://cdn.discordapp.com',

  CHANNEL: (id) => `/channels/${id}`,
  CHANNEL_BULK_DELETE: (id) => `/channels/${id}`,
  CHANNEL_INVITES: (id) => `/channels/${id}/invites`,
  CHANNEL_MESSAGE_REACTION: (chanID, msgID, reaction) => `/channels/${chanID}/messages/${msgID}/reactions/${reaction}`,
  CHANNEL_MESSAGE_REACTION_USER: (chanID, msgID, reaction, userID) => `/channels/${chanID}/messages/${msgID}/reactions/${reaction}/${userID}`,
  CHANNEL_MESSAGE_REACTIONS: (chanID, msgID) => `/channels/${chanID}/messages/${msgID}/reactions`,
  CHANNEL_MESSAGE: (chanID, msgID) => `/channels/${chanID}/messages/${msgID}`,
  CHANNEL_MESSAGES: (chanID) => `/channels/${chanID}/messages`,
  CHANNEL_PERMISSION: (chanID, overID) => `/channels/${chanID}/permissions/${overID}`,
  CHANNEL_PERMISSIONS: (chanID) => `/channels/${chanID}/permissions`,
  CHANNEL_PIN: (chanID, msgID) => `/channels/${chanID}/pins/${msgID}`,
  CHANNEL_PINS: (chanID) => `/channels/${chanID}/pins`,
  CHANNEL_RECIPIENT: (groupID, userID) => `/channels/${groupID}/recipients/${userID}`,
  CHANNEL_TYPING: (chanID) => `/channels/${chanID}/typing`,
  CHANNEL_WEBHOOKS: (chanID) => `/channels/${chanID}/webhooks`,
  CHANNELS: '/channels',

  GATEWAY: '/gateway',
  GATEWAY_BOT: '/gateway/bot',

  GUILD: (guildID) => `/guilds/${guildID}`,
  GUILD_AUDIT_LOGS: (guildID) => `/guilds/${guildID}/audit-logs`,
  GUILD_BAN: (guildID, memberID) => `/guilds/${guildID}/bans/${memberID}`,
  GUILD_BANS: (guildID) => `/guilds/${guildID}/bans`,
  GUILD_CHANNELS: (guildID) => `/guilds/${guildID}/channels`,
  GUILD_EMBED: (guildID) => `/guilds/${guildID}/embed`,
  GUILD_EMOJI: (guildID, emojiID) => `/guilds/${guildID}/emojis/${emojiID}`,
  GUILD_EMOJIS: (guildID) => `/guilds/${guildID}/emojis`,
  GUILD_INVITES: (guildID) => `/guilds/${guildID}/invites`,
  GUILD_INTEGRATION: (guildID, integrationID) => `/guilds/${guildID}/integrations/${integrationID}`,
  GUILD_INTEGRATIONS: (guildID) => `/guilds/${guildID}/integrations`,
  GUILD_MEMBER: (guildID, memberID) => `/guilds/${guildID}/members/${memberID}`,
  GUILD_MEMBER_NICK: (guildID, memberID) => `/guilds/${guildID}/members/${memberID}/nick`,
  GUILD_MEMBER_ROLE: (guildID, memberID, roleID) => `/guilds/${guildID}/members/${memberID}/roles/${roleID}`,
  GUILD_MEMBERS: (guildID) => `/guilds/${guildID}/members`,
  GUILD_PRUNE: (guildID) => `/guilds/${guildID}/prune`,
  GUILD_ROLE: (guildID, roleID) => `/guilds/${guildID}/roles/${roleID}`,
  GUILD_ROLES: (guildID) => `/guilds/${guildID}/roles`,
  GUILD_VOICE_REGIONS: (guildID) => `/guilds/${guildID}/regions`,
  GUILD_WEBHOOKS: (guildID) => `/guilds/${guildID}/webhooks`,
  GUILDS: '/guilds',

  INVITE: (inviteID) => `/invite/${inviteID}`,
  OAUTH2_APPLICATION: (appID) => `/oauth2/applications/${appID}`,

  USER: (userID) => `/users/${userID}`,
  USER_CHANNELS: (userID) => `/users/${userID}/channels`,
  USER_GUILD: (userID, guildID) => `/users/${userID}/guilds/${guildID}`,
  USER_GUILDS: (userID) => `/users/${userID}/guilds`,
  USERS: '/users',

  VOICE_REGIONS: '/voice/regions',

  WEBHOOK: (hookID) => `/webhooks/${hookID}`,
  WEBHOOK_SLACK: (hookID) => `/webhooks/${hookID}/slack`,
  WEBHOOK_TOKEN: (hookID, token) => `/webhooks/${hookID}/${token}`,
  WEBHOOK_TOKEN_SLACK: (hookID, token) => `/webhooks/${hookID}/${token}/slack`

};
