module.exports = (client, message, input) => {
  let feed;
  if (['yt', 'youtube'].includes(input.toLowerCase())) {
    feed = 'youtube';
  } else if (['twitter', 'twit'].includes(input.toLowerCase())) {
    feed = 'twitter';
  } else if (['stream', 'twitch'].includes(input.toLowerCase())) {
    feed = 'twitch';
  } else if (['rss'].includes(input.toLowerCase())) {
    feed = 'rss';
  } else if (['reddit'].includes(input.toLowerCase())) {
    feed = 'reddit';
  } else if (['discord', 'discordstatus'].includes(input.toLowerCase())) {
    feed = 'discordstatus';
  }

  if (feed) {
    return feed;
  } else {
    throw new Error('Invalid feed type, use one of the following: `youtube`, `reddit`, `twitter`, `twitch`, `discordstatus` or `rss`');
  }
};
